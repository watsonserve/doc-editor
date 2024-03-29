import { EventEmitter } from 'events';
import { Editor } from './core';
import {
  EnFontStyle,
  EnWriteType,
  ITextStyle,
  IDocNode,
  IStyleNode,
  ITextStyleNode,
  IParagraphNode,
  IParagraphStyle
} from './types';
import { partial, readJSONFile, Scaler } from './helper';

type ISyncSeg = IDocNode & { paragraph: number };
const { pt2dot } = Scaler.instance;

const scaleKeys = new Set([
  'fontSize',
  'firstTab',
  'tab',
  'marginTop',
  'marginBottom',
]);

const paragraphKeys = new Set([
  'lineMargin',
  'marginTop',
  'marginBottom',
]);

function translateStyle(s: IStyleNode) {
  Object.keys(s).forEach(k => {
    const v = (s as any)[k];
    (s as any)[k] = scaleKeys.has(k) ? pt2dot(v) : v;
  });
}

function cloneNodeLink(link: IDocNode[]) {
  let stylNode = null;
  const retLink = [];
  for (let i = 0; i < link.length; i++) {
    const item = { ...link[i] } as IStyleNode;
    retLink.push(item);
    if (!(EnWriteType.FONT_STYLE & item.type)) continue;

    translateStyle(item);
    (item as any).__proto__ = stylNode;
    stylNode = item;
  }
  return retLink;
}

export interface ISyncer extends EventEmitter {
  send: (data: ISyncSeg[])=> void;
}

export class Collector extends Editor {
  private cache: ISyncSeg[] = [];
  private todoTimer = 0;
  private syncer?: ISyncer;
  private doc: IDocNode[] = [];
  private stylIndexer: IStyleNode[] = [];

  private handleRecv = ({ paragraph, ...payload }: ISyncSeg) => {
    this.doc[paragraph] = payload;
  };

  constructor(io: ISyncer) {
    super();
    this.doc[0] = this.stylIndexer[0] = {
      type: EnWriteType.PARAGRAPH_STYLE,
      color: '#000',
      BIUS: EnFontStyle.NORMAL,
      superscript: 'no',
      letterSpacing: 0,
      fontFamily: '',
      fontSize: 16,
      backgroundColor: 'transparent',
      firstIndent: 0,
      indent: 0,
      marginTop: 0,
      marginBottom: 0,
      lineMargin: 1,
      textAlign: 'left',
      justify: false
    };
    this.syncLayout = io;
  }

  destroy() {
    this.syncer?.removeListener('recv', this.handleRecv);
    this._save();
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

  private _save() {
    const dataset = this.cache;
    if (!dataset.length) return;
    this.cache = [];
    this.syncer?.send && this.syncer.send(dataset);
  }

  private _setStyleNode(styl: Partial<ITextStyle>) {
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
    } as ITextStyleNode;

    this.doc.push(nextStylNode);
    this.stylIndexer.push(nextStylNode);
  }

  private _setparagraphNode(styl: Partial<IParagraphStyle>) {
    let i = this.stylIndexer.length - 1;
    for(; 0 < i && this.stylIndexer[i].type !== EnWriteType.PARAGRAPH_STYLE; i--);
    Object.assign(this.stylIndexer[i], styl);
  }

  private _writeStyle(styl: Partial<ITextStyle>) {
    console.log('_writeStyle', styl);
    const paragraphStyles = partial(styl, paragraphKeys) as Partial<IParagraphStyle>;

    if (Object.keys(paragraphStyles)) this._setparagraphNode(paragraphStyles);

    if (Object.keys(styl).length) this._setStyleNode(styl);
  }

  private _writeText(txt: string) {
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

  protected redraw() {
    // doc使用单倍，article为加倍数据
    const articles = this.prerender.initArticle(
      cloneNodeLink(this.doc),
      this.usableSize.width
    );
    console.log('articles', { doc: this.doc, articles });
    this.draw(articles);
  }

  write({ type, ...params }: { type: EnWriteType, [k: string]: any }) {
    if (EnWriteType.FONT_STYLE === type) {
      this._writeStyle(params);
    }

    if (EnWriteType.TEXT === type) {
      this._writeText(params.txt);
    }

    this.redraw();

    if (this.todoTimer) return;
    this.todoTimer = window.setTimeout(() => {
      clearTimeout(this.todoTimer);
      this.todoTimer = 0;
      this._save();
    }, 300);
  }

  async open() {
    try {
      const fileData = await readJSONFile();
      if (!Array.isArray(fileData)) throw(new Error('unknow data'));
      this.doc = [];
      fileData.forEach((item: any) => this.write(item));
    } catch(err: any) {
      alert(err.message);
    }
  }

  save() {
    const content = JSON.stringify(this.doc);
    const b = new Blob([content], { type: 'application/ostream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.type = 'application/json';
    a.download = 'a.json';
    a.click();
  }

  exportDOM() {
    const content = this.drawDom(this.doc);
    const b = new Blob([content], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.type = 'text/html';
    a.download = 'a.html';
    a.click();
  }
}
