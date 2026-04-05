import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
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

    return NextResponse.json(
      {
        tokenId: Number(tokenId),
        name: typeof metadata.name === "string" ? metadata.name : null,
        description: typeof metadata.description === "string" ? metadata.description : null,
        external_url:
          typeof metadata.external_url === "string" ? metadata.external_url : null,
        image: typeof metadata.image === "string" ? metadata.image : null,
        attributes: Array.isArray(metadata.attributes) ? metadata.attributes : []
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
        }
      }
    );
  } catch (error) {
    console.error("booa-meta error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}