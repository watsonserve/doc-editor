import {
  EnWriteType,
  IFontStyle,
  IParagraphOnlyStyle,
  IParagraphStyle,
  IStyleNode,
  IParagraphNode,
  IDocNode
} from './types';

export function genId() {
  return (window.crypto as any).randomUUID();
}

export function getLineHeight(fontSize: number) {
  return fontSize / 2 * 3;
}

export function getLineMarginHalf(lineHeight: number, lineMargin: number) {
  // 顶部行间距
  return lineHeight * (lineMargin - 1) / 2;
}

export function getBaseline(fontSize: number, lineMargin: number) {
  const foo = fontSize / 2;
  const lineHeight = foo * 3;
  const lineMarginHalf = lineHeight * (lineMargin - 1) / 2;
  return [
    lineMarginHalf + fontSize,
    lineMarginHalf + foo
  ];
}

export function getLineMiddle(lineHeight: number, lineMargin: number) {
  return lineHeight * lineMargin / 2;
}

export function getFont(style: string, weight: number, size: number, family: string) {
  return `${style} normal ${weight} ${size}px ${family}`;
}

export function copyAll<T extends {}>(s: T) {
  const d = {} as T;
  for (let k in s) {
    d[k] = s[k];
  }
  return d;
}

function pick<T>(s: T, ks: (keyof T)[]) {
  return ks.reduce((d, k) => {
    d[k] = s[k];
    return d;
  }, {} as T) as T;
}

function pickFontStyle(s: IFontStyle) {
  return pick(s, ['fontFamily', 'fontSize', 'fontWeight']);
}

function pickParagraph(s: IParagraphOnlyStyle): IParagraphOnlyStyle {
  return pick(s, ['firstTab', 'tab', 'marginTop', 'marginBottom', 'lineMargin']);
}

export function findStyleNode(arr: IDocNode[]): IStyleNode | undefined {
  let i = arr.length - 1;
  for (; i && !(EnWriteType.FONT_STYLE & arr[i].type); i--);
  if (!(EnWriteType.FONT_STYLE & arr[i].type)) return;
  return arr[i] as IStyleNode;
}

export function getParagraphNode(arr: IDocNode[]): IParagraphNode | undefined {
  let fi = arr.length - 1;
  let pi = arr.length - 1;
  for (; fi && !(EnWriteType.FONT_STYLE & arr[fi].type); fi--);
  for (; pi && !(EnWriteType.PARAGRAPH_STYLE & arr[pi].type); pi--);

  if (!(EnWriteType.PARAGRAPH_STYLE & arr[pi].type)) return;

  if (fi <= pi) return { ...arr[pi] as IParagraphNode };

  return {
    ...(pickParagraph(arr[pi] as IParagraphStyle)),
    ...pickFontStyle(arr[fi] as IFontStyle),
    type: EnWriteType.PARAGRAPH_STYLE
  };
}
