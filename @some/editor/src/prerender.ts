import { getFont } from './helper';
import {
  EnWriteType,
  ITxtNode,
  IFontStyleNode,
  IDocNode,
  IParagraphStyle,
  IRow
} from './types';
import { findStyleNode } from './helper';

function _splice(arr: IDocNode[], seg: number, cnt: number) {
  const foo = arr.splice(seg);

  if (cnt) {
    const node = arr[0] as ITxtNode;
    foo.push({ ...node, txt: node.txt.substring(0, cnt) });
    node.txt = node.txt.substring(cnt);

    let i = foo.length - 1;
    const stylNode = findStyleNode(foo);
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

    for (; i < sum && useWidth < width && arr[i]; i++) {
      const { type, txt, fontWeight, fontSize = 0, fontFamily } = arr[i] as (ITxtNode & IFontStyleNode);

      switch (type) {
        // eslint-disable-next-line
        case EnWriteType.PARAGRAPH_STYLE:
          if (i || !i && i === sum) return [i, 0];
          // tslint-disable-next-line
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
    if (!arr[i]) return [i, 0];

    let subLen = 0;
    if (width < useWidth) {
      // 剩余空间
      const space = width + segWidth - useWidth;
      // 没放下的文本
      const txt = (arr[i] as ITxtNode).txt;
      // 按比例计算大致字数
      subLen = Math.max(1, ~~(txt.length * space / segWidth));
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
    }

    if (!subLen) for (; i && EnWriteType.TEXT !== arr[i].type; i--);

    // 返回段数
    return [i + +(EnWriteType.TEXT === arr[i].type), subLen];
  }

  initArticle(arr: IDocNode[], width: number, scale = 1): IRow[] {
    if (!arr.length || EnWriteType.PARAGRAPH_STYLE !== arr[0].type) {
      console.warn('first doc-node is not paragraph-style node');
      return [];
    };

    const { firstTab, tab } = arr[0] as IParagraphStyle;
    const paragraph = [];

    let _tab = firstTab;
    do {
      const [seg, cnt] = this.getLine(arr, width - _tab, scale);
      const segments = _splice(arr, seg, cnt);

      paragraph.push({
        segments,
        tab: _tab,
        baseHeight: _getFontMaxSize(segments)
      });

      if (firstTab === _tab) {
        _tab = tab;
      }
    } while (arr.length);

    return paragraph;
  }
}
