import { EventEmitter } from 'events';
import { Editor } from './core';
import { PreRender } from './prerender';
import {
  EnWriteType,
  IFontStyle,
  IDocNode,
  IStyleNode,
  IFontStyleNode,
  IParagraphNode
} from './types';

type ISyncSeg = IDocNode & { paragraph: number };

export interface ISyncer extends EventEmitter {
  send: (data: ISyncSeg[])=> void;
}

export class Collector extends Editor {
  private cache: ISyncSeg[] = [];
  private todoTimer = 0;
  private syncer?: ISyncer;
  private readonly prerender = new PreRender();
  private doc: IDocNode[] = [];
  private stylIndexer: IStyleNode[] = [];
  private scaleKeys = new Set([
    'fontSize',
    'firstTab',
    'tab',
    'marginTop',
    'marginBottom',
  ]);

  private handleRecv = ({ paragraph, ...payload }: ISyncSeg) => {
    this.doc[paragraph] = payload;
  };

  constructor(io: ISyncer) {
    super();
    this.doc[0] = this.stylIndexer[0] = {
      type: EnWriteType.PARAGRAPH_STYLE,
      fontFamily: '',
      fontSize: 16,
      fontWeight: 400,
      firstTab: 0,
      tab: 0,
      marginTop: 0,
      marginBottom: 0,
      lineMargin: 1
    };
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

  private translateStyle(s: IStyleNode): IStyleNode {
    const keys = this.scaleKeys;
    return Object.keys(s).reduce((p, k) => {
      const v = (s as any)[k];
       (p as any)[k] = keys.has(k) ? this.pt2dot(v) : v;
      return p;
    }, {
      __proto__: (s as any).__proto__
    }) as any;
  }

  private writeStyle(styl: Partial<IFontStyle>) {
    const last = this.doc[this.doc.length - 1];

    // 前序节点为样式节点
    if (EnWriteType.FONT_STYLE & last.type) {
      Object.assign(last, styl);
      return;
    }

    // 复制前一个样式节点
    const nextStylNode = {
      ...styl,
      __proto__: this.stylIndexer[this.stylIndexer.length - 1],
      type: EnWriteType.FONT_STYLE
    } as IFontStyleNode;

    this.doc.push(nextStylNode);
    this.stylIndexer.push(nextStylNode);
  }

  private writeText(txt: string) {
    const list = txt.split('\n');
    for (let idx = 0; idx < list.length; idx++) {
      let str = list[idx];
      let payload = null;
      let seg = this.doc.length;
      const lastNode = this.doc[seg - 1];

      // 插入一个文本节点
      if (str) {
        // 续写前序节点
        if (EnWriteType.TEXT === lastNode.type) {
          lastNode.txt += str;
          payload = { type: EnWriteType.TEXT, txt: lastNode.txt, paragraph: seg - 1 };
        } else {
          // 插入新文本节点
          this.doc.push({ type: EnWriteType.TEXT, txt: str, width: 0 });
          payload = { type: EnWriteType.TEXT, txt: str, paragraph: seg };
        }
      }

      // 插入段落
      if (idx < list.length - 1) {
        // 前序节点是样式节点: 改成段落节点
        if (EnWriteType.FONT_STYLE === lastNode.type) {
          (lastNode as any).type = EnWriteType.PARAGRAPH_STYLE;
          payload = { paragraph: seg - 1 };
        } else {
          const pNode: IParagraphNode = {
            __proto__: this.stylIndexer[this.stylIndexer.length - 1],
            type: EnWriteType.PARAGRAPH_STYLE
          } as any;
          this.doc.push(pNode);
          this.stylIndexer.push(pNode);
          payload = { paragraph: seg };
        }
      }

      if (!payload) return;
      Object.assign(payload, lastNode, { type: EnWriteType.PARAGRAPH_STYLE });
      this.cache.push(payload as ISyncSeg);
    }
  }

  write({ type, ...params }: { type: EnWriteType, [k: string]: any }) {
    if (EnWriteType.FONT_STYLE === type) {
      this.writeStyle(params);
      this.setCaretPoint();
    }

    if (EnWriteType.TEXT === type) {
      this.writeText(params.txt);
    }

    if (!this.doc || this.doc.length < 2) return;
    // doc使用单倍，article为加倍数据
    const articles = this.prerender.initArticle(
      this.doc.map(item => this.translateStyle(item as any)),
      this.usableSize.width
    );
    console.log('articles', { doc: this.doc, articles });
    this.drawParagraph(articles);

    if (this.todoTimer) return;
    this.todoTimer = window.setTimeout(() => {
      clearTimeout(this.todoTimer);
      this.todoTimer = 0;
      this.save();
    }, 300);
  }

  redraw() {}
}
