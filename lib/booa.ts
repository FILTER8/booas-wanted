export const MAX_TOKEN_ID = 3333;

export const BOOA_CONTRACT_ADDRESS =
  "0x7aecA981734d133d3f695937508C48483BA6b654";

export const BOOA_STORAGE_ADDRESS =
  "0x966aB07b061d75b8b30Ae4D06853dDf26d0f4EB0";

export const BOOA_RENDERER_ADDRESS =
  "0xD9Eb24AAe8099E336F7F37164173E81D1bF96aD8";

export type StyleName = "clean" | "hybrid" | "gritty";
export type EffectMode = "none" | "g1" | "g2";

export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
] as const;

export const BAYER8 = [
  [0, 48, 12, 60, 3, 51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [8, 56, 4, 52, 11, 59, 7, 55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [2, 50, 14, 62, 1, 49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58, 6, 54, 9, 57, 5, 53],
  [42, 26, 38, 22, 41, 25, 37, 21]
] as const;

export function clampInt(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function wrapToken(id: number): number {
  if (id < 1) return MAX_TOKEN_ID;
  if (id > MAX_TOKEN_ID) return 1;
  return id;
}

export function fastNoise(x: number, y: number, seed: number): number {
  let n = ((x * 73856093) ^ (y * 19349663) ^ (seed * 83492791)) >>> 0;
  n ^= n >>> 13;
  n = Math.imul(n, 1274126177) >>> 0;
  n ^= n >>> 16;
  return n & 255;
}

export function cellNoise(x: number, y: number, cell: number, seed: number): number {
  const cx = Math.floor(x / cell);
  const cy = Math.floor(y / cell);
  return fastNoise(cx, cy, seed);
}

export function adjustContrast(gray: number, contrast: number, brightness: number): number {
  let v = gray + brightness;
  v = (v - 128) * contrast + 128;
  v = Math.max(0, Math.min(255, v));
  return v | 0;
}

export function stylePixelOn(
  x: number,
  y: number,
  gray: number,
  level: number,
  style: StyleName,
  tokenId: number
): boolean {
  if (style === "clean") {
    const g = adjustContrast(gray, 1.06, 2);
    return g < level;
  }

  if (style === "hybrid") {
    const g = adjustContrast(gray, 1.08, 4);
    const d = (BAYER4[y & 3][x & 3] - 7) * 5;
    const n = (cellNoise(x, y, 2, tokenId) & 7) - 4;
    return g + d + n < level;
  }

  const g = adjustContrast(gray, 1.16, -2);
  const d = (BAYER8[y & 7][x & 7] - 31) * 2;
  const n = ((cellNoise(x, y, 4, tokenId + 77) & 15) - 8) * 2;
  return g + d + n < level;
}

export function wrapX(x: number, width: number): number {
  while (x < 0) x += width;
  while (x >= width) x -= width;
  return x;
}