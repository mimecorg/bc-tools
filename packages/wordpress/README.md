# Bulletcode WordPress tools

A collection of tools for WordPress projects created by Bulletcode.


## Tools

```
bc-wp-i18n update [CONFIG]
```

Update .po files from sources.

```
bc-wp-i18n build [CONFIG]
```

Create .mo and .json files from .po files.

```
bc-wp-i18n comments add [SRC_PO_FILE] [DEST_PO_FILE]
```

Add translations from source .po file as comments to destination .po file.

```
bc-wp-i18n comments remove [PO_FILE]
```

Remove comments from .po file.

```
bc-wp-build [--watch] [--dev] [--sourcemap] [--no-minify] [CONFIG]
```

Build plugin and theme assets using Vite.


## Configuration

### build.config.js

This file contains plugins and themes containing assets to build and information about languages, for example:

```
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

```
makePackages( config )
```

Return a list of plugins and themes based on the given configuration.

```
jsAsJsx()
```

Vite plugin with interprets .js files as .jsx files and automatically adds imports from `"@wordpress/element"`.

```
wpExternals( { prefix, injectPolyfill = false, customExternals = null } )
```

Vite plugin which converts WordPress imports and optionally custom externals to global variables and generates the `assets.php` file containing script dependencies.

```
splitChunks( { main, shared, vendors, mainVar, sharedVar, vendorsVar } )
```

Vite plugin which implements custom code splitting based on global variables.

```
wrapInIife( mode = null )
```

Vite plugin which wraps the scripts in an IIFE expression, or optionally, a `DOMContentLoaded` event handler.

```
cssCharset()
```

Vite plugin which prepends `@charset "UTF-8";` to CSS files if necessary.

```
generateImports( imports )
```

Vite plugin which creates import files for selected scripts and CSS files.
