import { mkdir, readFile, writeFile } from 'fs/promises';
import { extname, join } from 'path';

import { compareRefence, extractors, mergeTranslations, normalizePlurals, translationBuilder } from 'bc-gettext-utils';
import { po } from 'gettext-parser';
import { glob } from 'glob';

import { makeDotNetProjects, makeWordPressProjects } from '../projects.js';

const wordPressOptions = {
  string: [ '__', '_e', 'esc_html__', 'esc_html_e', 'esc_attr__', 'esc_attr_e' ],
  particularString: [ '_x', '_ex', 'esc_html_x', 'esc_attr_x' ],
  pluralString: '_n',
  particularPluralString: '_nx',
  reverseContext: true,
};

let updatedFiles = 0;

export async function updateAllTranslations( config, rootPath ) {
  if ( config.projects != null ) {
    const projects = makeDotNetProjects( config );

    for ( const project of projects )
      await updateDotNetTranslations( project, rootPath, config.languages, config.extensions );
  } else {
    const projects = makeWordPressProjects( config );

    for ( const project of projects )
      await updateWordPressTranslations( project, rootPath, config.languages );
  }

  if ( updatedFiles == 0 )
    console.log( 'Up to date' );
}

async function updateDotNetTranslations( project, rootPath, languages, extensions ) {
  await processDomain( project, rootPath, '', '**', [ 'bin/**', 'obj/**', 'publish/**', 'src/**', 'wwwroot/**' ], languages, extensions );
  await processDomain( project, rootPath, '.js', 'src/**', [], languages, extensions );
}

async function processDomain( project, rootPath, suffix, pattern, ignore, languages, extensions ) {
  const { projectName, domain, translations, filter } = project;

  const files = await glob( pattern, { cwd: join( rootPath, projectName ), ignore, nodir: true, posix: true } );
  files.sort( (a, b) => a.localeCompare( b, undefined, { sensitivity: 'base' } ) );

  const builder = translationBuilder();

  for ( const file of files ) {
    let ext = extname( file ).slice( 1 ).toLocaleLowerCase();
    if ( extensions != null && extensions[ ext ] != null )
      ext = extensions[ ext ];
    if ( extractors[ ext ] != null ) {
      const contents = await readFile( join( rootPath, projectName, file ), 'utf-8' );
      builder.add( `../${file}`, extractors[ ext ]( contents ) );
    }
  }

  const languagesPath = join( rootPath, projectName, 'languages' );

  for ( const language of languages ) {
    if ( translations.includes( language.name ) ) {
      const name = `${domain}${suffix}.${language.name}`;
      await updateOrCreatePoFile( name, projectName, languagesPath, builder, language, filter );
    }
  }
}

async function updateWordPressTranslations( project, rootPath, languages ) {
  const { projectName, projectPath, projectType, translations, filter } = project;

  const files = await glob( '**', { cwd: join( rootPath, projectPath ), ignore: [ 'assets/**' ], nodir: true, posix: true } );
  files.sort( (a, b) => a.localeCompare( b, undefined, { sensitivity: 'base' } ) );

  const builder = translationBuilder();

  for ( const file of files ) {
    const ext = extname( file ).slice( 1 ).toLocaleLowerCase();
    if ( extractors[ ext ] != null ) {
      const contents = await readFile( join( rootPath, projectPath, file ), 'utf-8' );
      builder.add( `../${file}`, extractors[ ext ]( contents, wordPressOptions ) );
    }
  }

  const languagesPath = join( rootPath, projectPath, 'languages' );

  for ( const language of languages ) {
    if ( translations.includes( language.name ) ) {
      const name = projectType == 'theme' ? language.name : `${projectName}-${language.name}`;
      await updateOrCreatePoFile( name, projectName, languagesPath, builder, language, filter );
    }
  }
}

async function updateOrCreatePoFile( name, projectName, languagesPath, builder, language, filter ) {
  const poFile = `${name}.po`;

  const poPath = join( languagesPath, poFile );

  const { nplurals = 2, plural = 'n != 1' } = language;

  let existingPo = null;

  try {
    existingPo = await readFile( poPath );
  } catch ( err ) {
    if ( err.code != 'ENOENT' )
      throw err;
  }

  let headers;
  let mergedTranslations;
  let statusMessage;
  
  const filteredTranslations = filter != null ? filter( builder.translations, language.name ) : builder.translations;

  if ( existingPo != null ) {
    const existingData = po.parse( existingPo );

    const { translations, added, updated, deleted } = mergeTranslations( existingData.translations, filteredTranslations );

    if ( added == 0 && updated == 0 && deleted == 0 )
      return false;

    headers = existingData.headers;
    mergedTranslations = translations;

    statusMessage = `Updated ${poFile} (${added} added/${updated} updated/${deleted} deleted messages)`;
  } else {
    const count = filter != null ? Object.values( filteredTranslations ).reduce( ( sum, o ) => sum + Object.values( o ).length, 0 ) : builder.count;

    if ( count == 0 )
      return false;

    headers = {
      'MIME-Version': '1.0',
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Transfer-Encoding': '8bit',
      'Project-Id-Version': projectName,
      'Language': language.name.replace( '-', '_' ),
      'Plural-Forms': `nplurals=${nplurals}; plural=(${plural});`,
    };

    mergedTranslations = filteredTranslations;

    statusMessage = `Created ${poFile} (${count} messages)`;
  }

  const translations = normalizePlurals( mergedTranslations, nplurals );

  const generatedPo = po.compile( { headers, translations }, { sort: compareRefence, eol: '\r\n' } );

  await mkdir( languagesPath, { recursive: true } );

  await writeFile( poPath, generatedPo );

  console.log( statusMessage );

  updatedFiles++;
}
