import { readFile, writeFile } from 'fs/promises';
import { resolve, join } from 'path';

import { glob } from 'glob';

import { spawnProcess } from './spawn.js';
import { replaceAsync } from './utils.js';

export async function switchToProjects( prefix, targetPath, rootPath ) {
  const targetProjects = await findTargetProjects( prefix, targetPath, rootPath );

  await updateSolution( 'add', targetProjects );

  const regExp = new RegExp( `<PackageReference\\s+Include="(${prefix}\\.[\\w.]+)"\\s+Version="[^"]+"\\s*/>`, 'g' );

  await processProjects( 'project', regExp, rootPath, async name => {
    const referencePath = join( targetPath, `${name}/${name}.csproj` );
    if ( targetProjects.includes( referencePath ) ) {
      const relativeReferencePath = join( '..', referencePath );
      return `<ProjectReference Include="${relativeReferencePath}" />`;
    }
 } );
}

export async function switchToPackages( prefix, targetPath, rootPath ) {
  const targetProjects = await findTargetProjects( prefix, targetPath, rootPath );

  await updateSolution( 'remove', targetProjects );

  const regExp = new RegExp( `<ProjectReference\\s+Include="[^"]+\\\\(${prefix}\\.[\\w.]+)\\.csproj"\\s*/>`, 'g' );

  await processProjects( 'package', regExp, rootPath, async name => {
    const referencePath = join( targetPath, `${name}/${name}.csproj` );
    if ( targetProjects.includes( referencePath ) ) {
      const fullReferencePath = resolve( rootPath, referencePath );
      const version = await extractVersion( fullReferencePath );
      return `<PackageReference Include="${name}" Version="${version}" />`;
    }
 } );
}

async function processProjects( type, regExp, rootPath, replaceCallback ) {
  const projectFiles = await findProjects( rootPath );

  for ( const project of projectFiles ) {
    const projectPath = join( rootPath, project );
    const xml = await readFile( projectPath, 'utf8' );

    let updated = false;

    const mappedXml = await replaceAsync( xml, regExp, async ( original, name ) => {
      const replacement = await replaceCallback( name );
      if ( replacement != null ) {
        updated = true;
        return replacement;
      }
      return original;
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

async function findTargetProjects( prefix, targetPath, rootPath ) {
  const fullTargetPath = resolve( rootPath, targetPath );

  const files = await glob( `${prefix}.*/${prefix}.*.csproj`, { cwd: fullTargetPath } );

  return files.map( file => join( targetPath, file ) );
}

async function extractVersion( projectPath ) {
  const xml = await readFile( projectPath, 'utf8' );
  const match = /<Version>([^<]+)<\/Version>/.exec( xml );
  return match != null ? match[ 1 ] : null;
}

async function updateSolution( command, targetProjects ) {
  const args = [ 'sln', command, ...targetProjects ];

  await spawnProcess( 'dotnet', args );
}
