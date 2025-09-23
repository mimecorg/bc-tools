#!/usr/bin/env node

import { resolve } from 'path';
import { pathToFileURL } from 'url';

import { buildAllProjects } from '../src/build.js';

const rootPath = process.cwd();

let configPath = null;
let watch = false;
let mode = 'production';
let sourcemap = false;
let minify = 'esbuild';

for ( let i = 2; i < process.argv.length; i++ ) {
  const arg = process.argv[ i ];
  switch ( arg ) {
    case '--watch':
      watch = true;
      break;

    case '--dev':
      mode = 'development';
      sourcemap = true;
      minify = false;
      break;

    case '--sourcemap':
      sourcemap = true;
      break;

    case '--no-minify':
      minify = false;
      break;

    default:
      if ( arg[ 0 ] != '-' && configPath == null )
        configPath = arg;
      else
        help();
      break;
  }
}

process.env.NODE_ENV = mode;

const buildConfig = await load( configPath || 'build.config.js' );

const results = await buildAllProjects( buildConfig, rootPath, { watch, mode, sourcemap, minify } );

if ( watch ) {
  process.stdin.setRawMode( true );
  process.stdin.setEncoding( 'utf-8' );

  process.stdin.on( 'data', ch => {
    if ( ch == 'q' || ch == '\x03' ) {
      process.stdin.pause();
      for ( const result of results )
        result.close();
    }
  } );
}

function help() {
  console.log( 'Usage: bc-build [--watch] [--dev] [--sourcemap] [--no-minify] [CONFIG]' );

  process.exit( 1 );
}

async function load( path ) {
  const url = pathToFileURL( resolve( rootPath, path ) );
  const module = await import( url );
  return module.default;
}
