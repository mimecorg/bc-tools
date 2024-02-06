export async function replaceAsync( string, regExp, replaceCallback ) {
  const replacements = await Promise.all( Array.from( string.matchAll( regExp ), match => replaceCallback( ...match ) ) );
  let i = 0;
  return string.replace( regExp, () => replacements[ i++ ] );
}
