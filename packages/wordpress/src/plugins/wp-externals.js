import { basename, extname } from 'path';

import { Parser } from 'acorn';
import { init, parse } from 'es-module-lexer';
import json2php from 'json2php';
import MagicString from 'magic-string';

const EXTERNALS = {
  jquery: 'jQuery',
  lodash: 'lodash',
  moment: 'moment',
};

const PREFIX = '@wordpress/';

export function wpExternals( { prefix, injectPolyfill = false, customExternals = null } ) {
  const moduleDependencies = {};

  return {
    name: 'wp-externals',

    async transform( code, id ) {
      if ( !id.match( /\.(js|vue)$/ ) || id.includes( 'node_modules' ) )
        return;

      const dependencies = new Set();

      await init;
      const [ imports ] = parse( code );

      let mappedCode = null;

      for ( const { d: dynamic, n: module, ss: start, se: end } of imports ) {
        if ( dynamic != -1 || module == null )
          continue;

        const global = transformModuleName( module, dependencies, customExternals );
        if ( global == null )
          continue;

        mappedCode ||= new MagicString( code );
        const input = mappedCode.slice( start, end );
        const output = transformImport( input, global );
        mappedCode.update( start, end, output );
      }

      moduleDependencies[ id ] = dependencies;

      if ( mappedCode == null )
        return;

      return {
        code: mappedCode.toString(),
        map: mappedCode.generateMap( {
          source: id,
          includeContent: true,
          hires: true,
        } ),
      };
    },

    generateBundle( options, bundle ) {
      const assets = {};

      for ( const key in bundle ) {
        const { name, fileName, type, facadeModuleId, moduleIds, imports } = bundle[ key ];

        switch ( type ) {
          case 'chunk':
            if ( facadeModuleId == null || extname( facadeModuleId ) == '.js' ) {
              const dependencies = new Set();
              for ( const id of moduleIds ) {
                if ( moduleDependencies.hasOwnProperty( id ) ) {
                  for ( const dependency of moduleDependencies[ id ] )
                    dependencies.add( dependency );
                }
              }
              if ( injectPolyfill )
                dependencies.add( 'wp-polyfill' );
              for ( const importKey of imports ) {
                const importName = bundle[ importKey ].name;
                dependencies.add( `${prefix}-${importName}` );
              }
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

      const format = json2php.make( { shortArraySyntax: true } );

      this.emitFile( {
        type: 'asset',
        name: 'assets.php',
        fileName: 'assets.php',
        source: `<?php return ${format( assets )};\n`,
      } );
    },
  };
}

function transformImport( input, global ) {
  const ast = Parser.parse( input, { ecmaVersion: 'latest', sourceType: 'module' } );

  const { specifiers } = ast.body[ 0 ];
  if ( specifiers == null )
    return '';

  return specifiers.reduce( ( output, specifier ) => {
    const { local } = specifier;
    switch ( specifier.type ) {
      case 'ImportDefaultSpecifier':
      case 'ImportNamespaceSpecifier':
        output += `const ${local.name} = ${global};`;
        break;
      case 'ImportSpecifier':
        const { imported } = specifier;
        output += `const ${local.name} = ${global}.${imported.name};`;
        break;
      case 'ExportSpecifier':
        const { exported } = specifier;
        const value = global == 'default' ? global : `${global}.${local.name}`;
        if ( exported.name == 'default' )
          output += `export default ${value};`;
        else
          output += `export const ${exported.name} = ${value};`;
        break;
    }
    return output;
  }, '' );
}

function transformModuleName( module, dependencies, customExternals ) {
  if ( EXTERNALS.hasOwnProperty( module ) ) {
    dependencies.add( module );
    return `window.${EXTERNALS[ module ]}`;
  }

  if ( module.startsWith( PREFIX ) ) {
    const submodule = module.substring( PREFIX.length );
    dependencies.add( `wp-${submodule}` );
    return `window.wp['${toCamelCase( submodule )}']`;
  }

  if ( customExternals != null && customExternals.hasOwnProperty( module ) )
    return `window.${customExternals[ module ]}`;

  return null;
}

function toCamelCase( string ) {
  return string.replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );
}
