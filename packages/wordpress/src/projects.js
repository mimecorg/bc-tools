import { join } from 'path';

export function makeProjectInputs( project ) {
  const inputs = [];
  for ( const script of project.scripts )
    inputs.push( join( project.projectPath, 'src', script ) );
  for ( const style of project.styles )
    inputs.push( join( project.projectPath, 'src', style ) );
  return inputs;
}
