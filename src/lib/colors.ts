import type { BrandColors } from "./types";

export const DEFAULT_COLORS: BrandColors = {
  forest: "#1F3A2E",
  terra: "#B4532A",
  amber: "#E9A23B",
  sand: "#E3D0B0",
  cream: "#F6EFE3",
};

const HEX = /^#([0-9a-f]{6})$/i;

function toRgb(hex: string): [number, number, number] | null {
  const m = HEX.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

/** Mezcla un color con blanco (amount > 0) o negro (amount < 0). */
function shade(hex: string, amount: number): string {
  const rgb = toRgb(hex);
  if (!rgb) return hex;
  const target = amount > 0 ? 255 : 0;
  const a = Math.abs(amount);
  return toHex(rgb.map((c) => c + (target - c) * a) as [number, number, number]);
}

export function isHex(value: string): boolean {
  return HEX.test(value);
}

/**
 * Variables CSS para los colores de Ajustes. Si el color es el del diseño,
 * no se escribe nada y se usan los valores exactos de globals.css.
 */
export function colorVars(colors: BrandColors): Record<string, string> {
  const vars: Record<string, string> = {};
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  if (isHex(colors.forest) && !same(colors.forest, DEFAULT_COLORS.forest)) {
    vars["--forest"] = colors.forest;
    vars["--forest-dk"] = shade(colors.forest, -0.35);
    vars["--forest-hover"] = shade(colors.forest, 0.12);
  }
  if (isHex(colors.terra) && !same(colors.terra, DEFAULT_COLORS.terra)) {
    vars["--terra"] = colors.terra;
    vars["--terra-text"] = shade(colors.terra, -0.15);
    vars["--terra-deep"] = shade(colors.terra, -0.36);
  }
  if (isHex(colors.amber) && !same(colors.amber, DEFAULT_COLORS.amber)) {
    vars["--amber"] = colors.amber;
    vars["--amber-hover"] = shade(colors.amber, 0.18);
  }
  if (isHex(colors.sand) && !same(colors.sand, DEFAULT_COLORS.sand)) {
    vars["--sand"] = colors.sand;
    vars["--sand-2"] = shade(colors.sand, 0.2);
    vars["--sand-3"] = shade(colors.sand, 0.35);
  }
  if (isHex(colors.cream) && !same(colors.cream, DEFAULT_COLORS.cream)) {
    vars["--cream"] = colors.cream;
  }
  return vars;
}
