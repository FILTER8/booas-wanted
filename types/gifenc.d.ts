declare module "gifenc" {
  export type GIFEncoderInstance = {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options?: {
        palette?: number[] | Uint8Array | Uint8ClampedArray;
        delay?: number;
      }
    ): void;
    finish(): void;
    bytes(): number[];
    bytesView?(): Uint8Array;
  };

  export function GIFEncoder(): GIFEncoderInstance;

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number
  ): number[];

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[] | Uint8Array | Uint8ClampedArray
  ): Uint8Array;
}