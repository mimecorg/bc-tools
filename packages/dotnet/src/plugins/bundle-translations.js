import { existsSync } from 'fs';
import { resolve } from 'path';

import { convertMoToJs } from 'bc-tools-common';

import { resolveProjectLanguages } from '../projects.js';

export function bundleTranslations( projectPath, languages, projects, { prefix = 'i18n' } = {} ) {
  let resolvedPaths;

  const escapedPrefix = prefix.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
  const prefixFilter = new RegExp( `^${escapedPrefix}:` );

  return {
    name: 'bundle-translations',

    buildStart() {
      resolvedPaths = resolveProjectLanguages( projectPath, projects );

      for ( const language of languages )
        this.emitFile( { type: 'chunk', id: `${prefix}:${language}`, name: `${prefix}-${language}` } );
    },

    resolveId: {
      filter: {
        id: prefixFilter,
      },

      handler( id ) {
        return id;
      },
    },

    load: {
      filter: {
        id: [ prefixFilter, /\.mo(?:$|\?)/ ],
      },

      async handler( id ) {
        if ( prefixFilter.test( id ) ) {
          const deps = [];
          const result = generateI18nEntryFile( id.substring( prefix.length + 1 ), deps );
          for ( const dep of deps )
            this.addWatchFile( dep );
          return result;
        }

        return await convertMoToJs( id );
      },
    },
  };

  function generateI18nEntryFile( language, deps ) {
    let imports = '';
    const mappings = [];

    for ( const domain in resolvedPaths ) {
      const moPath = resolve( resolvedPaths[ domain ], `${domain}.js.${language}.mo` );

      if ( existsSync( moPath ) ) {
        const escapedPath = moPath.replaceAll( '\\', '\\\\' );
        const variableName = domain.replaceAll( '.', '_' ) + '_I18nData';

        imports += `import ${variableName} from '${escapedPath}';\n`;
        mappings.push( `'${domain}.js': ${variableName}` );

        deps.push( moPath );
      }
    }

    return imports + 'Object.assign( window.i18nData.domains, { ' + mappings.join( ', ' ) + " } );\n";
  }
}
