import { readlink, symlink, unlink } from 'fs/promises';
import { join } from 'path';

import { resolveProjectAliases } from '../aliases.js';

const rootPath = process.cwd();
const nodeModulesPath = join( rootPath, 'node_modules' );

export function projectAliases( projectPath, aliases ) {
  return {
    name: 'project-aliases',

    async config( config ) {
      const alias = {};

      const resolvedAliases = resolveProjectAliases( projectPath, aliases );

      for ( const [ name, target ] of Object.entries( resolvedAliases ) ) {
        const linkPath = join( nodeModulesPath, name );

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

        alias[ name ] = join( linkPath );
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
