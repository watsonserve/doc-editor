import { EventEmitter } from 'events';
import { Editor } from './core';
import { PreRender, getFontStyleNode, getParagraphNode } from './prerender';
import { EnWriteType, IFontStyle, IDocNode, IFontStyleNode, IParagraphDesc } from './types';

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

  private handleRecv = ({ paragraph, ...payload }: ISyncSeg) => {
    this.doc[paragraph] = payload;
  };

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
    const last = this.doc[this.doc.length - 1];

    // 前序节点为字符样式节点
    if (EnWriteType.FONT_STYLE & last.type) {
      this.doc[this.doc.length - 1] = { ...last, ...styl };
      return;
    }
    // 复制前一个样式节点
    const baseStyl = getFontStyleNode(this.doc) || {};
    this.doc.push({ ...baseStyl, ...styl } as IFontStyleNode);
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
          this.doc.push({ type: EnWriteType.TEXT, txt: str });
          payload = { type: EnWriteType.TEXT, txt: str, paragraph: seg };
        }
      }

      // 插入段落
      if (idx < list.length - 1) {
        const pNode = getParagraphNode(this.doc);
        if (!pNode) return;
        // 前序节点是样式节点: 改成段落节点
        if (EnWriteType.FONT_STYLE === lastNode.type) {
          Object.assign(lastNode, pNode);
          payload = { ...pNode, paragraph: seg - 1 };
        } else {
          this.doc.push(pNode);
          payload = { ...pNode, paragraph: seg };
        }
      }

      if (!payload) return;
      this.cache.push(payload as ISyncSeg);
    }
  }

  write({ type, ...params }: { type: EnWriteType, [k: string]: any }) {
    if (EnWriteType.FONT_STYLE === type) {
      this.writeStyle(params);
    }

    if (EnWriteType.TEXT === type) {
      this.writeText(params.txt);
    }

    const articles = this.prerender.getParagraph(this.doc, this.usableSize.width, this.scale);
    if (this.todoTimer || !articles) return;
    this.drawParagraph(articles);

    this.todoTimer = window.setTimeout(() => {
      clearTimeout(this.todoTimer);
      this.todoTimer = 0;
      this.save();
    }, 300);
  }

  redraw() {}
}
