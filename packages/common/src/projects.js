import { join } from 'path';

export function makeDotNetProjects( config ) {
  const projects = [];

  if ( config.projects != null ) {
    for ( const project of config.projects )
      projects.push( makeDotNetProject( project, config.languages ) );
  }

  return projects;
}

function makeDotNetProject( project, languages ) {
  if ( typeof project == 'string' )
    project = { name: project };

  if ( project.projectName == null )
    project.projectName = project.name;

  if ( project.domain == null )
    project.domain = project.name;

  if ( project.translations == null )
    project.translations = languages.map( lang => lang.name );

  return project;
}

export function makeWordPressProjects( config ) {
  const project = [];

  if ( config.plugins != null ) {
    for ( const name in config.plugins )
      project.push( makeWordPressProject( config.plugins[ name ], name, join( config.paths.content, 'plugins', name ), 'plugin', config.languages ) );
  }

  if ( config.themes != null ) {
    for ( const name in config.themes )
      project.push( makeWordPressProject( config.themes[ name ], name, join( config.paths.content, 'themes', name ), 'theme', config.languages ) );
  }

  return project;
}

function makeWordPressProject( config, projectName, projectPath, projectType, languages ) {
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
    projectName,
    projectPath,
    projectType,
  };
}
