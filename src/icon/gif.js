// A small, dependency-free animated GIF encoder for Orbit Icon frames.
// Icon frames hold only a solid background and five tones at varying opacity, so a fixed palette
// (the background plus each tone blended over it at 15 strengths) covers them closely.

const hex = c => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

/** 128 colours: the background, then each tone over it at 1/15 … 15/15 strength, padded with the background. */
export function iconPalette(background, tones) {
  const bg = hex(background), out = [bg];
  for (const t of tones.map(hex)) for (let k = 1; k <= 15; k++) out.push(bg.map((v, i) => Math.round(v + (t[i] - v) * k / 15)));
  while (out.length < 128) out.push(bg);
  return out;
}

/** Map RGBA pixels (alpha ignored; frames are opaque) to palette indices, nearest colour, cached. */
export function indexPixels(rgba, palette, cache = new Map()) {
  const out = new Uint8Array(rgba.length / 4);
  for (let p = 0, i = 0; p < rgba.length; p += 4, i++) {
    const key = (rgba[p] << 16) | (rgba[p + 1] << 8) | rgba[p + 2];
    let idx = cache.get(key);
    if (idx === undefined) {
      let best = Infinity;
      for (let c = 0; c < palette.length; c++) {
        const dr = rgba[p] - palette[c][0], dg = rgba[p + 1] - palette[c][1], db = rgba[p + 2] - palette[c][2];
        const d = dr * dr * 2 + dg * dg * 4 + db * db * 3;
        if (d < best) { best = d; idx = c; }
      }
      cache.set(key, idx);
    }
    out[i] = idx;
  }
  return out;
}

/** GIF LZW, with the variable code width and table reset the format expects. */
function lzw(indices, minCodeSize) {
  const clear = 1 << minCodeSize, eoi = clear + 1, out = [];
  let codeSize = minCodeSize + 1, next = eoi + 1, dict = new Map(), acc = 0, bits = 0;
  const emit = code => { acc |= code << bits; bits += codeSize; while (bits >= 8) { out.push(acc & 255); acc >>>= 8; bits -= 8; } };
  emit(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i], key = prefix * 256 + k, code = dict.get(key);
    if (code !== undefined) { prefix = code; continue; }
    emit(prefix);
    if (next === 4096) { emit(clear); dict = new Map(); next = eoi + 1; codeSize = minCodeSize + 1; }
    else { if (next >= 1 << codeSize) codeSize++; dict.set(key, next++); }
    prefix = k;
  }
  emit(prefix); emit(eoi);
  if (bits > 0) out.push(acc & 255);
  return out;
}

/**
 * Encode indexed frames as a looping GIF.
 * @param {Uint8Array[]} frames palette indices, width × height each
 * @param {number[][]} palette 128 [r, g, b] colours
 * @param {number} delay hundredths of a second per frame
 */
export function encodeGIF(frames, width, height, palette, delay) {
  const bytes = [];
  const u16 = v => bytes.push(v & 255, (v >> 8) & 255);
  const ascii = s => { for (const ch of s) bytes.push(ch.charCodeAt(0)); };
  const bitsPer = Math.ceil(Math.log2(palette.length));
  ascii('GIF89a'); u16(width); u16(height);
  bytes.push(0x80 | 0x70 | (bitsPer - 1), 0, 0);
  for (let i = 0; i < 1 << bitsPer; i++) bytes.push(...(palette[i] || [0, 0, 0]));
  bytes.push(0x21, 0xff, 0x0b); ascii('NETSCAPE2.0'); bytes.push(0x03, 0x01, 0, 0, 0); // loop forever
  for (const frame of frames) {
    bytes.push(0x21, 0xf9, 0x04, 0x04); u16(delay); bytes.push(0, 0);                 // keep previous, no transparency
    bytes.push(0x2c); u16(0); u16(0); u16(width); u16(height); bytes.push(0);
    const minCodeSize = Math.max(2, bitsPer);
    bytes.push(minCodeSize);
    const data = lzw(frame, minCodeSize);
    for (let i = 0; i < data.length; i += 255) { const block = data.slice(i, i + 255); bytes.push(block.length, ...block); }
    bytes.push(0);
  }
  bytes.push(0x3b);
  return new Uint8Array(bytes);
}
