import { basename, extname, relative } from 'path';

import json2php from 'json2php';
import { parseSync } from 'oxc-parser';
import { generateTransform, rolldownString } from 'rolldown-string'

const EXTERNALS = {
  jquery: 'jQuery',
  lodash: 'lodash',
  moment: 'moment',
};

const PREFIX = '@wordpress/';

export function wpExternals( { prefix = null, injectPolyfill = false, customExternals = null, codeSplitting = null, wrapMode = null } ) {
  return {
    name: 'wp-externals',

    config( config ) {
      const mergedConfig = {
        build: {
          rolldownOptions: {
            external( id ) {
              return isExternalModule( id, customExternals );
            },
          }
        },
      };

      if ( codeSplitting != null ) {
        const codeSplittingGroup = {
          name( id, context ) {
            return getChunkName( id, context, config, codeSplitting );
          },
          includeDependenciesRecursively: false,
        };

        mergedConfig.build.rolldownOptions.output = {
          codeSplitting: {
            groups: [ codeSplittingGroup ],
          },
          minifyInternalExports: !!config.build.minify,
        };
      }

      return mergedConfig;
    },

    renderChunk( code, chunk, options, meta ) {
      const mappedCode = rolldownString( code, 'chunk.js', meta );

      if ( chunk.imports.length > 0 || chunk.exports.length > 0 ) {
        const { program } = parseSync( 'chunk.js', code );

        for ( let i = 0; i < program.body.length && program.body[ i ].type == 'ImportDeclaration'; i++ ) {
          const { start, end, source, specifiers } = program.body[ i ];

          let global = transformModuleName( source.value, customExternals );

          if ( global == null && codeSplitting != null )
            global = transformChunkName( meta.chunks[ basename( source.value ) ], codeSplitting );

          if ( global != null ) {
            const output = transformImport( specifiers, global );
            mappedCode.update( start, end, output );
          }
        }

        if ( codeSplitting != null && program.body[ program.body.length - 1 ].type == 'ExportNamedDeclaration' ) {
          const { start, end, specifiers } = program.body[ program.body.length - 1 ];
          const global = transformChunkName( chunk, codeSplitting );
          if ( global != null ) {
            const output = transformExport( specifiers, global );
            mappedCode.update( start, end, output );
          }
        }
      }

      if ( wrapMode == 'onload' ) {
        mappedCode.prepend( 'window.addEventListener( "DOMContentLoaded", () => {\n' );
        mappedCode.append( '\n} );' );
      } else {
        mappedCode.prepend( '( () => {\n' );
        mappedCode.append( '\n} )();' );
      }

      return generateTransform( mappedCode, 'chunk.js' );
    },

    generateBundle( options, bundle ) {
      if ( prefix == null )
        return;

      const assets = {};

      for ( const key in bundle ) {
        const { name, fileName, type, facadeModuleId, imports } = bundle[ key ];

        switch ( type ) {
          case 'chunk':
            if ( facadeModuleId == null || extname( facadeModuleId ) == '.js' ) {
              const dependencies = new Set();
              for ( const module of imports ) {
                const dependency = getDependency( module, bundle, prefix );
                if ( dependency != null )
                  dependencies.add( dependency );
              }
              if ( injectPolyfill )
                dependencies.add( 'wp-polyfill' );
              const handle = `${prefix}-${name}`;
              if ( !assets.hasOwnProperty( handle ) )
                assets[ handle ] = {};
              assets[ handle ].js = fileName;
              assets[ handle ].dependencies = [ ...dependencies ].sort();
            }
            break;

          case 'asset':
            if ( name != null && extname( name ) == '.css' ) {
              const base = basename( name, extname( name ) );
              const handle = `${prefix}-${base}`;
              if ( !assets.hasOwnProperty( handle ) )
                assets[ handle ] = {};
              assets[ handle ].css = fileName;
            } else if ( name != null ) {
              if ( !assets.hasOwnProperty( 'static' ) )
                assets.static = {};
              assets.static[ name ] = fileName;
            }
        }
      }

      const format = json2php.make( { shortArraySyntax: true, stripSpaces: true } );

      this.emitFile( {
        type: 'asset',
        name: 'assets.php',
        fileName: 'assets.php',
        source: `<?php return ${format( assets )};\n`,
      } );
    },
  };
}

