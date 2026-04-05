import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import sharp from "sharp";
import { BOOA_RENDERER_ADDRESS, StyleName, clampInt, stylePixelOn } from "@/lib/booa";

export const maxDuration = 30;

const BOOA_RENDERER_ABI = [
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }]
  }
] as const;

const BOOA_WIDTH = 64;
const BOOA_HEIGHT = 64;
const SCREEN_WIDTH = 128;
const SCREEN_HEIGHT = 128;

function getRpcUrl(): string {
  if (process.env.ALCHEMY_SHAPE_RPC_URL) return process.env.ALCHEMY_SHAPE_RPC_URL;
  if (process.env.ALCHEMY_API_KEY) {
    return `https://shape-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  }
  throw new Error("Missing ALCHEMY_SHAPE_RPC_URL or ALCHEMY_API_KEY");
}

function copyUint8Array(bytes: ArrayLike<number>): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ?? 0;
  }
  return out;
}

function toArrayBuffer(bytes: ArrayLike<number>): ArrayBuffer {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i] ?? 0;
  }
  return out.buffer;
}

function decodeDataUriJson(tokenURI: string): Record<string, unknown> {
  if (tokenURI.startsWith("data:application/json;base64,")) {
    const base64 = tokenURI.slice("data:application/json;base64,".length);
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8")) as Record<string, unknown>;
  }

  if (tokenURI.startsWith("data:application/json,")) {
    const encoded = tokenURI.slice("data:application/json,".length);
    return JSON.parse(decodeURIComponent(encoded)) as Record<string, unknown>;
  }

  throw new Error("Unsupported tokenURI format");
}

function extractSvg(image: unknown): Buffer {
  if (typeof image !== "string") {
    throw new Error("Metadata image missing");
  }

  if (image.startsWith("data:image/svg+xml;base64,")) {
    return Buffer.from(image.split(",")[1], "base64");
  }

  if (image.startsWith("data:image/svg+xml;utf8,")) {
    return Buffer.from(decodeURIComponent(image.split(",")[1]), "utf8");
  }

  if (image.startsWith("data:image/svg+xml,")) {
    return Buffer.from(decodeURIComponent(image.split(",")[1]), "utf8");
  }

  throw new Error("Unsupported SVG format");
}

async function svgToGray(svg: Buffer): Promise<Uint8Array<ArrayBuffer>> {
  const { data } = await sharp(svg, { density: 144 })
    .resize(BOOA_WIDTH, BOOA_HEIGHT, {
      fit: "fill",
      kernel: sharp.kernel.cubic
    })
    .flatten({ background: "#000000" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return copyUint8Array(data);
}

function wrapX(x: number): number {
  while (x < 0) x += BOOA_WIDTH;
  while (x >= BOOA_WIDTH) x -= BOOA_WIDTH;
  return x;
}

function applyGlitch(
  input: Uint8Array<ArrayBuffer>,
  amount: number
): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(BOOA_WIDTH * BOOA_HEIGHT);
  out.set(input);

  const lineCount = clampInt(3 + amount * 2, 3, 28);
  const maxShift = clampInt(2 + amount * 2, 2, 20);

  for (let i = 0; i < lineCount; i++) {
    const y = Math.floor(Math.random() * BOOA_HEIGHT);
    const thickness =
      amount > 8 && Math.random() < 0.15
        ? 3
        : amount > 6 && Math.random() < 0.25
          ? 2
          : 1;

    const shift = Math.floor(Math.random() * (maxShift * 2 + 1)) - maxShift;

    for (let yy = y; yy < Math.min(y + thickness, BOOA_HEIGHT); yy++) {
      const rowOffset = yy * BOOA_WIDTH;
      for (let x = 0; x < BOOA_WIDTH; x++) {
        const srcX = wrapX(x - shift);
        out[rowOffset + x] = input[rowOffset + srcX];
      }
    }
  }

  if (amount >= 3 && Math.random() < 0.7) {
    const cutA = Math.floor(Math.random() * 20);
    const cutB = Math.min(cutA + 8 + Math.floor(Math.random() * 18), BOOA_HEIGHT);
    const shiftA = Math.floor(Math.random() * (maxShift * 2 + 1)) - maxShift;
    const shiftB = Math.floor(Math.random() * (maxShift * 4 + 1)) - maxShift * 2;

    for (let y = cutA; y < cutB; y++) {
      const rowOffset = y * BOOA_WIDTH;
      const shift = y < Math.floor((cutA + cutB) / 2) ? shiftA : shiftB;

      for (let x = 0; x < BOOA_WIDTH; x++) {
        const srcX = wrapX(x - shift);
        let bit = input[rowOffset + srcX];

        if (amount >= 6 && Math.random() < 0.03) {
          const sx2 = wrapX(srcX + (Math.floor(Math.random() * 7) - 3));
          bit = input[rowOffset + sx2];
        }

        out[rowOffset + x] = bit;
      }
    }
  }

  return out;
}

function drawRect(
  bitmap: Uint8Array<ArrayBuffer>,
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
  on: boolean
) {
  const value = on ? 255 : 0;

  for (let yy = y; yy < y + h; yy++) {
    if (yy < 0 || yy >= height) continue;

    for (let xx = x; xx < x + w; xx++) {
      if (xx < 0 || xx >= width) continue;
      bitmap[yy * width + xx] = value;
    }
  }
}

function renderBitmap(
  gray: Uint8Array<ArrayBuffer>,
  tokenId: number,
  style: StyleName,
  level: number,
  invertImage: boolean,
  glitch: boolean,
  glitchAmount: number
): Uint8Array<ArrayBuffer> {
  let bits: Uint8Array<ArrayBuffer> = new Uint8Array(BOOA_WIDTH * BOOA_HEIGHT);

  for (let y = 0; y < BOOA_HEIGHT; y++) {
    const rowOffset = y * BOOA_WIDTH;

    for (let x = 0; x < BOOA_WIDTH; x++) {
      const g = gray[rowOffset + x];
      let on = stylePixelOn(x, y, g, level, style, tokenId);

      if (invertImage) on = !on;
      bits[rowOffset + x] = on ? 1 : 0;
    }
  }

  if (glitch) {
    bits = applyGlitch(bits, glitchAmount);
  }

  const out: Uint8Array<ArrayBuffer> = new Uint8Array(SCREEN_WIDTH * SCREEN_HEIGHT);
  out.fill(0);

  for (let y = 0; y < BOOA_HEIGHT; y++) {
    const rowOffset = y * BOOA_WIDTH;

    for (let x = 0; x < BOOA_WIDTH; x++) {
      const on = bits[rowOffset + x] === 1;
      drawRect(out, SCREEN_WIDTH, SCREEN_HEIGHT, x * 2, y * 2, 2, 2, on);
    }
  }

  return out;
}

async function toPNG(bitmap: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const png = await sharp(bitmap, {
    raw: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      channels: 1
    }
  })
    .png()
    .toBuffer();

  return copyUint8Array(png);
}

export async function GET(req: NextRequest) {
  try {
    const tokenIdStr = req.nextUrl.searchParams.get("tokenId");
    const styleRaw = (req.nextUrl.searchParams.get("style") || "hybrid").toLowerCase();
    const glitch = req.nextUrl.searchParams.get("glitch") === "1";
    const glitchAmount = clampInt(
      Number(req.nextUrl.searchParams.get("glitchAmount") || "4"),
      1,
      10
    );
    const level = clampInt(Number(req.nextUrl.searchParams.get("level") || "128"), 60, 200);
    const invert = req.nextUrl.searchParams.get("invert");

    if (!tokenIdStr || !/^\d+$/.test(tokenIdStr)) {
      return NextResponse.json({ error: "Invalid tokenId" }, { status: 400 });
    }

    const tokenIdNum = Number(tokenIdStr);
    if (tokenIdNum < 1 || tokenIdNum > 3333) {
      return NextResponse.json({ error: "tokenId out of range" }, { status: 400 });
    }

    const style: StyleName =
      styleRaw === "clean" || styleRaw === "hybrid" || styleRaw === "gritty"
        ? styleRaw
        : "hybrid";

    const invertImage = invert === null ? true : invert === "1";

    const client = createPublicClient({
      transport: http(getRpcUrl())
    });

    const tokenURI = await client.readContract({
      address: BOOA_RENDERER_ADDRESS as `0x${string}`,
      abi: BOOA_RENDERER_ABI,
      functionName: "tokenURI",
      args: [BigInt(tokenIdStr)]
    });

    const metadata = decodeDataUriJson(tokenURI);
    const svg = extractSvg(metadata.image);
    const gray = await svgToGray(svg);
    const bitmap = renderBitmap(
      gray,
      tokenIdNum,
      style,
      level,
      invertImage,
      glitch,
      glitchAmount
    );
    const png = await toPNG(bitmap);
    const body = toArrayBuffer(png);

    return new NextResponse(body, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (err) {
    console.error("OLED frame route error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}