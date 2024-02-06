import { join } from 'path';

export function makePackages( config ) {
  const packages = [];

  if ( config.plugins != null ) {
    for ( const name in config.plugins )
      packages.push( makePackage( config.plugins[ name ], name, join( config.paths.content, 'plugins', name ), 'plugin', config.languages ) );
  }

  if ( config.themes != null ) {
    for ( const name in config.themes )
      packages.push( makePackage( config.themes[ name ], name, join( config.paths.content, 'themes', name ), 'theme', config.languages ) );
  }

  return packages;
}

function makePackage( config, packageName, packagePath, packageType, languages ) {
  if ( Array.isArray( config ) )
    config = { scripts: config };

  if ( config.scripts == null )
    config.scripts = [];

  if ( config.styles == null )
    config.styles = [];

  if ( config.options == null )
    config.options = {};

  if ( config.translations == null )
    config.translations = languages.map( lang => lang.name );

  return {
    ...config,
    packageName,
    packagePath,
    packageType,
  };
}
