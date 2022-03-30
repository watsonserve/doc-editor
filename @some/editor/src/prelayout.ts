import { getFont } from "./helper";

interface ITxtRange {
  txt: string;
  size: number;
  family: string;
  weight: number;
}

export class PreLayout {
  private elCanvas = document.createElement('canvas');
  private ctx;

  constructor() {
    const ctx = this.elCanvas.getContext('2d');
    if (!ctx) throw new Error('get 2d context failed');
    this.ctx = ctx;
  }

  /**
   * 计算可以放多少字符
   * @param width 可用空间
   * @param arr 数据
   * @returns [段数, 字数]
   */
  getLine(width: number, arr: ITxtRange[]) {
    const sum = arr.length;
    let segWidth = 0, useWidth = 0, i = 0;

    for (; i < sum && useWidth < width; i++) {
      const { txt, weight, size, family } = arr[i];
      this.ctx.font = getFont('normal', weight, size, family);
      segWidth = this.ctx.measureText(txt || '').width;
      useWidth += segWidth;
    }

    // 返回段数
    if (useWidth <= width) return [i, 0];

    // 剩余空间
    const space = width + segWidth - useWidth;
    // 没放下的文本
    const txt = arr[i].txt;
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

    return [i, subLen];
  }
}
