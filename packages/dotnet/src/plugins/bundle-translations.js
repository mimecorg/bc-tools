import { existsSync } from 'fs';
import { resolve } from 'path';

import { convertMoToJs } from 'bc-tools-common';
import { resolveProjectLanguages } from '../projects.js';

export function bundleTranslations( projectPath, languages, projects ) {
  let resolvedPaths;

  return {
    name: 'bundle-translations',

    buildStart() {
      resolvedPaths = resolveProjectLanguages( projectPath, projects );

      for ( const language of languages )
        this.emitFile( { type: 'chunk', id: `i18n:${language}`, name: `i18n-${language}` } );
    },

    resolveId( id ) {
      if ( id.startsWith( 'i18n:' ) )
        return id;
    },

    async load( id ) {
      if ( id.startsWith( 'i18n:' ) )
        return generateI18nEntryFile( id.substring( 5 ) );

      if ( id.match( /\.mo$/ ) )
        return await convertMoToJs( id );
    },
  };

  function generateI18nEntryFile( language ) {
    let imports = '';
    const mappings = [];

    for ( const domain in resolvedPaths ) {
      const moPath = resolve( resolvedPaths[ domain ], `${domain}.js.${language}.mo` );

      if ( existsSync( moPath ) ) {
        const escapedPath = moPath.replaceAll( '\\', '\\\\' );
        const variableName = domain.replaceAll( '.', '_' ) + '_I18nData';

        imports += `import ${variableName} from '${escapedPath}';\n`;
        mappings.push( `'${domain}.js': ${variableName}` );
      }
    }

    return imports + 'Object.assign( window.i18nData.domains, { ' + mappings.join( ', ' ) + " } );\n";
  }
}
