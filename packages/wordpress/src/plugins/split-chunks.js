import { basename, extname, relative } from 'path';

import { Parser } from 'acorn';
import MagicString from 'magic-string';

export function splitChunks( { main, shared, vendors, mainVar, sharedVar, vendorsVar } ) {
  return {
    name: 'split-chunks',

    config( config ) {
      return {
        build: {
          rollupOptions: {
            output: {
              manualChunks( id, { getModuleInfo } ) {
                if ( id == '\0commonjsHelpers.js' || id == '\0plugin-vue:export-helper' )
                  return vendors || shared || main;

                if ( !id.match( /\.(js|mjs|cjs|vue)$/ ) )
                  return;

                if ( vendors != null && id.includes( 'node_modules' ) )
                  return vendors;

                const modules = [ id ];
                const entries = [];

                for ( let i = 0; i < modules.length; i++ ) {
                  const module = modules[ i ];
                  const relativePath = relative( config.root, module );
                  if ( config.build.rollupOptions.input.includes( relativePath ) ) {
                    const name = basename( module, extname( module ) );
                    if ( !entries.includes( name ) )
                      entries.push( name );
                  } else {
                    for ( const importer of getModuleInfo( module ).importers ) {
                      if ( !modules.includes( importer ) )
                        modules.push( importer );
                    }
                  }
                }

                if ( main != null && entries.includes( main ) || shared == null && entries.length > 1 )
                  return main;

                if ( shared != null && entries.length > 1 )
                  return shared;
              },
            },
          },
        },
      };
    },

    renderChunk( code, chunk, options, meta ) {
      if ( chunk.imports.length > 0 || chunk.exports.length > 0 ) {
        const ast = Parser.parse( code, { ecmaVersion: 'latest', sourceType: 'module' } );

        const mappedCode = new MagicString( code );

        for ( let i = 0; i < ast.body.length && ast.body[ i ].type == 'ImportDeclaration'; i++ ) {
          const { start, end, source, specifiers } = ast.body[ i ];
          if ( specifiers.length > 0 ) {
            const importedChunk = meta.chunks[ basename( source.value ) ].name;
            const varName = importedChunk == main ? mainVar : importedChunk == vendors ? vendorsVar : sharedVar;
            const imports = [];
            for ( const { local, imported } of specifiers )
              imports.push( `${imported.name}:${local.name}` );
            const output = `const {${imports.join( ',' )}} = window.${varName};`;
            mappedCode.update( start, end, output );
          } else {
            mappedCode.remove( start, end );
          }
        }

        if ( ast.body[ ast.body.length - 1 ].type == 'ExportNamedDeclaration' ) {
          const { start, end, specifiers } = ast.body[ ast.body.length - 1 ];
          const varName = chunk.name == main ? mainVar : chunk.name == vendors ? vendorsVar : sharedVar;
          const exports = [];
          for ( const { local, exported } of specifiers )
            exports.push( `${exported.name}:${local.name}` );
          const output = `window.${varName} = Object.assign( window.${varName} || {}, {${exports.join( ',' )}} );`;
          mappedCode.update( start, end, output );
        }

        return {
          code: mappedCode.toString(),
          map: mappedCode.generateMap( {
            source: chunk.id,
            includeContent: true,
            hires: true,
          } ),
        };
      }
    },
  };
}
