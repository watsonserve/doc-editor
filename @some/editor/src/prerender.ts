import { getFont } from './helper';
import {
  EnWriteType,
  ITxtNode,
  ITextStyleNode,
  IDocNode,
  IParagraphStyle,
  IRow,
  IParagraph,
  IParagraphOnlyStyle
} from './types';
import { findStyleNode } from './helper';

function _getFontMaxSize(arr: IDocNode[]) {
  let fontSize = 0;

  for (let _node of arr as ITextStyleNode[]) {
    if (!(EnWriteType.FONT_STYLE & _node.type)) continue;
    if (fontSize < _node.fontSize) {
      fontSize = _node.fontSize;
    }
  }

  return fontSize;
}

type Canvas = HTMLCanvasElement;

function genCanvas(): Canvas {
  const OffscreenCanvas = (window as any).OffscreenCanvas;
  return OffscreenCanvas && new OffscreenCanvas(300, 300) || document.createElement('canvas');
}

export class PreRender {
  private readonly elCanvas = genCanvas();
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
   * @returns [段数, 字数]
   */
  _getLine(arr: IDocNode[], width: number): number[] {
    const sum = arr.length;
    let segWidth = 0, useWidth = 0, i = 0;

    for (; i < sum && useWidth < width; i++) {
      const { type, txt, BIUS, fontSize = 0, fontFamily } = arr[i] as (ITxtNode & ITextStyleNode);

      switch (type) {
        // @ts-ignore
        case EnWriteType.PARAGRAPH_STYLE:
          if (i || !i && i === sum) return [i, 0];
        case EnWriteType.FONT_STYLE:
          this.ctx.font = getFont(
            BIUS,
            fontSize,
            fontFamily
          );
          console.log('cvs', this.ctx.font);
          break;
        case EnWriteType.TEXT:
          segWidth = this.ctx.measureText(txt).width;
          useWidth += segWidth;
          (arr[i] as ITxtNode).width = segWidth;
          break;
        default:
      }
    }

    // 数组用尽，处理最后一个节点
    i -= +(sum <= i || EnWriteType.TEXT !== arr[i].type);

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
      let _sign = sign;
      subLen += sign;
      i -= +!subLen;

      // 方向折返
      while (subLen && sign && sign === _sign) {
        // 子字符串宽度
        segWidth = this.ctx.measureText(txt.substring(0, subLen)).width;
        // 需要加/减字符
        _sign = Math.sign(space - segWidth);
        // 失去方向不影响subLen
        subLen += _sign;
      };
    }

    if (!subLen) {
      // 也许末尾有样式节点，过滤掉
      for (; i && EnWriteType.TEXT !== arr[i].type; i--);
      i++;
    }
    // 返回段数
    return [i, subLen];
  }

  _splice(arr: IDocNode[], seg: number, cnt: number) {
    const foo = arr.splice(0, seg);

    if (cnt) {
      const node = arr[0] as ITxtNode;
      let txt = node.txt.substring(0, cnt);
      foo.push({ ...node, txt, width: this.ctx.measureText(txt).width });
      txt = node.txt.substring(cnt);
      Object.assign(node, { txt, width: this.ctx.measureText(txt).width });

      const stylNode = findStyleNode(foo);
      stylNode && arr.unshift(stylNode);
    }

    return foo;
  }

  initParagraph(arr: IDocNode[], width: number): IRow[] {
    const paragraphStyle = arr[0] as IParagraphStyle;
    const { firstIndent, indent } = paragraphStyle;
    const paragraphs = [];

    let _tab = firstIndent;
    if (arr.length < 2) {
      return [{
        line: arr,
        tab: _tab,
        baseHeight: paragraphStyle.fontSize
      }];
    }

    do {
      const [seg, cnt] = this._getLine(arr, width - _tab);
      const line = this._splice(arr, seg, cnt);

      paragraphs.push({
        line,
        tab: _tab,
        baseHeight: _getFontMaxSize(line)
      });

      if (firstIndent === _tab) {
        _tab = indent;
      }
    } while (arr.length);

    return paragraphs;
  }

  initArticle(arr: IDocNode[], width: number): IParagraph[] {
    if (!arr.length) return [];

    if (EnWriteType.PARAGRAPH_STYLE !== arr[0].type) {
      console.warn('first doc-node is not paragraph-style node');
      return [];
    };

    const paragraphs: IParagraph[] = [];
    let sn = 0;

    let i = 0;
    let j = 2;
    for (; j < arr.length; j++) {
      if (EnWriteType.PARAGRAPH_STYLE === arr[i].type) {
        const pStyle = arr[i] as IParagraphOnlyStyle;
        paragraphs.push({
          sn: sn++,
          marginTop: pStyle.marginTop,
          marginBottom: pStyle.marginBottom,
          lineMargin: pStyle.lineMargin,
          list: this.initParagraph(arr.slice(i, j), width)
        });
        i = j;
      }
    }

    const pStyle = arr[i] as IParagraphOnlyStyle;
    paragraphs.push({
      sn,
      marginTop: pStyle.marginTop,
      marginBottom: pStyle.marginBottom,
      lineMargin: pStyle.lineMargin,
      list: this.initParagraph(arr.slice(i, j), width)
    });

    return paragraphs;
  }
}
