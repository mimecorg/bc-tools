import { readFile, writeFile } from 'fs/promises';
import { basename, join } from 'path';

import { compareRefence } from 'bc-gettext-utils';
import { po, mo } from 'gettext-parser';

import { makeDotNetProjects, makeWordPressProjects } from '../projects.js';

export async function buildAllTranslations( config, rootPath ) {
  if ( config.projects != null ) {
    const projects = makeDotNetProjects( config );

    for ( const project of projects )
      await buildDotNetTranslations( project, rootPath, config.languages );
  } else {
    const projects = makeWordPressProjects( config );

    for ( const project of projects )
      await buildWordPressTranslations( project, rootPath, config.languages );
  }
}

async function buildDotNetTranslations( project, rootPath, languages ) {
  const { projectName, domain } = project;

  const languagesPath = join( rootPath, projectName, 'languages' );

  await processDomain( domain, languagesPath, languages );
  await processDomain( domain + '.js', languagesPath, languages );
}

async function processDomain( domain, languagesPath, languages ) {
  for ( const language of languages ) {
    const name = `${domain}.${language.name}`;
    await buildMoFile( name, languagesPath );
  }
}

async function buildWordPressTranslations( project, rootPath, languages ) {
  const { projectName, projectPath, projectType, scripts, options, translations } = project;

  const languagesPath = join( rootPath, projectPath, 'languages' );

  const handle = options.translationsHandle || ( scripts.length > 0 ? projectName + '-' + basename( scripts[ 0 ], '.js' ) : null );

  for ( const language of languages ) {
    if ( translations.includes( language.name ) ) {
      const name = projectType == 'theme' ? language.name : `${projectName}-${language.name}`;
      const data = await buildMoFile( name, languagesPath );

      if ( handle != null && data != null ) {
        if ( typeof handle == 'string' )
          await exportJson( data, projectName, languagesPath, { [handle]: '*' } );
        else
          await exportJson( data, projectName, languagesPath, handle );
      }
    }
  }
}

async function buildMoFile( name, languagesPath ) {
  const poFile = `${name}.po`;
  const moFile = `${name}.mo`;

  const poPath = join( languagesPath, poFile );
  const moPath = join( languagesPath, moFile );

  let existingPo = null;

  try {
    existingPo = await readFile( poPath );
  } catch ( err ) {
    if ( err.code != 'ENOENT' )
      throw err;
  }

  if ( existingPo == null )
    return null;

  const data = po.parse( existingPo );

  const generatedPo = po.compile( data, { sort: compareRefence, eol: '\r\n' } );
  const generatedMo = mo.compile( data );

  await writeFile( poPath, generatedPo );
  await writeFile( moPath, generatedMo );

  return data;
}

async function exportJson( data, projectName, languagesPath, handleMap ) {
  const lang = data.headers[ 'Language' ];

  const messages = {};
  const count = {};

  for ( const handle in handleMap ) {
    messages[ handle ] = {
      '': {
        domain: 'messages',
        lang,
        'plural-forms': data.headers[ 'Plural-Forms' ],
      },
    };

    count[ handle ] = 0;
  }

  for ( const ctx in data.translations ) {
    for ( const key in data.translations[ ctx ] ) {
      if ( key == '' )
        continue;

      const value = data.translations[ ctx ][ key ];

      const reference = value.comments != null ? value.comments.reference : null;

      if ( reference == null )
        continue;

      for ( const handle in handleMap ) {
        const rule = handleMap[ handle ];

        const path = rule != '*' ? `../src/${rule}/` : '../src/';

        if ( reference.includes( path ) ) {
          if ( ctx == '' )
            messages[ handle ][ key ] = value.msgstr;
          else
            messages[ handle ][ ctx + '\u0004' + key ] = value.msgstr;

          count[ handle ]++;
          break;
        }
      }
    }
  }

  for ( const handle in handleMap ) {
    if ( count[ handle ] > 0 ) {
      const outputData = {
        'translation-revision-date': data.headers[ 'PO-Revision-Date' ],
        generator: data.headers[ 'X-Generator' ],
        domain: 'messages',
        locale_data: { messages: messages[ handle ] },
      };

      const json = JSON.stringify( outputData ).replace( /[\u0080-\uFFFF]/g, chr => '\\u' + ( '0000' + chr.charCodeAt( 0 ).toString( 16 ) ).slice( -4 ) );

      await writeFile( join( languagesPath, `${projectName}-${lang}-${handle}.json` ), json );
    }
  }
}
