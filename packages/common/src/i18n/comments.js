import { readFile, writeFile } from 'fs/promises';

import { po } from 'gettext-parser';

export async function updateComments( srcPath, destPath ) {
  const srcPo = srcPath != null ? await readFile( srcPath ) : null;
  const destPo = await readFile( destPath );

  const srcData = srcPo != null ? po.parse( srcPo ) : null;
  const destData = po.parse( destPo );

  for ( const ctx in destData.translations ) {
    for ( const key in destData.translations[ ctx ] ) {
      if ( key == '' )
        continue;

      const destValue = destData.translations[ ctx ][ key ];

      if ( srcData != null ) {
        if ( srcData.translations[ ctx ] != null && srcData.translations[ ctx ][ key ] != null ) {
          const srcValue = srcData.translations[ ctx ][ key ];

          destValue.comments.extracted = srcValue.msgstr[ 0 ];
        }
      } else {
        destValue.comments.extracted = null;
      }
    }
  }

  const generatedPo = po.compile( destData, { eol: '\r\n' } );

  await writeFile( destPath, generatedPo );
}
