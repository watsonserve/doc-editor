import { getFont } from './helper';
import {
  EnWriteType,
  ITxtNode,
  IFontStyle,
  IFontStyleNode,
  IDocNode,
  IParagraphOnlyStyle,
  IParagraphNode,
  IParagraphStyle,
  IParagraphDesc
} from './types';

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

export function getFontStyleNode(arr: IDocNode[]): IFontStyleNode | undefined {
  let i = arr.length - 1;
  for (; i && !(EnWriteType.FONT_STYLE & arr[i].type); i--);
  if (!(EnWriteType.FONT_STYLE & arr[i].type)) return;
  return { ...(pickFontStyle(arr[i] as IFontStyle)), type: EnWriteType.FONT_STYLE };
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

function _splice(arr: IDocNode[], seg: number, cnt: number) {
  const foo = arr.splice(seg);

  if (cnt) {
    const node = arr[0] as ITxtNode;
    foo.push({ ...node, txt: node.txt.substring(0, cnt) });
    node.txt = node.txt.substring(cnt);

    let i = foo.length - 1;
    const stylNode = getFontStyleNode(foo);
    stylNode && arr.unshift(stylNode);
  }

  return foo;
}

function _getFontMaxSize(arr: IDocNode[]) {
  let fontSize = 0;

  for (let _node of arr as IFontStyleNode[]) {
    if (!(EnWriteType.FONT_STYLE & _node.type)) continue;
    if (fontSize < _node.fontSize) {
      fontSize = _node.fontSize;
    }
  }

  return fontSize;
}

export class PreRender {
  private elCanvas = document.createElement('canvas');
  private ctx;

  constructor() {
    const ctx = this.elCanvas.getContext('2d');
    if (!ctx) throw new Error('get 2d context failed');
    this.ctx = ctx;
  }

  /**
   * 计算可以放多少字符
   * @param arr 数据
   * @param width 可用空间
   * @param scale 缩放倍率
   * @returns [段数, 字数]
   */
  getLine(arr: IDocNode[], width: number, scale = 1): number[] {
    const sum = arr.length;
    let segWidth = 0, useWidth = 0, i = 0;
    width *= scale;

    for (; i < sum && useWidth < width; i++) {
      const { type, txt, fontWeight, fontSize = 0, fontFamily } = arr[i] as (ITxtNode & IFontStyleNode);

      switch (type) {
        case EnWriteType.PARAGRAPH_STYLE:
          if (i) return [i, 0];
          // eslint-disable-next-line @typescript/fall-through
        case EnWriteType.FONT_STYLE:
          this.ctx.font = getFont(
            'normal',
            fontWeight * scale,
            fontSize * scale,
            fontFamily
          );
          break;
        case EnWriteType.TEXT:
          segWidth = this.ctx.measureText(txt).width;
          useWidth += segWidth;
          break;
        default:
      }
    }

    // 返回段数
    if (useWidth <= width) {
      return [i + +(EnWriteType.FONT_STYLE !== arr[i].type), 0];
    }

    // 剩余空间
    const space = width + segWidth - useWidth;
    // 没放下的文本
    const txt = (arr[i] as ITxtNode).txt;
    // 按比例计算大致字数
    let subLen = Math.max(1, ~~(txt.length * space / segWidth));
    // 子字符串宽度
    segWidth = this.ctx.measureText(txt.substring(0, subLen)).width;
    // 需要加/减字符
    const sign = Math.sign(space - segWidth);
    subLen += sign;

    while (subLen && sign) {
      // 子字符串宽度
      segWidth = this.ctx.measureText(txt.substring(0, subLen)).width;
      // 需要加/减字符
      const _sign = Math.sign(space - segWidth);
      // 方向折返
      if (sign !== _sign) break;
      // 失去方向不影响subLen
      subLen += _sign;
    };

    if (!subLen && EnWriteType.FONT_STYLE === arr[i].type) {
      i--;
    }

    return [i + 1, subLen];
  }

  getParagraph(arr: IDocNode[], width: number, scale = 1): IParagraphDesc | undefined {
    if (EnWriteType.PARAGRAPH_STYLE !== arr[0].type) {
      console.warn('first doc-node is not paragraph-style node');
      return;
    };

    let _arr = JSON.parse(JSON.stringify(arr)) as IDocNode[];
    const { firstTab, tab, marginTop, marginBottom, lineMargin } = _arr[0] as IParagraphStyle;
    let is1stLine = true;
    const paragraph = [];

    do {
      let _tab = tab;

      if (is1stLine) {
        _tab = firstTab;
        is1stLine = false;
      }

      const [seg, cnt] = this.getLine(arr, width - _tab, scale);
      const line = _splice(_arr, seg, cnt);

      paragraph.push({
        line,
        tab: _tab,
        baseHeight: _getFontMaxSize(line)
      });
    } while (_arr.length && EnWriteType.PARAGRAPH_STYLE !== _arr[0].type);

    return { marginTop, marginBottom, lineMargin, paragraph };
  }
}
