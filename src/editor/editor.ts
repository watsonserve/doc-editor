import { Collector, ISyncer } from './collector';

export interface IPoint {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface IChange {
  txt: string;
  paragraph: number;
  width: number;
};

export class Editor {
  private readonly elCanvas = document.createElement('canvas');
  private _collector: Collector<any>;
  private ctx: CanvasRenderingContext2D;
  private _scale = window.devicePixelRatio;
  // 这里存储canvas使用的坐标，向外暴露的是单倍坐标值
  private config = {
    fontSize: 32,
    family: 'serif',
    lineHeight: 48,
    color: '#333',
    bgColor: 'transparent'
  };
  private _point = { x: 0, y: 0 };
  private _onCaretMove?: (p: IPoint) => void;

  constructor(sync: ISyncer) {
    this._collector = new Collector(sync);
    this._collector.onRecv = (payload: IChange) => this.draw({ ...payload, width: payload.width * this._scale });
    this.elCanvas.setAttribute('class', 'editor__canvas');
    const ctx = this.elCanvas.getContext('2d');
    if (!ctx) throw new Error('get canvas 2d context faild');
    this.ctx = ctx;

    this.elCanvas.addEventListener('resize', this.resize);
  }

  destroy() {
    console.warn('on editor destroy');
    this.elCanvas.removeEventListener('resize', this.resize);
    this._collector.destroy();
    document.removeChild(this.elCanvas);
  }

  set syncer(sync: ISyncer) {
    this._collector.syncLayout = sync;
  }

  get scale() {
    return this._scale;
  }

  set scale(s: number) {
    this._scale = s;
  }

  get fontSize() {
    return this.config.fontSize / this._scale;
  }

  set fontSize(s: number) {
    this.config.fontSize = s * this._scale;
  }

  get lineHeight() {
    return this.config.lineHeight / this._scale;
  }

  set lineHeight(h: number) {
    this.config.lineHeight = h * this._scale;
  }

  get bgColor() {
    return this.config.bgColor;
  }

  set bgColor(c: string) {
    this.config.bgColor = c;
  }

  get canvas() {
    return this.elCanvas;
  }

  get point() {
    const { x, y } = this._point;

    return {
      x: x / this._scale,
      y: y / this._scale,
      height: this.config.lineHeight / this._scale
    };
  }

  set point(p: IPoint) {
    // 点击点应该是行的中间高度
    const y = Math.min(this._point.y, p.y * this._scale - (this.config.lineHeight >> 1));
    this._point = { x: p.x * this._scale, y };
    const timer = setTimeout(() => {
      clearTimeout(timer);
      this._onCaretMove && this._onCaretMove(this.point);
    }, 0);
  }

  set onCaretMove(fn: (p: IPoint) => void) {
    this._onCaretMove = fn;
  }

  private draw({ txt, width, paragraph }: any) {
    const { ctx, _point } = this;
    if (!ctx) return;
    let x, y: number;

    const { fontSize = 32, lineHeight } = this.config;
    // baseLine = lineHeight * 2 / 3
    const baseLine = _point.y + ((lineHeight << 1) / 3);
    // enter key
    if ('\n' === txt) {
      x = 0;
      y = lineHeight;
    } else {
      ctx.fillStyle = this.config.bgColor;
      ctx.fillRect(_point.x, _point.y, width, lineHeight);
      ctx.fillStyle = this.config.color;
      ctx.fillText(txt, _point.x, baseLine, width);
      x = _point.x + width;
      y = _point.y;
    }
    this._point = { x, y };
    this._onCaretMove && this._onCaretMove(this.point);
  }
  
  resize() {
    let changed = false;
    const { elCanvas, config } = this;

    if ((elCanvas?.clientWidth || 0) * this._scale !== elCanvas.width) {
      elCanvas.width = (elCanvas?.clientWidth || 0) * this._scale;
      changed = true;
    }
    if ((elCanvas?.clientHeight || 0) * this._scale !== elCanvas.height) {
      elCanvas.height = (elCanvas?.clientHeight || 0) * this._scale;
      changed = true;
    }
    if (!changed) return;
    this.ctx.font = `${config.fontSize}px ${config.family}`;
  }

  write(str: string) {
    const ctx = this.ctx;
    if (!ctx) return;
    const list = str.split('\n');
    list.forEach((txt, idx) => {
      if (txt) {
        const payload = { txt, width: ctx.measureText(txt).width, paragraph: 0 };
        this.draw(payload);
        this._collector.push({ ...payload, width: payload.width / this._scale });
      }
      if (idx < list.length - 1) {
        const payload = { txt: '\n', width: 0, paragraph: 0 };
        this.draw(payload);
        this._collector.push(payload);
      }
    });
  }
}
