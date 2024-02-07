# Bulletcode .NET tools

A collection of tools for .NET projects created by Bulletcode.


## Commands

```
bc-switch projects [CONFIG]
```

Switch package references to project references and add projects to the solution. The path of a configuration file relative to the project root can be specified, by default it's `switch.config.js`.

```
bc-switch packages [CONFIG]
```

Switch project references to package references and remove projects from the solution.


## Configuration

### switch.config.js

This file contains the prefix of the packages to switch and the relative path of the folder containing their source code:

```js
export default {
  prefix: 'Bulletcode',
  targetPath: '../bc-dotnet',
};
```


## API

```js
makeDotNetProjects( config )
```

Return a list projects based on the given configuration.

```js
resolveProjectAliases( projectPath, aliases )
```

Create aliases for projects based on package references or project references.

```js
spawnProcess( command, args, options = {} )
```

Spawn a child process and return a `Promise` which resolves when the process completes.

```js
cssCharset()
```

Vite plugin which prepends `@charset "UTF-8";` to CSS files if necessary.
