import { existsSync } from 'fs';
import { createRequire } from 'module';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

const rootPath = process.cwd();
const require = createRequire( pathToFileURL( rootPath ) );

export function resolveProjectAliases( projectPath, aliases ) {
  const projectAssetsPath = resolve( rootPath, projectPath, 'obj/project.assets.json' );

  if ( !existsSync( projectAssetsPath ) )
    throw new Error( 'Could not find project.assets.json, build the project before running vite!' );

  const projectAssets = require( projectAssetsPath );

  const result = {};

  for ( const alias in aliases ) {
    const projectName = aliases[ alias ];

    let aliasPath = null;

    for ( const libraryName in projectAssets.libraries ) {
      if ( libraryName.startsWith( projectName + '/' ) ) {
        const library = projectAssets.libraries[ libraryName ];
        if ( library.type == 'project' )
          aliasPath = resolve( projectPath, library.path, '../src' );
        else if ( library.type == 'package' )
          aliasPath = resolve( projectAssets.project.restore.packagesPath, library.path, 'src' );
        break;
      }
    }

    if ( aliasPath == null )
      throw new Error( 'Could not find project: ' + projectName );

    result[ alias ] = aliasPath;
  }

  return result;
}
