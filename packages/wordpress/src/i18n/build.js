import { writeFile } from 'fs/promises';
import { basename, join } from 'path';

import { buildMoFile } from 'bc-tools-common';

import { makePackages } from '../packages.js';

export async function buildAllTranslations( buildConfig, rootPath ) {
  const packages = makePackages( buildConfig );

  for ( const _package of packages )
    await buildTranslations( _package, rootPath, buildConfig.languages );
}

async function buildTranslations( _package, rootPath, languages ) {
  const { packageName, packagePath, packageType, scripts, options, translations } = _package;

  const languagesPath = join( rootPath, packagePath, 'languages' );

  const handle = options.translationsHandle || ( scripts.length > 0 ? packageName + '-' + basename( scripts[ 0 ], '.js' ) : null );

  for ( const language of languages ) {
    if ( translations.includes( language.name ) ) {
      const name = packageType == 'theme' ? language.name : `${packageName}-${language.name}`;
      const data = await buildMoFile( name, languagesPath );

      if ( handle != null && data != null ) {
        if ( typeof handle == 'string' )
          await exportJson( data, packageName, languagesPath, { [handle]: '*' } );
        else
          await exportJson( data, packageName, languagesPath, handle );
      }
    }
  }
}

async function exportJson( data, packageName, languagesPath, handleMap ) {
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

      await writeFile( join( languagesPath, `${packageName}-${lang}-${handle}.json` ), json );
    }
  }
}
