# Bulletcode .NET tools

A collection of tools for .NET projects created by Bulletcode.


## Tools

```
bc-i18n update [CONFIG]
```

Update .po files from sources.

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

```
bc-switch projects [CONFIG]
```

Switch package references to project references and add projects to the solution.

```
bc-switch packages [CONFIG]
```

Switch project references to package references and remove projects from the solution.


## Configuration

### languages.config.js

This file contains information about languages and projects containing translations, for example:

```
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

### switch.config.js

This file contains the package prefix and the relative path of the folder containing the projects:

```
export default {
  prefix: 'Bulletcode',
  targetPath: '../bc-dotnet',
};
```


## API

```
resolveProjectAliases( projectPath, aliases )
```

Create aliases for projects based on package references or project references.

```
spawnProcess( command, args, options = {} )
```

Spawn a child process and return a `Promise` which resolves when the process completes.

```
cssCharset()
```

Vite plugin which prepends `@charset "UTF-8";` to CSS files if necessary.
