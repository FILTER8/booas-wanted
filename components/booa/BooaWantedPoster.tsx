"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";

const font = { fontFamily: "var(--font-departure-mono)" };

type MetaAttribute = {
  trait_type?: string;
  value?: string | number;
};

type MetaResponse = {
  tokenId: number;
  name: string | null;
  description: string | null;
  external_url: string | null;
  image: string | null;
  attributes: MetaAttribute[];
};

function normalizeHex(value: string): string | null {
  const clean = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) return clean;
  if (/^[0-9a-fA-F]{6}$/.test(clean)) return `#${clean}`;
  return null;
}

function getPaletteFromAttributes(attributes: MetaAttribute[]): string[] {
  const paletteValues = attributes
    .filter((attr) => {
      const key = String(attr.trait_type ?? "").toLowerCase();
      return key.includes("palette") || key.includes("color");
    })
    .map((attr) => normalizeHex(String(attr.value ?? "")))
    .filter((value): value is string => Boolean(value));

  const deduped = Array.from(new Set(paletteValues));

  if (deduped.length > 0) return deduped;

  return [
    "#a5564a",
    "#c88379",
    "#70bac3",
    "#84680d",
    "#6f6f6f",
    "#c0cb7e",
    "#ffffff",
    "#5a4fa3",
    "#ae7440",
    "#b1b1b1",
    "#8b82cb",
    "#969696",
    "#a45fb2"
  ];
}

function getBoundaryTexts(attributes: MetaAttribute[]): string[] {
  const values = attributes
    .filter((attr) => String(attr.trait_type ?? "").toLowerCase() === "boundary")
    .map((attr) => String(attr.value ?? "").trim())
    .filter(Boolean);

  return Array.from(new Set(values));
}

function polarToCartesian(angleDeg: number, distance: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.round(Math.cos(rad) * distance),
    y: Math.round(Math.sin(rad) * distance)
  };
}

function Swatch({
  color,
  active,
  onClick
}: {
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={color}
      onClick={onClick}
      className="h-6 w-6 border"
      style={{
        backgroundColor: color,
        borderColor: active ? "#ffffff" : "rgba(255,255,255,0.15)",
        boxShadow: active ? "0 0 0 1px #fff, inset 0 0 0 2px #000" : "none"
      }}
    />
  );
}

function ControlLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-white/56" style={font}>
      {children}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 flex-1 border px-2 text-[10px] uppercase tracking-[0.18em] transition-colors"
      style={{
        ...font,
        borderColor: active ? "#ffffff" : "rgba(255,255,255,0.12)",
        background: active ? "#ffffff" : "transparent",
        color: active ? "#000000" : "#ffffff"
      }}
    >
      {children}
    </button>
  );
}

