import { readFile } from 'fs/promises';
import { join, extname } from 'path';

import { translationBuilder, extractors } from 'bc-gettext-utils';
import { updateOrCreatePoFile } from 'bc-tools-common';
import { glob } from 'glob';

import { makePackages } from '../packages.js';

const options = {
  string: [ '__', '_e', 'esc_html__', 'esc_html_e', 'esc_attr__', 'esc_attr_e' ],
  particularString: [ '_x', '_ex', 'esc_html_x', 'esc_attr_x' ],
  pluralString: '_n',
  particularPluralString: '_nx',
  reverseContext: true,
};

let updatedFiles = 0;

export async function updateAllTranslations( buildConfig, rootPath ) {
  const packages = makePackages( buildConfig );

  for ( const _package of packages )
    await updateTranslations( _package, rootPath, buildConfig.languages );

  if ( updatedFiles == 0 )
    console.log( 'Up to date' );
}

async function updateTranslations( _package, rootPath, languages ) {
  const { packageName, packagePath, packageType, translations } = _package;

  const files = await glob( '**', { cwd: join( rootPath, packagePath ), ignore: [ 'assets/**' ], nodir: true, posix: true } );
  files.sort( (a, b) => a.localeCompare( b, undefined, { sensitivity: 'base' } ) );

  const builder = translationBuilder();

  for ( const file of files ) {
    const ext = extname( file ).slice( 1 ).toLocaleLowerCase();
    if ( extractors[ ext ] != null ) {
      const contents = await readFile( join( rootPath, packagePath, file ), 'utf-8' );
      builder.add( `../${file}`, extractors[ ext ]( contents, options ) );
    }
  }

  const languagesPath = join( rootPath, packagePath, 'languages' );

  for ( const language of languages ) {
    if ( translations.includes( language.name ) ) {
      const name = packageType == 'theme' ? language.name : `${packageName}-${language.name}`;
      if ( await updateOrCreatePoFile( name, packageName, languagesPath, builder, language ) )
        updatedFiles++;
    }
  }
}
