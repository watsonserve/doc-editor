import {
  EnWriteType,
  ITextStyle,
  IParagraphOnlyStyle,
  IParagraphStyle,
  IStyleNode,
  IParagraphNode,
  IDocNode,
  EnFontStyle
} from './types';

let _ppi = 0;

export function getPPI(flush = false) {
  if (!flush && _ppi) return _ppi;

  const foo = document.createElement('div');
  foo.style.width = '1in';
  document.body.append(foo);
  const ppi = foo.clientWidth;
  foo.remove();
  _ppi = ppi;
  return ppi;
}

// PPI: px / in
// DPI: dot / in
// PT : 1 / 72in
export class Scaler {
  private dpi = 300;
  private ppi = getPPI();
  private static readonly _instance = new Scaler();

  static get instance() {
    return Scaler._instance;
  }

  px2dot = (px: number) => px * this.dpi / this.ppi;

  pt2dot = (pt: number) => pt * this.dpi / 72;

  dot2px = (dot: number) => dot * this.ppi /this.dpi;

  dot2pt = (dot: number) => dot * 72 / this.dpi;
}


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

export function getFont(style: number, size: number, family: string) {
  const weight = style & 0xffff;
  const fontStyle = (style & EnFontStyle.ITALIC) ? 'italic' : 'normal';
  return `${fontStyle} ${weight} ${size}px ${family}`;
}

function pick<T>(s: T, ks: (keyof T)[]) {
  return ks.reduce((d, k) => {
    d[k] = s[k];
    return d;
  }, {} as T) as T;
}

function pickFontStyle(s: ITextStyle) {
  return pick(s, ['fontFamily', 'fontSize', 'color', 'BIUS', 'superscript', 'letterSpacing', 'fontFamily', 'fontSize', 'backgroundColor']);
}

function pickParagraph(s: IParagraphOnlyStyle): IParagraphOnlyStyle {
  return pick(s, ['firstIndent', 'indent', 'marginTop', 'marginBottom', 'lineMargin', 'textAlign', 'justify']);
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
    ...pickFontStyle(arr[fi] as ITextStyle),
    type: EnWriteType.PARAGRAPH_STYLE
  };
}

export function partial(s: Record<string, any>, keys: Set<string>) {
  return Object.keys(s).reduce((pre, k) => {
    if (keys.has(k)) {
      pre[k] = s[k];
      delete s[k];
    }
    return pre;
  }, {} as Record<string, any>);
}

export function blob2Txt(file: Blob) {
  const fr = new FileReader();
  fr.readAsText(file);
  return new Promise<string>((resolve, reject) => {
    fr.onload = () => resolve(fr.result as string);
    fr.onabort = (ev) => reject(new Error('abort'));
  });
}

export async function readJSONFile() {
  const [fileHandle] = await (window as any).showOpenFilePicker({ types: [{ accept: { 'application/json': ['.json'] } }] })
  const file = await fileHandle.getFile();
  const fc = await blob2Txt(file);
  return JSON.parse(fc);
}
