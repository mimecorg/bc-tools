import { extname } from 'path';

export function cssCharset() {
  return {
    name: 'css-charset',

    generateBundle( options, bundle ) {
      for ( const key in bundle ) {
        const { type, name, source } = bundle[ key ];
        if ( type == 'asset' && name != null && extname( name ) == '.css' ) {
          if ( !source.includes( '@charset' ) && /[^\x00-\x7F]/.test( source ) )
            bundle[ key ].source = '@charset "UTF-8";' + bundle[ key ].source;
        }
      }
    }
  };
}
