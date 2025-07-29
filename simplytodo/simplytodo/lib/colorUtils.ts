/**
 * Color utility functions for the theme system
 */

/**
 * RGB 색상을 hex 색상으로 변환
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Hex 색상을 RGB로 변환
 */
export function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

/**
 * 중요도에 따른 색상 생성 (기존 로직과 호환)
 */
export function generateImportanceColor(
  importance: number,
  baseColor: [number, number, number],
  darkColor: [number, number, number]
): string {
  const factor = Math.min(importance / 5, 1);
  
  const r = Math.round(baseColor[0] + (darkColor[0] - baseColor[0]) * factor);
  const g = Math.round(baseColor[1] + (darkColor[1] - baseColor[1]) * factor);
  const b = Math.round(baseColor[2] + (darkColor[2] - baseColor[2]) * factor);
  
  return rgbToHex(r, g, b);
}

/**
 * 색상에 투명도 추가
 */
export function addAlpha(color: string, alpha: number): string {
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    if (rgb) {
      return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
    }
  }
  
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  
  return color;
}

/**
 * 색상의 밝기 계산 (0-255)
 */
export function getLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  
  // ITU-R BT.709 luminance formula
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/**
 * 텍스트에 적합한 대비 색상 반환 (흰색 또는 검은색)
 */
export function getContrastColor(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor);
  return luminance > 128 ? '#000000' : '#FFFFFF';
}

/**
 * 두 색상 간의 대비비 계산
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * WCAG AA 기준 대비비 확인 (4.5:1)
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5;
}

/**
 * WCAG AAA 기준 대비비 확인 (7:1)
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 7;
}