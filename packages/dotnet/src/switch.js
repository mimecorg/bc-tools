import { readFile, writeFile } from 'fs/promises';
import { resolve, join } from 'path';

import { glob } from 'glob';

import { spawnProcess } from './spawn.js';
import { replaceAsync } from './utils.js';

export async function switchToProjects( prefix, targetPath, rootPath ) {
  await updateSolution( 'add', prefix, targetPath, rootPath );

  const regExp = new RegExp( `<PackageReference\\s+Include="(${prefix}\\.[\\w.]+)"\\s+Version="[^"]+"\\s*/>`, 'g' );

  await processProjects( 'project', regExp, rootPath, async name => {
    const referencePath = join( '..', targetPath, `${name}/${name}.csproj` );
    return `<ProjectReference Include="${referencePath}" />`;
 } );
}

export async function switchToPackages( prefix, targetPath, rootPath ) {
  await updateSolution( 'remove', prefix, targetPath, rootPath );

  const regExp = new RegExp( `<ProjectReference\\s+Include="[^"]+\\\\(${prefix}\\.[\\w.]+)\\.csproj"\\s*/>`, 'g' );

  await processProjects( 'package', regExp, rootPath, async name => {
    const fullReferencePath = resolve( rootPath, targetPath, `${name}/${name}.csproj` );
    const version = await extractVersion( fullReferencePath );
    return `<PackageReference Include="${name}" Version="${version}" />`;
 } );
}

async function processProjects( type, regExp, rootPath, replaceCallback ) {
  const projectFiles = await findProjects( rootPath );

  for ( const project of projectFiles ) {
    const projectPath = join( rootPath, project );
    const xml = await readFile( projectPath, 'utf8' );

    let updated = false;

    const mappedXml = await replaceAsync( xml, regExp, async ( _, name ) => {
      updated = true;
      return await replaceCallback( name );
    } );

    if ( updated ) {
      await writeFile( projectPath, mappedXml, 'utf8' );

      console.log( 'Project `' + project + '`' + ` switched to ${type} references.` )
    } else {
      console.log( 'Project `' + project + '` skipped.' )
    }
  }
}

async function findProjects( rootPath ) {
  return await glob( '**/*.csproj', { cwd: rootPath, ignore: [ '.git/**', 'node_modules/**' ] } );
}

async function extractVersion( projectPath ) {
  const xml = await readFile( projectPath, 'utf8' );
  const match = /<Version>([^<]+)<\/Version>/.exec( xml );
  return match != null ? match[ 1 ] : null;
}

async function updateSolution( command, prefix, targetPath, rootPath ) {
  const fullTargetPath = resolve( rootPath, targetPath );

  const projectFiles = await glob( `${prefix}.*/${prefix}.*.csproj`, { cwd: fullTargetPath } );

  const args = [ 'sln', command, ...projectFiles.map( file => join( targetPath, file ) ) ];

  await spawnProcess( 'dotnet', args );
}
