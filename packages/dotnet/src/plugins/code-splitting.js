import { normalize, relative } from 'path';

export function codeSplitting( callback ) {
  return {
    name: 'code-splitting',

    config( config ) {
      const entryMap = new Map();
      for ( const [ entry, path ] of Object.entries( config.build.rolldownOptions.input ) )
        entryMap.set( normalize( path ), entry );

      const codeSplittingGroup = {
        name( id, context ) {
          if ( id.match( /\.(css|scss)$/ ) )
            return null;
          const entries = getEntries( id, context, config.root, entryMap );
          return callback( id, entries );
        },
        debugName: 'code-splitting',
        includeDependenciesRecursively: false,
      };

      return {
        build: {
          rolldownOptions: {
            output: {
              codeSplitting: {
                groups: [ codeSplittingGroup ],
              },
              minifyInternalExports: !!config.build.minify,
            },
          },
        },
      };
    },
  };
}

function getEntries( id, context, rootPath, entryMap ) {
  const modules = [ id ];
  const entries = [];

  for ( let i = 0; i < modules.length; i++ ) {
    const module = modules[ i ];
    const relativePath = relative( rootPath, module );
    const entry = entryMap.get( relativePath );
    if ( entry != null ) {
      entries.push( entry );
    } else {
      for ( const importer of context.getModuleInfo( module ).importers ) {
        if ( !modules.includes( importer ) )
          modules.push( importer );
      }
    }
  }

  return entries;
}