function isExternalModule( module, customExternals ) {
  if ( EXTERNALS.hasOwnProperty( module ) )
    return true;

  if ( module.startsWith( PREFIX ) )
    return true;

  if ( customExternals != null && customExternals.hasOwnProperty( module ) )
    return true;

  return false;
}

function transformModuleName( module, customExternals ) {
  if ( EXTERNALS.hasOwnProperty( module ) )
    return `window.${EXTERNALS[ module ]}`;

  if ( module.startsWith( PREFIX ) ) {
    const submodule = module.substring( PREFIX.length );
    return `window.wp['${toCamelCase( submodule )}']`;
  }

  if ( customExternals != null && customExternals.hasOwnProperty( module ) )
    return `window.${customExternals[ module ]}`;

  return null;
}

function toCamelCase( string ) {
  return string.replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );
}

function transformImport( specifiers, global ) {
  const imports = [];
  const output = [];

  for ( const { type, local, imported } of specifiers ) {
    switch ( type ) {
      case 'ImportSpecifier':
        if ( local.name == imported.name )
          imports.push( local.name );
        else
          imports.push( `${imported.name}: ${local.name}` );
        break;
      case 'ImportDefaultSpecifier':
      case 'ImportNamespaceSpecifier':
        output.push( `var ${local.name} = ${global};` );
        break;
    }
  }

  if ( imports.length > 0 )
    output.push( `var { ${imports.join( ', ' )} } = ${global};` );

  return output.join( '\n' );
}

function transformExport( specifiers, global ) {
  const exports = [];
  for ( const { local, exported } of specifiers )
    exports.push( `${exported.name}: ${local.name}` );
  return `${global} = Object.assign( ${global} || {}, { ${exports.join( ', ' )} } );`
}

function getChunkName( id, context, config, { main, shared, vendors } ) {
  if ( id == '\0commonjsHelpers.js' || id == '\0plugin-vue:export-helper' )
    return vendors || shared || main;

  if ( vendors != null && id.includes( 'node_modules' ) )
    return vendors;

  if ( !id.match( /\.(js|jsx|mjs|cjs|vue)$/ ) )
    return null;

  const modules = [ id ];
  const entries = [];

  for ( let i = 0; i < modules.length; i++ ) {
    const module = modules[ i ];
    const relativePath = relative( config.root, module );
    if ( config.build.rolldownOptions.input.includes( relativePath ) ) {
      const name = basename( module, extname( module ) );
      if ( !entries.includes( name ) )
        entries.push( name );
    } else {
      for ( const importer of context.getModuleInfo( module ).importers ) {
        if ( !modules.includes( importer ) )
          modules.push( importer );
      }
    }
  }

  if ( main != null && entries.includes( main ) || shared == null && entries.length > 1 )
    return main;

  if ( shared != null && entries.length > 1 )
    return shared;

  return null;
}

function transformChunkName( chunk, options ) {
  if ( chunk == null )
    return null;
  if ( chunk.name == options.main )
    return `window.${options.mainVar}`;
  if ( chunk.name == options.vendors )
    return `window.${options.vendorsVar}`;
  if ( chunk.name == options.shared )
    return `window.${options.sharedVar}`;
  return null;
}

function getDependency( module, bundle, prefix ) {
  if ( EXTERNALS.hasOwnProperty( module ) )
    return module;

  if ( module.startsWith( PREFIX ) ) {
    const submodule = module.substring( PREFIX.length );
    return `wp-${submodule}`;
  }

  if ( bundle.hasOwnProperty( module ) ) {
    const importName = bundle[ module ].name;
    return `${prefix}-${importName}`;
  }

  return null;
}
