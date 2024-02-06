#!/usr/bin/env node

import { resolve } from 'path';
import { pathToFileURL } from 'url';

import { updateComments } from 'bc-tools-common';

import { buildAllTranslations } from '../src/i18n/build.js';
import { updateAllTranslations } from '../src/i18n/update.js';

const rootPath = process.cwd();

switch ( process.argv[ 2 ] ) {
  case 'update':
    await commandUpdate();
    break;

  case 'build':
    await commandBuild();
    break;

  case 'comments':
    await commandComments();
    break;

  default:
    help();
    break;
}

async function commandUpdate() {
  const languagesConfig = await load( process.argv[ 3 ] || 'languages.config.js' );
  await updateAllTranslations( languagesConfig, rootPath );
}

async function commandBuild() {
  const languagesConfig = await load( process.argv[ 3 ] || 'languages.config.js' );
  await buildAllTranslations( languagesConfig, rootPath );
}

async function commandComments() {
  if ( process.argv[ 3 ] == 'add' && process.argv.length == 6 )
    await updateComments( process.argv[ 4 ], process.argv[ 5 ] );
  else if ( process.argv[ 3 ] == 'remove' && process.argv.length == 5 )
    await updateComments( null, process.argv[ 4 ] );
  else
    help();
}

function help() {
  console.log( 'Usage: bc-i18n update [CONFIG]\n'
             + '       bc-i18n build [CONFIG]\n'
             + '       bc-i18n comments add [SRC_PO_FILE] [DEST_PO_FILE]\n'
             + '       bc-i18n comments remove [PO_FILE]' );

  process.exit( 1 );
}

async function load( path ) {
  const url = pathToFileURL( resolve( rootPath, path ) );
  const module = await import( url );
  return module.default;
}
