import { getFont } from './helper';
import { EnWriteType, IDocNode, __IDocNode } from './types';

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
  getLine(arr: IDocNode[], width: number, scale = 1) {
    const sum = arr.length;
    let segWidth = 0, useWidth = 0, i = 0;
    width *= scale;
    let fontMaxSize = 0, fontSecSize = 0;

    for (; i < sum && useWidth < width; i++) {
      const { type, txt, fontWeight, fontSize = 0, fontFamily } = arr[i] as __IDocNode;

      switch (type) {
        case EnWriteType.FONT_STYLE:
          this.ctx.font = getFont(
            'normal',
            fontWeight * scale,
            fontSize * scale,
            fontFamily
          );
          if (fontMaxSize < fontSize) {
            fontSecSize = fontMaxSize;
            fontMaxSize = fontSize;
          }
          break;
        case EnWriteType.TEXT:
          segWidth = this.ctx.measureText(txt).width;
          useWidth += segWidth;
          break;
        case EnWriteType.PARAGRAPH_STYLE:
          if (i) return [i + 1, 0];
          break;
        default:
      }
    }

    // 返回段数
    if (useWidth <= width) {
      if (EnWriteType.FONT_STYLE === arr[i].type) {
        i--;
      }
      return [i + 1, 0];
    }

    // 剩余空间
    const space = width + segWidth - useWidth;
    // 没放下的文本
    const txt = (arr[i] as __IDocNode).txt;
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

    return [i + 1, subLen];
  }
}
