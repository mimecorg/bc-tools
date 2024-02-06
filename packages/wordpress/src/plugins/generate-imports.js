import { basename, extname } from 'path';

export function generateImports( imports ) {
  return {
    name: 'generate-imports',

    generateBundle( options, bundle ) {
      for ( const key in bundle ) {
        const { name, fileName, type, isEntry, facadeModuleId } = bundle[ key ];

        const base = name != null ? basename( name, extname( name ) ) : null;
        const baseFileName = basename( fileName, extname( fileName ) );

        switch ( type ) {
          case 'chunk':
            if ( isEntry && facadeModuleId != null && extname( facadeModuleId ) == '.js' && imports.includes( `${name}.js` ) ) {
              this.emitFile( {
                type: 'asset',
                name: `${name}.js`,
                fileName: `${name}.js`,
                source: `import './${baseFileName}';\n`,
              } );
            }
            break;

          case 'asset':
            if ( name != null && extname( name ) == '.css' && imports.includes( `${base}.scss` ) ) {
              this.emitFile( {
                type: 'asset',
                name: `${base}.scss`,
                fileName: `${base}.scss`,
                source: `@import "${baseFileName}";\n`,
              } );
            }
        }
      }
    },
  };
}
