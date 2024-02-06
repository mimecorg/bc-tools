import { join, resolve } from 'path';
import { pathToFileURL } from 'url';

import autoprefixer from 'autoprefixer';
import { build, defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

import { cssCharset, generateImports, jsAsJsx, makePackages, splitChunks, wpExternals, wrapInIife } from '../index.js';

export async function buildAllPackages( buildConfig, rootPath, buildOptions ) {
  const packages = makePackages( buildConfig )
    .filter( p => p.scripts.length > 0 || p.styles.length > 0 );

  for ( const _package of packages ) {
    console.log( `Building ${_package.packagePath}...` );

    const config = makePackageConfig( _package, buildConfig, rootPath, buildOptions );

    await buildPackage( config );
  }

  if ( buildConfig.extras != null ) {
    for ( const configPath of buildConfig.extras ) {
      console.log( `Building ${configPath}...` );

      const makeConfig = await load( configPath, rootPath );
      const config = makeConfig( buildConfig, buildOptions );

      await buildPackage( config );
    }
  }
}

function makePackageConfig( _package, buildConfig, rootPath, buildOptions ) {
  const { packageName, packagePath, packageType, scripts, styles, imports, options } = _package;
  const { injectPolyfill, customExternals, codeSplitting } = options;

  const { watch, mode, sourcemap, minify } = buildOptions;

  const input = [];
  for ( const script of scripts )
    input.push( join( packagePath, 'src', script ) );
  for ( const style of styles )
    input.push( join( packagePath, 'src', style ) );

  return defineConfig( {
    mode,
    root: rootPath,
    base: './',
    publicDir: false,
    build: {
      outDir: join( packagePath, 'assets' ),
      assetsDir: '',
      rollupOptions: {
        input,
      },
      watch,
      sourcemap,
      minify,
    },
    resolve: {
      alias: {
        '@': join( rootPath, packagePath, 'src' ),
        '@wp-admin': join( rootPath, buildConfig.paths.wordpress, '/wp-admin' ),
        '@wp-includes': join( rootPath, buildConfig.paths.wordpress, '/wp-includes' ),
        '@wp-content': join( rootPath, buildConfig.paths.content ),
      },
    },
    css: {
      postcss: {
        plugins: [ autoprefixer ],
      },
    },
    plugins: [
      jsAsJsx(),
      vue(),
      wpExternals( {
        prefix: packageType == 'theme' ? 'bc-theme' : packageName,
        injectPolyfill,
        customExternals,
      } ),
      codeSplitting != null ? splitChunks( codeSplitting ) : null,
      wrapInIife(),
      cssCharset(),
      imports != null ? generateImports( imports ) : null,
    ],
  } );
}

async function buildPackage( config ) {
  const result = await build( config );

  if ( config.build.watch ) {
    let finished = false;

    await new Promise( ( resolve, reject ) => {
      result.on( 'event', event => {
        if ( event.code == 'END' && !finished ) {
          finished = true;
          resolve();
        }
      } );
    } );
  }
}

async function load( path, rootPath ) {
  const url = pathToFileURL( resolve( rootPath, path ) );
  const module = await import( url );
  return module.default;
}
