import MagicString from 'magic-string';

export function wrapInIife( mode = null ) {
  return {
    name: 'wrap-in-iife',

    renderChunk( code, chunk, options, meta ) {
      const mappedCode = new MagicString( code );

      if ( mode == 'onload' ) {
        mappedCode.prepend( 'window.addEventListener( "DOMContentLoaded", () => {' );
        mappedCode.append( '} );' );
      } else {
        mappedCode.prepend( '( () => {' );
        mappedCode.append( '} )();' );
      }

      return {
        code: mappedCode.toString(),
        map: mappedCode.generateMap( {
          source: chunk.id,
          includeContent: true,
          hires: true,
        } ),
      };
    }
  };
}
