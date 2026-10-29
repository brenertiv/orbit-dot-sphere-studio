// Save a generated file: through the artifact viewer's downloads capability when the studio runs inside Claude,
// otherwise as an ordinary browser download. `data` is a string, Blob or Uint8Array.
export async function saveFile(filename, data, type) {
  if (window.claude?.use) {
    const downloads = await window.claude.use('downloads');
    if (!downloads) throw new Error('Saving isn’t available here.');
    await downloads.save({ filename, data: data instanceof Uint8Array ? data.slice(0) : data });
    return;
  }
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
