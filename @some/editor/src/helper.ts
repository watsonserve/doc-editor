export function getLineHeight(fontSize: number) {
  return fontSize / 2 * 3;
}

export function getLineMarginTop(lineHeight: number, lineMargin: number) {
  // 顶部行间距
  return lineHeight * (lineMargin - 1) / 2;
}

export function getLineMiddle(lineHeight: number, lineMargin: number) {
  return lineHeight * lineMargin / 2;
}

export function getFont(style: string, weight: number, size: number, family: string) {
  return `${style} normal ${weight} ${size}px ${family}`;
}
