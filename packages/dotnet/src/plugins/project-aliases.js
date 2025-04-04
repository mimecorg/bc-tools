import { mkdir, readlink, symlink, unlink } from 'fs/promises';
import { join } from 'path';

import { resolveProjectAliases } from '../aliases.js';

const rootPath = process.cwd();
const depsPath = join( rootPath, '.deps' );

export function projectAliases( projectPath, aliases ) {
  return {
    name: 'project-aliases',

    async config( config ) {
      const alias = {};

      const resolvedAliases = resolveProjectAliases( projectPath, aliases );

      for ( const [ name, target ] of Object.entries( resolvedAliases ) ) {
        await mkdir( depsPath, { recursive: true } );

        const linkPath = join( depsPath, name );

        let existingTarget = null;

        try {
          existingTarget = await readlink( linkPath );
        } catch ( err ) {
          if ( err.code != 'ENOENT' )
            throw err;
        }

        if ( existingTarget != target ) {
          if ( existingTarget != null )
            await unlink( linkPath );
          await symlink( target, linkPath, 'dir' );
        }

        alias[ name ] = linkPath;
      }

      return {
        resolve: {
          alias,
          preserveSymlinks: true,
        },
      };
    },
  };
}
