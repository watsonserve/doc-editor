import { Scaler, getLineHeight, getLineMarginHalf, getBaseline, getFont, pickParagraph, pickFontStyle, compParagraphHeight, findGtArray } from './helper';
import { EnWriteType, IBlockSize, ITextStyleNode, IParagraphNode, IDocNode, IRow, ITxtNode, EnDeleteType, IParagraph } from './types';
import { PreRender } from './prerender';

export interface IPoint {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

const { dot2pt, pt2dot, px2dot, dot2px, pt2px } = Scaler.instance;

function toDom(lis: IDocNode[]) {
  const { marginTop, marginBottom, lineMargin, textAlign } = pickParagraph(lis[0] as IParagraphNode);
  const pStyle = `margin-top:${marginTop}px;margin-bottom:${marginBottom}px;line-height:${lineMargin * 2}em;text-align:${textAlign}`;

  const p = document.createElement('p');
  p.setAttribute('style', pStyle);

  let span: HTMLSpanElement | null = null;
  for (let item of lis) {
    if (item.type & EnWriteType.FONT_STYLE) {
      const { fontFamily, fontSize, BIUS, color, backgroundColor } = pickFontStyle(item as ITextStyleNode);
      const font = getFont(BIUS, pt2px(fontSize), fontFamily);
      span = document.createElement('span');
      span.setAttribute('style', `font:${font};color:${color};background-color:${backgroundColor}`);
    } else if (span) {
      span.innerHTML = (item as ITxtNode).txt
        .replace(/&/g, '&amp;')
        .replace(/ /g, '&nbsp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      p.appendChild(span);
    }
  }

  return p;
};

/**
 * unit: dot
 */
export abstract class Editor {
  private readonly elCanvas = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D;
  private _pagePadding: IBlockSize = { top: 20, right: 20, bottom: 20, left: 20 };
  private _onCaretMove?: (p: IPoint) => void;
  private article: IParagraph[] = [];
  protected readonly prerender = new PreRender();
  protected abstract redraw(): void;

  constructor() {
    this.elCanvas.setAttribute('class', 'editor__canvas');
    const ctx = this.elCanvas.getContext('2d');
    if (!ctx) throw new Error('get canvas 2d context faild');
    this.ctx = ctx;

    this.elCanvas.addEventListener('resize', this.resize);
  }

  destroy() {
    console.warn('on editor destroy');
    this.elCanvas.removeEventListener('resize', this.resize);
    document.removeChild(this.elCanvas);
  }

  get canvas() {
    return this.elCanvas;
  }

  get pagePadding() {
    const { top, right, bottom, left } = this._pagePadding;
    return {
      top: dot2pt(top),
      right: dot2pt(right),
      bottom: dot2pt(bottom),
      left: dot2pt(left),
    };
  }

  protected get usableSize() {
    const { width, height } = this.elCanvas;
    const { top, right, bottom, left } = this._pagePadding;

    return {
      width: width - left - right,
      height: height - top - bottom
    };
  }

  set pagePadding(padding: IBlockSize) {
    let { top, right, bottom, left } = padding;

    top = pt2dot(top);
    right = pt2dot(right);
    bottom = pt2dot(bottom);
    left = pt2dot(left);

    this._pagePadding = { top, right, bottom, left };
    this.redraw();
  }

  /**
   * 设定当前光标位置
   * @param 点击坐标
   */
  set point(p: IPoint) {
    // 页的宽高
    const { width: pageWidth, height: pageHeight } = this.elCanvas;
    // 页边距
    const { top: paddingTop, right: paddingRight, bottom: paddingBottom, left: paddingLeft } = this._pagePadding;
    // 转换单位
    let x = px2dot(p.x);
    let y = px2dot(p.y);

    // 点击可用空间之外
    if (x < paddingLeft || pageWidth - paddingRight < x || y < paddingTop || pageHeight - paddingBottom < y) return;

    // 文档描述数据
    const article = this.article;
    const pHeightList = article.map(compParagraphHeight);
    // 段落号
    let paragraphNo = findGtArray(pHeightList, y - paddingTop);
    let rowNo = NaN;
    const isLastParaagraph = paragraphNo === article.length;
    if (isLastParaagraph) paragraphNo--;
    const { marginTop, lineMargin, list: lines } = article[paragraphNo];
    const lineHeights = lines.map(row => getLineHeight(row.baseHeight) * lineMargin);
    // 前序段所占高度
    const prefixYOffset = pHeightList.slice(0, paragraphNo).reduce((pre, item) => pre + item, 0);

    // 超過最後一段 -> 定位到最後一段的最後一行
    if (isLastParaagraph) {
      rowNo = lines.length - 1;
    } else {
      // 寻找所在行
      rowNo = findGtArray(lineHeights, y - paddingTop - prefixYOffset - marginTop);
    }

    y = paddingTop + prefixYOffset + marginTop + lineHeights.slice(0, rowNo).reduce((pre, item) => pre + item, 0);
    const row = lines[rowNo];
    // 矫正x坐标
    // this.prerender.getLine(row.line, x);

    // 设定光标
    const timer = setTimeout(() => {
      clearTimeout(timer);
      this.setCaretPoint(x, y, row.baseHeight, lineMargin);
    }, 0);
  }

  /**
   * 设定光标位置
   * @param x 光标的x坐标
   * @param y 光标所在行顶部的y坐标
   * @param baseHeight 光标所在行的最大字号
   * @param lineMargin 行间距
   */
  protected setCaretPoint(x: number, y: number, baseHeight: number, lineMargin: number) {
    const lineHeight = getLineHeight(baseHeight);
    const p = {
      x: dot2px(x),
      y: dot2px(y + getLineMarginHalf(lineHeight, lineMargin)),
      height: dot2px(lineHeight)
    };
    this._onCaretMove!(p);
  }

  set onCaretMove(fn: (p: IPoint) => void) {
    this._onCaretMove = fn;
  }

  /**
   * 绘制一行
   * @param row 行数据
   * @param x 行的左上角x坐标
   * @param y 行的左上角y坐标
   * @returns [绘制完成后右上角x坐标, 整行高]
   */
  private drawRow(row: IRow, x: number, y: number) {
    const { line, tab, baseHeight } = row;
    const stylSeg = line[0] as IParagraphNode;

    const [baseline, baseBottom] = getBaseline(baseHeight, stylSeg.lineMargin);
    const _base = y + baseline;
    x += tab;
    const width = this.usableSize.width - tab;

    for (let item of line) {
      if (EnWriteType.FONT_STYLE & item.type) {
        const { BIUS, color, fontFamily } = item as ITextStyleNode;
        const fontSize = (item as ITextStyleNode).fontSize;
        const font = getFont(BIUS, fontSize, fontFamily);
        this.ctx.font = font;
        if (color) {
          this.ctx.fillStyle = color;
        }
      } else {
        const { txt, width: segWdith } = item as ITxtNode;
        this.ctx.fillText(txt, x, _base, width);
        x += segWdith;
      }
    }

    return [x, baseline + baseBottom];
  }

  /**
   * 绘制一個自然段
   */
  private _drawParagraph(paragraph: IParagraph) {
    const { sn, list } = paragraph;
    const { width: pageWidth, height: pageHeight } = this.elCanvas;
    const pagePaddingLeft = this._pagePadding.left;
    let y = this._pagePadding.top;
    let paragraphMarginBottom = 0;
    let lineAllHeight = 0;
    let x = pagePaddingLeft;
    this.ctx.clearRect(0, 0, pageWidth, pageHeight);

    // this.ctx.fillStyle = '#eee';
    // this.ctx.fillRect(x, y, this.usableSize.width, this.usableSize.height);
    this.ctx.fillStyle = '#333';

    for (const row of list) {
      const stylSeg = row.line[0];
      // 首节点是段落节点，增加段顶距，设置段底距
      if (stylSeg.type === EnWriteType.PARAGRAPH_STYLE) {
        y += paragraphMarginBottom + stylSeg.marginTop;
        paragraphMarginBottom = stylSeg.marginBottom;
      }
      y += lineAllHeight;
      [x, lineAllHeight] = this.drawRow(row, pagePaddingLeft, y);
    }

    const { baseHeight, line } = list[list.length - 1];
    this.setCaretPoint(x, y, baseHeight, (line[0] as IParagraphNode).lineMargin);
  }

  /**
   * 绘制整個文章
   */
  protected draw(paragraphs: IParagraph[]) {
    this.article = paragraphs;
    paragraphs.forEach(segment => this._drawParagraph(segment));
  }

  protected drawDom(lines: IDocNode[]) {
    const { top, right, bottom, left } = this.pagePadding;
    const { clientWidth, clientHeight } = this.elCanvas;
    const elDom = document.createElement('div');
    elDom.setAttribute('style', `box-sizing:border-box;width:${clientWidth}px;height:${clientHeight}px;padding:${pt2px(top)}px ${pt2px(right)}px ${pt2px(bottom)}px ${pt2px(left)}px`);

    let start = 0;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].type === EnWriteType.PARAGRAPH_STYLE) {
        const p = toDom(lines.slice(start, i));
        elDom.appendChild(p);
        start = i;
      }
    }
    const p = toDom(lines.slice(start));
    elDom.appendChild(p);
    const box = document.createElement('div');
    box.appendChild(elDom);
    return `<html><body>${box.innerHTML}</body></html>`;
  }

  resize() {
    let changed = false;
    const { elCanvas } = this;

    const dotWidth = px2dot(elCanvas?.clientWidth || 0);
    const dotHeight = px2dot(elCanvas?.clientHeight || 0);

    if (dotWidth !== elCanvas.width) {
      elCanvas.width = dotWidth;
      changed = true;
    }
    if (dotHeight !== elCanvas.height) {
      elCanvas.height = dotHeight;
      changed = true;
    }
    if (!changed) return;
    this.redraw();
  }

  print() {
    this.elCanvas.toBlob(b => {
      console.log(b);
      if (!b) return;
      const url = URL.createObjectURL(b);
      window.open(url, '_blank');
    }, 'image/png');
  }

  remove(type: EnDeleteType) {

  }
}
