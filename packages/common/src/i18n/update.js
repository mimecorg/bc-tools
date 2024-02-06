import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

import { mergeTranslations, normalizePlurals, compareRefence } from 'bc-gettext-utils';
import { po } from 'gettext-parser';

export async function updateOrCreatePoFile( name, projectId, languagesPath, builder, language ) {
  const poFile = `${name}.po`;

  const poPath = join( languagesPath, poFile );

  const { nplurals = 2, plural = 'n != 1' } = language;

  let existingPo = null;

  try {
    existingPo = await readFile( poPath );
  } catch ( err ) {
    if ( err.code != 'ENOENT' )
      throw err;
  }

  let headers;
  let mergedTranslations;
  let statusMessage;

  if ( existingPo != null ) {
    const existingData = po.parse( existingPo );

    const { translations, added, updated, deleted } = mergeTranslations( existingData.translations, builder.translations );

    if ( added == 0 && updated == 0 && deleted == 0 )
      return false;

    headers = existingData.headers;
    mergedTranslations = translations;

    statusMessage = `Updated ${poFile} (${added} added/${updated} updated/${deleted} deleted messages)`;
  } else {
    if ( builder.count == 0 )
      return false;

    headers = {
      'MIME-Version': '1.0',
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Transfer-Encoding': '8bit',
      'Project-Id-Version': projectId,
      'Language': language.name.replace( '-', '_' ),
      'Plural-Forms': `nplurals=${nplurals}; plural=(${plural});`,
    };

    mergedTranslations = builder.translations;

    statusMessage = `Created ${poFile} (${builder.count} messages)`;
  }

  const translations = normalizePlurals( mergedTranslations, nplurals );

  const generatedPo = po.compile( { headers, translations }, { sort: compareRefence, eol: '\r\n' } );

  await mkdir( languagesPath, { recursive: true } );

  await writeFile( poPath, generatedPo );

  console.log( statusMessage );

  return true;
}
