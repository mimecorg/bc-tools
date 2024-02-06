#!/usr/bin/env node

import { resolve } from 'path';
import { pathToFileURL } from 'url';

import { switchToPackages, switchToProjects } from '../src/switch.js';

const rootPath = process.cwd();

switch ( process.argv[ 2 ] ) {
  case 'projects':
    await commandProjects();
    break;

  case 'packages':
    await commandPackages();
    break;

  default:
    help();
    break;
}

async function commandProjects() {
  const { prefix, targetPath } = await load( process.argv[ 3 ] || 'switch.config.js' );

  await switchToProjects( prefix, targetPath, rootPath );
}

async function commandPackages() {
  const { prefix, targetPath } = await load( process.argv[ 3 ] || 'switch.config.js' );

  await switchToPackages( prefix, targetPath, rootPath );
}

function help() {
  console.error( 'Usage: bc-switch projects [CONFIG]\n'
               + '       bc-switch packages [CONFIG]' );

  process.exit( 1 );
}

async function load( path ) {
  const url = pathToFileURL( resolve( rootPath, path ) );
  const module = await import( url );
  return module.default;
}
