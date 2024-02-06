import { readFile } from 'fs/promises';
import { join, extname } from 'path';

import { translationBuilder, extractors } from 'bc-gettext-utils';
import { updateOrCreatePoFile } from 'bc-tools-common';
import { glob } from 'glob';

let updatedFiles = 0;

export async function updateAllTranslations( languagesConfig, rootPath ) {
  const { projects, languages, extensions } = languagesConfig;

  for ( const project of projects )
    await updateTranslations( project, rootPath, languages, extensions );

  if ( updatedFiles == 0 )
    console.log( 'Up to date' );
}

async function updateTranslations( project, rootPath, languages, extensions ) {
  let projectName, domain;
  if ( typeof project == 'string' ) {
    projectName = project;
    domain = project;
  } else {
    projectName = project.name;
    domain = project.domain;
  }

  await processDomain( projectName, rootPath, domain, '**', [ 'bin/**', 'obj/**', 'publish/**', 'src/**', 'wwwroot/**' ], languages, extensions );
  await processDomain( projectName, rootPath, domain + '.js', 'src/**', [], languages, extensions );
}

async function processDomain( projectName, rootPath, domain, pattern, ignore, languages, extensions ) {
  const files = await glob( pattern, { cwd: join( rootPath, projectName ), ignore, nodir: true, posix: true } );
  files.sort( (a, b) => a.localeCompare( b, undefined, { sensitivity: 'base' } ) );

  const builder = translationBuilder();

  for ( const file of files ) {
    const ext = extname( file ).slice( 1 ).toLocaleLowerCase();
    if ( extensions != null && extensions[ ext ] != null )
      ext = extensions[ ext ];
    if ( extractors[ ext ] != null ) {
      const contents = await readFile( join( rootPath, projectName, file ), 'utf-8' );
      builder.add( `../${file}`, extractors[ ext ]( contents ) );
    }
  }

  const languagesPath = join( rootPath, projectName, 'languages' );

  for ( const language of languages ) {
    const name = `${domain}.${language.name}`;
    if ( await updateOrCreatePoFile( name, projectName, languagesPath, builder, language ) )
      updatedFiles++;
  }
}
