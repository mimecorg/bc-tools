# Bulletcode WordPress tools

A collection of tools for WordPress projects created by Bulletcode.


## Commands

```
bc-build [--watch] [--dev] [--sourcemap] [--no-minify] [CONFIG]
```

Build plugin and theme assets using Vite. The path of a configuration file relative to the project root can be specified, by default it's `build.config.js`. Assets are built in production mode unless the `--dev` flag is specified. If `--watch` is used, assets are automatically rebuilt when source files are modified.


## Configuration

### build.config.js

This file contains information about WordPress plugins and themes and supported languages, for example:

```js
export default {
  paths: {
    wordpress: 'web/wp',
    content: 'web/app',
  },
  plugins: {
    'my-plugin': {
      scripts: [ 'index.js' ],
      styles: [ 'style.scss' ],
    },
  },
  themes: {
    'my-theme': {
      scripts: [ 'style.js', 'editor.js' ],
      styles: [ 'styles/style.scss', 'styles/editor.scss', 'styles/editor-style.scss' ],
    },
  },
  languages: [
    {
      name: 'pl_PL',
      nplurals: 3,
      plural: 'n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2',
    },
  ],
};
```


## API

```js
makeWordPressProjects( config )
```

Return a list of plugins and themes based on the given configuration.

```js
jsAsJsx()
```

Vite plugin with interprets .js files as .jsx files and automatically adds imports from `"@wordpress/element"`.

```js
wpExternals( { prefix, injectPolyfill = false, customExternals = null } )
```

Vite plugin which converts WordPress imports and optionally custom externals to global variables and generates the `assets.php` file containing script dependencies.

```js
splitChunks( { main, shared, vendors, mainVar, sharedVar, vendorsVar } )
```

Vite plugin which implements custom code splitting based on global variables.

```js
wrapInIife( mode = null )
```

Vite plugin which wraps the scripts in an IIFE expression, or optionally, a `DOMContentLoaded` event handler.

```js
cssCharset()
```

Vite plugin which prepends `@charset "UTF-8";` to CSS files if necessary.

```js
generateImports( imports )
```

Vite plugin which creates import files for selected scripts and CSS files.
