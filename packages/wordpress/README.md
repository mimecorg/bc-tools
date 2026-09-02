# Bulletcode WordPress tools

A collection of tools for WordPress projects created by Bulletcode.


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
makeProjectInputs( project )
```

Return a list of inputs for the given projects.

```js
wpExternals( { prefix = null, injectPolyfill = false, customExternals = null, codeSplitting = null, wrapMode = null } )
```

Vite plugin which converts WordPress imports to global variables and generates the `assets.php` file containing script dependencies. It can also convert custom externals to global variables and perform code splitting using global variables. It wraps the scripts in an IIFE expression, or optionally, a `DOMContentLoaded` event handler.

```js
cssCharset()
```

Vite plugin which prepends `@charset "UTF-8";` to CSS files if necessary.

```js
generateImports( imports )
```

Vite plugin which creates import files for selected scripts and CSS files.
