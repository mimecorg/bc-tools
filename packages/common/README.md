# Bulletcode common tools

A collection of tools shared by .NET projects and WordPress projects created by Bulletcode.


## Commands

```
bc-i18n update [CONFIG]
```

Update .po files from source files. The path of a configuration file relative to the project root can be specified, by default it's `build.config.js`. Both .NET and WordPress configuration files are supported.

```
bc-i18n build [CONFIG]
```

Create .mo files from .po files.

```
bc-i18n comments add [SRC_PO_FILE] [DEST_PO_FILE]
```

Add translations from source .po file as comments to destination .po file.

```
bc-i18n comments remove [PO_FILE]
```

Remove comments from .po file.


## Configuration

### languages.config.js

This file contains information about .NET projects and supported languages, for example:

```js
export default {
  languages: [
    {
      name: 'pl-PL',
      nplurals: 3,
      plural: 'n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2',
    },
  ],
  projects: [
    {
      name: 'App.Desktop',
      domain: 'MyApp',
    },
    'App.Web',
  ],
};
```

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
      styles: [ 'styles/style.scss', 'styles/editor.scss' ],
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
