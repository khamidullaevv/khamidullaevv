// Google Fonts serves woff2 by default, but satori only supports ttf/otf/woff.
// Requesting with an old User-Agent (that predates woff2 support) makes Google
// fall back to serving .ttf links in the CSS response — a well-known trick.
const LEGACY_UA =
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.0.0 Safari/537.36";

export async function fetchGoogleFontTtf(family, weight) {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@${weight}&display=swap`;

  const cssRes = await fetch(cssUrl, {
    headers: { "User-Agent": LEGACY_UA },
  });
  if (!cssRes.ok) {
    throw new Error(`Failed to fetch font CSS for ${family} ${weight}: ${cssRes.status}`);
  }
  const css = await cssRes.text();
  const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/);
  if (!match) {
    throw new Error(`No .ttf URL found in Google Fonts CSS for ${family} ${weight}`);
  }
  const fontRes = await fetch(match[1]);
  if (!fontRes.ok) {
    throw new Error(`Failed to download font file for ${family} ${weight}: ${fontRes.status}`);
  }
  return Buffer.from(await fontRes.arrayBuffer());
}
