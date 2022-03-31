import { EventEmitter } from 'events';
import { Editor } from './core';
import { PreRender } from './prerender';
import { EnWriteType, IFontStyle, IDocNode } from './types';

export interface ISyncer extends EventEmitter {
  send: (data: any[])=> void;
}

export class Collector<T = {}> extends Editor {
  private cache: T[] = [];
  private todoTimer = 0;
  private syncer?: ISyncer;
  private readonly prerender = new PreRender();
  private doc: IDocNode[] = [];

  private handleRecv = (args: any) => this.draw(args);

  constructor(io: ISyncer) {
    super();
    this.syncLayout = io;
  }

  destroy() {
    this.syncer?.removeListener('recv', this.handleRecv);
    this.save();
    this.syncer = undefined;
    clearTimeout(this.todoTimer);
    this.todoTimer = 0;
    super.destroy();
  }

  set syncLayout(syncer: ISyncer) {
    if (!syncer) {
      throw new Error(`sync layout can not be ${typeof syncer}`);
    }
    this.syncer?.removeListener('recv', this.handleRecv);
    this.syncer = syncer;
    this.syncer.addListener('recv', this.handleRecv);
  }

  private save() {
    const dataset = this.cache;
    if (!dataset.length) return;
    this.cache = [];
    this.syncer?.send && this.syncer.send(dataset);
  }

  private writeStyle(styl: Partial<IFontStyle>) {
    const fontStyleDict = new Set<keyof IFontStyle>(['fontSize', 'fontFamily', 'lineMargin']);

    (<(keyof IFontStyle)[]>Object.keys(styl)).forEach((k) => {
      const v = styl[k];
      if (!fontStyleDict.has(k) || undefined === v) return;
      (super[k] as any) = v;
    });

    const last = this.doc[this.doc.length - 1];
    if (EnWriteType.FONT_STYLE === last.type) {
      this.doc[this.doc.length - 1] = { ...last, ...styl };
    } else {
      this.doc.push({ type: EnWriteType.FONT_STYLE, ...styl });
    }
  }

  private writeText(txt: string) {
    const list = txt.split('\n');
    for (let idx = 0; idx < list.length; idx++) {
      let str = list[idx];
      let payload = null;

      if (str) {
        payload = { txt: str, paragraph: 0 };
        this.doc.push({ type: EnWriteType.TEXT, txt: str });
      }

      if (idx < list.length - 1) {
        payload = { txt: '\n', paragraph: 0 };
        this.doc.push({ type: EnWriteType.PARAGRAPH_STYLE, txt: '\n' });
      }

      if (payload) {
        this.draw(payload);
        this.cache.push(payload as any);
      }
    }
  }

  write({ type, ...params }: { type: EnWriteType, [k: string]: any }) {
    if (EnWriteType.FONT_STYLE === type) {
      this.writeStyle(params);
    }

    if (EnWriteType.TEXT === type) {
      this.writeText(params.txt);
    }

    this.prerender.getLine(this.doc, this.usableSize.width, this.scale);
    if (this.todoTimer) return;

    this.todoTimer = window.setTimeout(() => {
      clearTimeout(this.todoTimer);
      this.todoTimer = 0;
      this.save();
    }, 300);
  }

  redraw() {}
}
