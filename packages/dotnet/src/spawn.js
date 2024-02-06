import { spawn } from 'child_process';

export function spawnProcess( command, args, options = {} ) {
  return (new Promise( ( resolve, reject ) => {
    const child = spawn( command, args, { ...options, stdio: 'inherit', env: process.env } );
    child.on( 'exit', () => resolve() );
    child.on( 'error', error => reject( error ) );
  } ));
}
