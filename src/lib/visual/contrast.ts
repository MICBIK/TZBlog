export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export function parseHslTriplet(value: string): HslColor {
  const match = value
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%$/);

  if (!match) {
    throw new Error(`Invalid HSL triplet: ${value}`);
  }

  return {
    h: Number(match[1]),
    s: Number(match[2]),
    l: Number(match[3]),
  };
}

export function contrastRatio(foreground: HslColor, background: HslColor): number {
  const foregroundLuminance = relativeLuminance(hslToRgb(foreground));
  const backgroundLuminance = relativeLuminance(hslToRgb(background));
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function hslToRgb(color: HslColor): [number, number, number] {
  const hue = (((color.h % 360) + 360) % 360) / 360;
  const saturation = color.s / 100;
  const lightness = color.l / 100;

  if (saturation === 0) {
    return [lightness, lightness, lightness];
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return [
    hueToRgb(p, q, hue + 1 / 3),
    hueToRgb(p, q, hue),
    hueToRgb(p, q, hue - 1 / 3),
  ];
}

function hueToRgb(p: number, q: number, t: number): number {
  let normalized = t;

  if (normalized < 0) normalized += 1;
  if (normalized > 1) normalized -= 1;
  if (normalized < 1 / 6) return p + (q - p) * 6 * normalized;
  if (normalized < 1 / 2) return q;
  if (normalized < 2 / 3) return p + (q - p) * (2 / 3 - normalized) * 6;

  return p;
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(toLinearRgb) as [number, number, number];

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function toLinearRgb(channel: number): number {
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}
