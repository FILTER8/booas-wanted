import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import sharp from "sharp";
import { BOOA_RENDERER_ADDRESS } from "@/lib/booa";

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

const SIZE = 64;

function getRpcUrl(): string {
  if (process.env.ALCHEMY_SHAPE_RPC_URL) return process.env.ALCHEMY_SHAPE_RPC_URL;
  if (process.env.ALCHEMY_API_KEY) {
    return `https://shape-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
  }
  throw new Error("Missing ALCHEMY_SHAPE_RPC_URL or ALCHEMY_API_KEY");
}

function decodeDataUriJson(tokenURI: string): Record<string, unknown> {
  if (tokenURI.startsWith("data:application/json;base64,")) {
    const base64 = tokenURI.slice("data:application/json;base64,".length);
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
  }

  if (tokenURI.startsWith("data:application/json,")) {
    const encoded = tokenURI.slice("data:application/json,".length);
    return JSON.parse(decodeURIComponent(encoded));
  }

  throw new Error("Unsupported tokenURI format");
}

function extractSvgFromMetadataImage(image: unknown): Buffer {
  if (typeof image !== "string") {
    throw new Error("Metadata image missing");
  }

  if (image.startsWith("data:image/svg+xml;base64,")) {
    const base64 = image.slice("data:image/svg+xml;base64,".length);
    return Buffer.from(base64, "base64");
  }

  if (image.startsWith("data:image/svg+xml;utf8,")) {
    const utf8 = image.slice("data:image/svg+xml;utf8,".length);
    return Buffer.from(decodeURIComponent(utf8), "utf8");
  }

  if (image.startsWith("data:image/svg+xml,")) {
    const raw = image.slice("data:image/svg+xml,".length);
    return Buffer.from(decodeURIComponent(raw), "utf8");
  }

  throw new Error("Unsupported metadata image format");
}

function bytesToHex(data: Uint8Array | Buffer): string {
  let hex = "";
  for (let i = 0; i < data.length; i++) {
    hex += data[i].toString(16).padStart(2, "0");
  }
  return hex;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function buildPaletteFromRgb(data: Buffer): string[] {
  const counts = new Map<string, number>();

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const hex = rgbToHex(r, g, b);
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex);
}

async function svgToBuffers(svgBuffer: Buffer) {
  const base = sharp(svgBuffer, { density: 144 }).resize(SIZE, SIZE, {
    fit: "fill",
    kernel: sharp.kernel.nearest
  });

  const { data: rgbData } = await base
    .clone()
    .flatten({ background: "#000000" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: grayData } = await base
    .clone()
    .flatten({ background: "#ffffff" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    rgb: Buffer.from(rgbData),
    gray: Buffer.from(grayData)
  };
}

export async function GET(request: NextRequest) {
  try {
    const tokenIdStr = request.nextUrl.searchParams.get("tokenId");

    if (!tokenIdStr || !/^\d+$/.test(tokenIdStr)) {
      return NextResponse.json({ error: "Invalid tokenId" }, { status: 400 });
    }

    const tokenId = BigInt(tokenIdStr);

    const client = createPublicClient({
      transport: http(getRpcUrl())
    });

    const tokenURI = await client.readContract({
      address: BOOA_RENDERER_ADDRESS as `0x${string}`,
      abi: BOOA_RENDERER_ABI,
      functionName: "tokenURI",
      args: [tokenId]
    });

    const metadata = decodeDataUriJson(tokenURI);
    const svgBuffer = extractSvgFromMetadataImage(metadata.image);
    const { rgb, gray } = await svgToBuffers(svgBuffer);
    const palette = buildPaletteFromRgb(rgb);

    return NextResponse.json(
      {
        tokenId: Number(tokenId),
        width: SIZE,
        height: SIZE,
        grayscale: bytesToHex(gray),
        rgb: bytesToHex(rgb),
        palette
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
        }
      }
    );
  } catch (error) {
    console.error("booa-oled error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}