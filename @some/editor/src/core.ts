import { getPPI, getLineHeight, getLineMarginHalf, getBaseline, getLineMiddle, getFont } from './helper';
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

/**
 * unit: dot
 */
export abstract class Editor {
  private readonly elCanvas = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D;
  private dpi = 300;
  private ppi = getPPI();
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
  private _pagePadding: IBlockSize = { top: 20, right: 20, bottom: 20, left: 20 };
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

  px2dot(px: number) {
    return px * this.dpi / this.ppi;
  }

  dot2px(dot: number) {
    return dot * this.ppi /this.dpi;
  }

  pt2dot(dot: number) {
    return dot * this.dpi / 72;
  }

  dot2pt(dot: number) {
    return dot * 72 / this.dpi;
  }

  get fontSize() {
    return this.dot2pt(this.config.fontSize);
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
      x: this.dot2pt(x),
      y: this.dot2pt(y),
      height: this.dot2pt(this.config.fontSize / 2 * 3)
    };
  }

  get pagePadding() {
    const { top, right, bottom, left } = this._pagePadding;
    return {
      top: this.dot2pt(top),
      right: this.dot2pt(right),
      bottom: this.dot2pt(bottom),
      left: this.dot2pt(left),
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

  protected set fontFamily(fontFamily: string) {
    this.config.fontFamily = fontFamily;
  }

  protected set fontSize(s: number) {
    this.config.fontSize = this.pt2dot(s);
    this.setCaretPoint();
  }

  protected set lineMargin(h: number) {
    this.config.lineMargin = Math.max(1, h);
    this.setCaretPoint();
  }

  set pagePadding(padding: IBlockSize) {
    const { top, right, bottom, left } = padding;
    this._pagePadding = {
      top: this.pt2dot(top),
      right: this.pt2dot(right),
      bottom: this.pt2dot(bottom),
      left: this.pt2dot(left),
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
    const x = Math.max(paddingLeft, Math.min(pageWidth - paddingRight, this.px2dot(p.x)));
    // 点击点应该是行的中间高度
    const y = Math.max(paddingTop, Math.min(this._point.y, this.px2dot(p.y) - halfLineHeight));
    this._point = { x, y };
    const timer = setTimeout(() => {
      clearTimeout(timer);
      this.setCaretPoint();
    }, 0);
  }

  protected setCaretPoint() {
    const { fontSize, lineMargin } = this.config;
    const lineHeight = getLineHeight(fontSize);
    const p = {
      x: this.dot2px(this._point.x),
      y: this.dot2px(this._point.y + getLineMarginHalf(lineHeight, lineMargin)),
      height: this.dot2px(lineHeight)
    };
    console.log('_onCaretMove', p);
    this._onCaretMove!(p);
  }

  set onCaretMove(fn: (p: IPoint) => void) {
    this._onCaretMove = fn;
  }

  protected drawParagraph(lines: IRow[]) {
    const { width: pageWidth, height: pageHeight } = this.elCanvas;
    const pagePaddingLeft = this._pagePadding.left;
    let x = pagePaddingLeft;
    let y = this._pagePadding.top;
    let paragraphMarginBottom = 0;
    let lineAllHeight = 0;
    this.ctx.clearRect(0, 0, pageWidth, pageHeight);

    this.ctx.fillStyle = '#ccc';
    this.ctx.fillRect(x, y, this.usableSize.width, this.usableSize.height);
    this.ctx.fillStyle = '#333';

    for (const li of lines) {
      const { segments, tab, baseHeight } = li;
      const stylSeg = segments[0] as IParagraphNode;

      // 首节点是段落节点，增加段顶距，设置段底距
      if (EnWriteType.PARAGRAPH_STYLE === stylSeg.type) {
        y += paragraphMarginBottom + stylSeg.marginTop;
        paragraphMarginBottom = stylSeg.marginBottom;
      }
      y += lineAllHeight;

      const [baseline, baseBottom] = getBaseline(baseHeight, stylSeg.lineMargin);
      const _base = y + baseline;
      // console.log({ baseline, baseBottom, _base, y });
      lineAllHeight = baseline + baseBottom;
      x = pagePaddingLeft + tab;
      const width = this.usableSize.width - tab;

      for (let item of segments) {
        if (EnWriteType.FONT_STYLE & item.type) {
          const { fontWeight, fontFamily } = item as IFontStyleNode;
          const fontSize = (item as IFontStyleNode).fontSize;
          const font = getFont('normal', fontWeight, fontSize, fontFamily);
          if (font.match(/undefined|NaN| $/)) console.warn('getFont', font);
          this.ctx.font = font;
          Object.assign(this.config, { fontFamily, fontSize, fontWeight, lineMargin: stylSeg.lineMargin });
        } else {
          const { txt, width: segWdith } = item as ITxtNode;
          this.ctx.fillText(txt, x, _base, width);
          x += segWdith;
        }
      }
    }
    this._point = { x, y };
    console.log('this._point', this._point);
    this.setCaretPoint();
  }
  
  resize() {
    let changed = false;
    const { elCanvas } = this;

    const dotWidth = this.px2dot(elCanvas?.clientWidth || 0);
    const dotHeight = this.px2dot(elCanvas?.clientHeight || 0);

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
