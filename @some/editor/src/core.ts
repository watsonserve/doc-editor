import { Scaler, getLineHeight, getLineMarginHalf, getBaseline, getFont } from './helper';
import { EnWriteType, IBlockSize, ITextStyleNode, IParagraphNode, IRow, ITxtNode } from './types';
import { PreRender } from './prerender';

export interface IPoint {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

const { dot2pt, pt2dot, px2dot, dot2px } = Scaler.instance;

/**
 * unit: dot
 */
export abstract class Editor {
  private readonly elCanvas = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D;
  private _pagePadding: IBlockSize = { top: 20, right: 20, bottom: 20, left: 20 };
  private _onCaretMove?: (p: IPoint) => void;
  private article: IRow[] = [];
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
    const { top, right, bottom, left } = padding;

    this._pagePadding = {
      top: pt2dot(top),
      right: pt2dot(right),
      bottom: pt2dot(bottom),
      left: pt2dot(left),
    };
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
    // 文档描述数据
    const article = this.article;
    // 转换单位
    let x = px2dot(p.x);
    let y = px2dot(p.y);

    // 点击可用空间之外
    if (x < paddingLeft || pageWidth - paddingRight < x || y < paddingTop || pageHeight - paddingBottom < y) return;

    let offsetTop = paddingTop;
    // 行号
    let rowNo = 0;

    // 寻找所在行
    for (; rowNo < article.length - 1; rowNo++) {
      const row = article[rowNo];
      const lineMargin = (row.segments[0] as IParagraphNode).lineMargin;
      const rowHeight = getLineHeight(row.baseHeight) * lineMargin;
      const nxtOffsetTop = offsetTop + rowHeight;
      if (y < nxtOffsetTop) break;
      offsetTop = nxtOffsetTop;
    }

    const row = article[rowNo];
    const lineMargin = (row.segments[0] as IParagraphNode).lineMargin;
    
    // 矫正x坐标
    // this.prerender.getLine(row.segments, x);

    // 设定光标
    const timer = setTimeout(() => {
      clearTimeout(timer);
      this.setCaretPoint(x, offsetTop, row.baseHeight, lineMargin);
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
    const { segments, tab, baseHeight } = row;
    const stylSeg = segments[0] as IParagraphNode;

    const [baseline, baseBottom] = getBaseline(baseHeight, stylSeg.lineMargin);
    const _base = y + baseline;
    x += tab;
    const width = this.usableSize.width - tab;

    for (let item of segments) {
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
   * 初始化绘制一页
   */
  private drawArticle() {
    const lines = this.article;
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

    for (const row of lines) {
      const stylSeg = row.segments[0];
      // 首节点是段落节点，增加段顶距，设置段底距
      if (stylSeg.type === EnWriteType.PARAGRAPH_STYLE) {
        y += paragraphMarginBottom + stylSeg.marginTop;
        paragraphMarginBottom = stylSeg.marginBottom;
      }
      y += lineAllHeight;
      [x, lineAllHeight] = this.drawRow(row, pagePaddingLeft, y);
    }

    const { baseHeight, segments } = lines[lines.length - 1];
    this.setCaretPoint(x, y, baseHeight, (segments[0] as IParagraphNode).lineMargin);
  }

  protected draw(lines: IRow[]) {
    this.article = lines;
    this.drawArticle();
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
}
