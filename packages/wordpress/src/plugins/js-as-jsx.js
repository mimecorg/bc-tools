import { transformWithEsbuild } from 'vite';

export function jsAsJsx() {
  return {
    name: 'js-as-jsx',

    async transform( code, id ) {
      if ( !id.match( /\.js$/ ) || id.includes( 'node_modules' ) )
        return;

      const result = await transformWithEsbuild( code, id, {
        loader: 'jsx',
        jsx: 'transform',
        jsxFactory: '__jsx_createElement',
        jsxFragment: '__jsx_Fragment',
      } );

      if ( result.code.includes( '__jsx_createElement' ) ) {
        if ( result.code.includes( '__jsx_Fragment' ) )
          result.code = 'import { createElement as __jsx_createElement, Fragment as __jsx_Fragment } from "@wordpress/element";' + result.code;
        else
          result.code = 'import { createElement as __jsx_createElement } from "@wordpress/element";' + result.code;
      }

      return result;
    },
  };
}