function PixelSlider({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div
        className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/70"
        style={font}
      >
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="relative h-6">
        <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-white/25" />
        <div
          className="absolute top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 border border-white bg-black"
          style={{ left: `${percent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
}

function TitleLayer({
  text,
  color,
  fontSize,
  letterSpacing,
  shadowColor,
  shadowX,
  shadowY
}: {
  text: string;
  color: string;
  fontSize: number;
  letterSpacing: number;
  shadowColor: string;
  shadowX: number;
  shadowY: number;
}) {
  return (
    <div className="relative inline-block">
      <div
        aria-hidden="true"
        className="absolute inset-0 text-center uppercase leading-none"
        style={{
          ...font,
          color: shadowColor,
          fontSize: `${fontSize}px`,
          letterSpacing: `${letterSpacing}em`,
          transform: `translate(${shadowX}px, ${shadowY}px)`,
          pointerEvents: "none",
          whiteSpace: "nowrap"
        }}
      >
        {text}
      </div>
      <div
        className="relative text-center uppercase leading-none"
        style={{
          ...font,
          color,
          fontSize: `${fontSize}px`,
          letterSpacing: `${letterSpacing}em`,
          whiteSpace: "nowrap"
        }}
      >
        {text}
      </div>
    </div>
  );
}

function SliderGroup({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-white/12 p-3">
      <div className="mb-3 text-[10px] uppercase tracking-[0.24em] text-white/60" style={font}>
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default function BooasWantedPage() {
  const posterRef = useRef<HTMLDivElement | null>(null);

  const [tokenId, setTokenId] = useState(409);
  const [inputId, setInputId] = useState("409");
  const [maxTokenId, setMaxTokenId] = useState(3333);
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [titleColor, setTitleColor] = useState("#70bac3");
  const [wantedColor, setWantedColor] = useState("#c88379");
  const [selectedBoundary, setSelectedBoundary] = useState(0);

  const [titleSize, setTitleSize] = useState(64);
  const [wantedSize, setWantedSize] = useState(88);
  const [boundarySize, setBoundarySize] = useState(18);

  const [titleSpacing, setTitleSpacing] = useState(0.18);
  const [wantedSpacing, setWantedSpacing] = useState(0.2);
  const [boundarySpacing, setBoundarySpacing] = useState(0.08);

  const [titleShadowColor, setTitleShadowColor] = useState("#000000");
  const [wantedShadowColor, setWantedShadowColor] = useState("#000000");
  const [titleShadowAngle, setTitleShadowAngle] = useState(225);
  const [wantedShadowAngle, setWantedShadowAngle] = useState(225);
  const [titleShadowDistance, setTitleShadowDistance] = useState(4);
  const [wantedShadowDistance, setWantedShadowDistance] = useState(4);

  const [activeTitleColorTab, setActiveTitleColorTab] = useState<"fg" | "offset">("fg");
  const [activeWantedColorTab, setActiveWantedColorTab] = useState<"fg" | "offset">("fg");
  const [boundaryHighlight, setBoundaryHighlight] = useState(false);

  const fetchMeta = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/booa-meta?tokenId=${id}`, {
        cache: "no-store"
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch token ${id}`);
      }

      const json = (await res.json()) as MetaResponse;
      setMeta(json);
      setMaxTokenId((prev) => Math.max(prev, json.tokenId || 1));

      const palette = getPaletteFromAttributes(json.attributes ?? []);
      setTitleColor(palette[2] ?? palette[0] ?? "#70bac3");
      setWantedColor(palette[0] ?? "#c88379");
      setTitleShadowColor(palette[0] ?? "#000000");
      setWantedShadowColor(palette[2] ?? palette[0] ?? "#000000");
      setSelectedBoundary(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const randomToken = useCallback(() => {
    const next = Math.floor(Math.random() * Math.max(1, maxTokenId)) + 1;
    setTokenId(next);
    setInputId(String(next));
  }, [maxTokenId]);

  useEffect(() => {
    randomToken();
  }, [randomToken]);

  useEffect(() => {
    fetchMeta(tokenId);
  }, [fetchMeta, tokenId]);

  const palette = useMemo(() => getPaletteFromAttributes(meta?.attributes ?? []), [meta]);
  const boundaries = useMemo(() => getBoundaryTexts(meta?.attributes ?? []), [meta]);
  const boundaryText = boundaries[selectedBoundary] ?? "";

  const titleShadowOffset = useMemo(
    () => polarToCartesian(titleShadowAngle, titleShadowDistance),
    [titleShadowAngle, titleShadowDistance]
  );
  const wantedShadowOffset = useMemo(
    () => polarToCartesian(wantedShadowAngle, wantedShadowDistance),
    [wantedShadowAngle, wantedShadowDistance]
  );

  const submitId = () => {
    const parsed = Math.max(1, Number(inputId || "1") || 1);
    setTokenId(parsed);
    setInputId(String(parsed));
  };

  const exportPoster = async () => {
    if (!posterRef.current || !meta?.image || isExporting) return;

    try {
      setIsExporting(true);
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#000000",
        skipFonts: false,
        canvasWidth: 1800,
        canvasHeight: 1800,
        style: {
          margin: "0",
          transform: "scale(1)",
          transformOrigin: "top left"
        }
      });

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `booas-wanted-${tokenId}.png`;
      a.click();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-4 py-4 text-white md:px-5 md:py-5">
      <div className="mx-auto grid w-full max-w-[1440px] gap-4 xl:grid-cols-[260px_minmax(0,1fr)_280px] xl:gap-4">
        <aside className="border border-white/12 bg-black p-4">
          <div className="mb-6 text-[11px] uppercase tracking-[0.32em] text-white/72" style={font}>
            BOOAS WANTED POSTER
          </div>

          <ControlLabel>Load BOOAS as OG</ControlLabel>
          <div className="flex items-center gap-2">
            <input
              value={inputId}
              onChange={(e) => setInputId(e.target.value.replace(/[^\d]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitId();
              }}
              className="h-11 min-w-0 flex-1 border border-white/14 bg-black px-3 text-center text-[20px] text-white outline-none"
              style={font}
            />
            <button
              type="button"
              onClick={submitId}
              className="h-11 shrink-0 border border-white bg-white px-4 text-[12px] uppercase tracking-[0.2em] text-black transition-colors hover:bg-black hover:text-white"
              style={font}
            >
              LOAD
            </button>
          </div>

          <button
            type="button"
            onClick={randomToken}
            className="mt-2 h-11 w-full border border-white bg-white text-[12px] uppercase tracking-[0.2em] text-black transition-colors hover:bg-black hover:text-white"
            style={font}
          >
            RANDOM
          </button>

          <div className="mt-6">
            <ControlLabel>Boundary text</ControlLabel>
            <div className="flex max-h-[360px] flex-col gap-2 overflow-y-auto pr-1">
              {boundaries.length > 0 ? (
                boundaries.map((item, index) => (
                  <button
                    key={`${item}-${index}`}
                    type="button"
                    onClick={() => setSelectedBoundary(index)}
                    className={`w-full border px-3 py-3 text-left text-[11px] leading-[1.5] tracking-[0.04em] ${
                      selectedBoundary === index
                        ? "border-white bg-white text-black"
                        : "border-white/14 text-white hover:border-white/40"
                    }`}
                    style={font}
                  >
                    {item}
                  </button>
                ))
              ) : (
                <div className="border border-white/14 px-3 py-3 text-[11px] text-white/50" style={font}>
                  No boundary found in metadata
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 border border-white/12 p-3">
            <div className="mb-3 text-[10px] uppercase tracking-[0.24em] text-white/60" style={font}>
              Boundary highlight
            </div>
            <button
              type="button"
              onClick={() => setBoundaryHighlight((v) => !v)}
              className="h-9 w-full border text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-white hover:text-black"
              style={{
                ...font,
                borderColor: boundaryHighlight ? "#ffffff" : "rgba(255,255,255,0.15)",
                background: boundaryHighlight ? "#ffffff" : "transparent",
                color: boundaryHighlight ? "#000000" : "#ffffff"
              }}
            >
              {boundaryHighlight ? "Highlight On" : "Highlight Off"}
            </button>
          </div>

          <button
            type="button"
            onClick={exportPoster}
            disabled={isExporting}
            className="mt-6 flex h-11 w-full items-center justify-center border text-[12px] uppercase tracking-[0.24em] disabled:opacity-50"
            style={{
              ...font,
              borderColor: "#ffffff",
              backgroundColor: "#ffffff",
              color: "#000000"
            }}
          >
            {isExporting ? "EXPORTING..." : "EXPORT PNG"}
          </button>
        </aside>

        <section className="border border-white/12 bg-black p-4">
          <div
            ref={posterRef}
            className="mx-auto aspect-square w-full max-w-[760px] border border-white/12 bg-black px-[8%] pt-[4.5%] pb-[8%]"
          >
            <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto_auto] justify-items-center gap-[1.5%]">
              <div className="pt-[0.25%]">
                <TitleLayer
                  text="BOOAS"
                  color={titleColor}
                  fontSize={titleSize}
                  letterSpacing={titleSpacing}
                  shadowColor={titleShadowColor}
                  shadowX={titleShadowOffset.x}
                  shadowY={titleShadowOffset.y}
                />
              </div>

              <div className="flex min-h-0 w-full items-center justify-center overflow-hidden py-[1%]">
                {meta?.image ? (
                  <img
                    src={meta.image}
                    alt={meta?.name ?? `BOOA ${tokenId}`}
                    className="max-h-full max-w-full object-contain"
                    style={{
                      imageRendering: "pixelated",
                      background: "#000000"
                    }}
                  />
                ) : (
                  <div className="flex aspect-square w-[82%] max-w-[560px] items-center justify-center text-white/45">
                    {loading ? "Loading..." : "No image"}
                  </div>
                )}
              </div>

              <div
                className="max-w-[82%] text-center leading-[1.45]"
                style={{
                  ...font,
                  fontSize: `${boundarySize}px`,
                  letterSpacing: `${boundarySpacing}em`,
                  color: boundaryHighlight ? "#000000" : "#ffffff",
                  background: boundaryHighlight ? "#ffffff" : "transparent",
                  padding: boundaryHighlight ? "4px 8px" : "0",
                  boxDecorationBreak: "clone",
                  WebkitBoxDecorationBreak: "clone"
                }}
              >
                {boundaryText}
              </div>

              <div className="pb-[2.25%] pt-[1.2%]">
                <TitleLayer
                  text="WANTED"
                  color={wantedColor}
                  fontSize={wantedSize}
                  letterSpacing={wantedSpacing}
                  shadowColor={wantedShadowColor}
                  shadowX={wantedShadowOffset.x}
                  shadowY={wantedShadowOffset.y}
                />
              </div>
            </div>
          </div>
        </section>

        <aside className="border border-white/12 bg-black p-4">
          <div className="space-y-4">
            <SliderGroup title="BOOAS">
              <div>
                <div className="mb-2 flex gap-2">
                  <TabButton
                    active={activeTitleColorTab === "fg"}
                    onClick={() => setActiveTitleColorTab("fg")}
                  >
                    FG
                  </TabButton>
                  <TabButton
                    active={activeTitleColorTab === "offset"}
                    onClick={() => setActiveTitleColorTab("offset")}
                  >
                    OFFSET
                  </TabButton>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {palette.map((color) => (
                    <Swatch
                      key={`title-tab-${color}`}
                      color={color}
                      active={
                        activeTitleColorTab === "fg"
                          ? titleColor === color
                          : titleShadowColor === color
                      }
                      onClick={() =>
                        activeTitleColorTab === "fg"
                          ? setTitleColor(color)
                          : setTitleShadowColor(color)
                      }
                    />
                  ))}
                </div>
              </div>

              <PixelSlider
                label="Size"
                value={titleSize}
                min={34}
                max={110}
                step={1}
                onChange={setTitleSize}
              />
              <PixelSlider
                label="Spacing"
                value={titleSpacing}
                min={0}
                max={0.4}
                step={0.01}
                onChange={setTitleSpacing}
              />
              <PixelSlider
                label="Angle"
                value={titleShadowAngle}
                min={0}
                max={360}
                step={1}
                onChange={setTitleShadowAngle}
              />
              <PixelSlider
                label="Distance"
                value={titleShadowDistance}
                min={0}
                max={14}
                step={1}
                onChange={setTitleShadowDistance}
              />
            </SliderGroup>

            <SliderGroup title="BOUNDARY">
              <PixelSlider
                label="Size"
                value={boundarySize}
                min={12}
                max={28}
                step={1}
                onChange={setBoundarySize}
              />
              <PixelSlider
                label="Spacing"
                value={boundarySpacing}
                min={0}
                max={0.16}
                step={0.01}
                onChange={setBoundarySpacing}
              />
            </SliderGroup>

            <SliderGroup title="WANTED">
              <div>
                <div className="mb-2 flex gap-2">
                  <TabButton
                    active={activeWantedColorTab === "fg"}
                    onClick={() => setActiveWantedColorTab("fg")}
                  >
                    FG
                  </TabButton>
                  <TabButton
                    active={activeWantedColorTab === "offset"}
                    onClick={() => setActiveWantedColorTab("offset")}
                  >
                    OFFSET
                  </TabButton>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {palette.map((color) => (
                    <Swatch
                      key={`wanted-tab-${color}`}
                      color={color}
                      active={
                        activeWantedColorTab === "fg"
                          ? wantedColor === color
                          : wantedShadowColor === color
                      }
                      onClick={() =>
                        activeWantedColorTab === "fg"
                          ? setWantedColor(color)
                          : setWantedShadowColor(color)
                      }
                    />
                  ))}
                </div>
              </div>

              <PixelSlider
                label="Size"
                value={wantedSize}
                min={48}
                max={130}
                step={1}
                onChange={setWantedSize}
              />
              <PixelSlider
                label="Spacing"
                value={wantedSpacing}
                min={0}
                max={0.4}
                step={0.01}
                onChange={setWantedSpacing}
              />
              <PixelSlider
                label="Angle"
                value={wantedShadowAngle}
                min={0}
                max={360}
                step={1}
                onChange={setWantedShadowAngle}
              />
              <PixelSlider
                label="Distance"
                value={wantedShadowDistance}
                min={0}
                max={18}
                step={1}
                onChange={setWantedShadowDistance}
              />
            </SliderGroup>
          </div>
        </aside>
      </div>
    </main>
  );
}