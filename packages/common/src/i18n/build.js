import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

import { compareRefence } from 'bc-gettext-utils';
import { po, mo } from 'gettext-parser';

export async function buildMoFile( name, languagesPath ) {
  const poFile = `${name}.po`;
  const moFile = `${name}.mo`;

  const poPath = join( languagesPath, poFile );
  const moPath = join( languagesPath, moFile );

  let existingPo = null;

  try {
    existingPo = await readFile( poPath );
  } catch ( err ) {
    if ( err.code != 'ENOENT' )
      throw err;
  }

  if ( existingPo == null )
    return null;

  const data = po.parse( existingPo );

  const generatedPo = po.compile( data, { sort: compareRefence, eol: '\r\n' } );
  const generatedMo = mo.compile( data );

  await writeFile( poPath, generatedPo );
  await writeFile( moPath, generatedMo );

  return data;
}
