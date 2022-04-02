import { getLineHeight, getLineMarginHalf, getBaseline, getLineMiddle, getFont } from './helper';
import { EnWriteType, IBlockSize, IFontStyleNode, IParagraphNode, IRow, ITxtNode } from './types';

export interface IPoint {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface IChange {
  txt: string;
  paragraph: number;
};

export abstract class Editor {
  private readonly elCanvas = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D;
  private _scale = window.devicePixelRatio;
  // 这里存储canvas使用的坐标，向外暴露的是单倍坐标值
  private config = {
    fontSize: 32,
    fontFamily: 'serif',
    fontWeight: 400,
    fontStyle: 0,
    lineMargin: 1,
    color: '#333',
    bgColor: 'transparent'
  };
  private _point = {
    x: 0,
    y: 0
  };
  private _pagePadding: IBlockSize = { top: 0, right: 0, bottom: 0, left: 0 };
  private _onCaretMove?: (p: IPoint) => void;
  abstract redraw(): void;

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

  get scale() {
    return this._scale;
  }

  get fontSize() {
    return this.config.fontSize / this._scale;
  }

  get lineMargin() {
    return this.config.lineMargin;
  }

  get bgColor() {
    return this.config.bgColor;
  }

  get canvas() {
    return this.elCanvas;
  }

  get point() {
    const { x, y } = this._point;

    return {
      x: x / this._scale,
      y: y / this._scale,
      height: this.config.fontSize / 2 * 3 / this._scale
    };
  }

  get pagePadding() {
    const { top, right, bottom, left } = this._pagePadding;
    return {
      top: top / this._scale,
      right: right / this._scale,
      bottom: bottom / this._scale,
      left: left / this._scale
    };
  }

  get usableSize() {
    const { width, height } = this.elCanvas;
    const { top, right, bottom, left } = this._pagePadding;

    return {
      width: width - left - right,
      height: height - top - bottom
    };
  }

  set scale(s: number) {
    this._scale = s;
  }

  protected set fontFamily(fontFamily: string) {
    this.config.fontFamily = fontFamily;
  }

  protected set fontSize(s: number) {
    this.config.fontSize = s * this._scale;
    this.setCaretPoint();
  }

  protected set lineMargin(h: number) {
    this.config.lineMargin = Math.max(1, h);
    this.setCaretPoint();
  }

  set pagePadding(padding: IBlockSize) {
    const { top, right, bottom, left } = padding;
    this._pagePadding = {
      top: top * this._scale,
      right: right * this._scale,
      bottom: bottom * this._scale,
      left: left * this._scale
    };
    this.redraw();
  }

  protected set bgColor(c: string) {
    this.config.bgColor = c;
  }

  set point(p: IPoint) {
    const { width: pageWidth } = this.elCanvas;
    const { top: paddingTop, right: paddingRight, left: paddingLeft } = this._pagePadding;
    const halfLineHeight = getLineMiddle(getLineHeight(this.config.fontSize), this.config.lineMargin);
    const x = Math.max(paddingLeft, Math.min(pageWidth - paddingRight, p.x * this._scale));
    // 点击点应该是行的中间高度
    const y = Math.max(paddingTop, Math.min(this._point.y, p.y * this._scale - halfLineHeight));
    this._point = { x, y };
    const timer = setTimeout(() => {
      clearTimeout(timer);
      this.setCaretPoint();
    }, 0);
  }

  protected setCaretPoint() {
    const { fontSize, lineMargin } = this.config;
    const lineHeight = getLineHeight(fontSize);
    this._onCaretMove!({
      x: this._point.x / this._scale,
      y: (this._point.y + getLineMarginHalf(lineHeight, lineMargin)) / this._scale,
      height: lineHeight / this._scale
    });
  }

  set onCaretMove(fn: (p: IPoint) => void) {
    this._onCaretMove = fn;
  }

  protected drawParagraph(lines: IRow[]) {
    let y = this._pagePadding.top;
    let paragraphMarginBottom = 0;
    const pagePaddingLeft = this._pagePadding.left;

    for (const li of lines) {
      const { segments, tab, baseHeight } = li;
      const stylSeg = segments[0] as IParagraphNode;

      // 首节点是段落节点，增加段顶距，设置段底距
      if (EnWriteType.PARAGRAPH_STYLE === stylSeg.type) {
        y += paragraphMarginBottom + stylSeg.marginTop;
        paragraphMarginBottom = stylSeg.marginBottom;
      }

      const [baseline, baseBottom] = getBaseline(baseHeight, stylSeg.lineMargin);
      // 行顶距 + 最大字号 -> baseline
      y += baseline;
      const x = pagePaddingLeft + tab;
      const width = this.usableSize.width - tab;

      for (let item of segments) {
        if (EnWriteType.FONT_STYLE & item.type) {
          const { fontWeight, fontSize, fontFamily } = item as IFontStyleNode;
          this.ctx.font = getFont('normal', fontWeight, fontSize, fontFamily);
        } else {
          this.ctx.fillText((item as ITxtNode).txt, x, y, width);
        }
      }

      y += baseBottom
    }
    this._point = { x: pagePaddingLeft, y };
    this.setCaretPoint();
  }
  
  resize() {
    let changed = false;
    const { elCanvas } = this;

    if ((elCanvas?.clientWidth || 0) * this._scale !== elCanvas.width) {
      elCanvas.width = (elCanvas?.clientWidth || 0) * this._scale;
      changed = true;
    }
    if ((elCanvas?.clientHeight || 0) * this._scale !== elCanvas.height) {
      elCanvas.height = (elCanvas?.clientHeight || 0) * this._scale;
      changed = true;
    }
    if (!changed) return;
    this.redraw();
  }
}
