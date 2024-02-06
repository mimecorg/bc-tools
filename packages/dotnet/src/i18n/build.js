import { join } from 'path';

import { buildMoFile } from 'bc-tools-common';

export async function buildAllTranslations( languagesConfig, rootPath ) {
  const { projects, languages } = languagesConfig;

  for ( const project of projects )
    await buildTranslations( project, rootPath, languages );
}

async function buildTranslations( project, rootPath, languages ) {
  let projectName, domain;
  if ( typeof project == 'string' ) {
    projectName = project;
    domain = project;
  } else {
    projectName = project.name;
    domain = project.domain;
  }

  const languagesPath = join( rootPath, projectName, 'languages' );

  await processDomain( domain, languagesPath, languages );
  await processDomain( domain + '.js', languagesPath, languages );
}

async function processDomain( domain, languagesPath, languages ) {
  for ( const language of languages ) {
    const name = `${domain}.${language.name}`;
    await buildMoFile( name, languagesPath );
  }
}
