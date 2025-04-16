import { readFile } from 'fs/promises';

import { mo } from 'gettext-parser';

export async function convertMoToJs( moPath ) {
  const existingMo = await readFile( moPath );

  const data = mo.parse( existingMo );

  const translations = {};

  for ( const ctx in data.translations ) {
    for ( const key in data.translations[ ctx ] ) {
      if ( key == '' )
        continue;

      const value = data.translations[ ctx ][ key ];

      if ( ctx == '' )
        translations[ key ] = value.msgstr;
      else
        translations[ ctx + '\u0004' + key ] = value.msgstr;
    }
  }

  let plural = null;

  const pluralForms = data.headers[ 'Plural-Forms' ];

  if ( pluralForms != null ) {
    const matches = pluralForms.match( /\bplural\s*=\s*(.*?);/ );
    if ( matches != null )
      plural = matches[ 1 ];
  }

  let result = 'export default {\n';
  result += '  translations: ' + JSON.stringify( translations ) + ",\n";
  if ( plural != null )
    result += `  pluralRule( n ) { return ${plural}; },\n`;
  result += "};\n";

  return result;
}
