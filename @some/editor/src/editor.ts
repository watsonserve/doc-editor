import { CaretInputer, style } from './inputer';
import { IPoint } from './core';
import { ISyncer, Collector } from './collector';
import { EnWriteType } from './types';

export default class EditorView extends HTMLElement {
  private elWrapper = document.createElement('div');
  private elInputer = new CaretInputer('editor__inputer');
  private readonly editorRef: Collector;
  private readonly elStyle = document.createElement('style');

  constructor(syncer: ISyncer) {
    super();
    this.editorRef = new Collector(syncer);

    this.elWrapper.setAttribute('class', 'editor');
    this.elWrapper.onclick = ev => this._handleClick(ev);
    this.elInputer.onInput = (txt: string) => this.editorRef.write({ type: EnWriteType.TEXT, txt });
    this.editorRef.onCaretMove = (p: IPoint) => this.elInputer.focus(p);

    this.editorRef.resize();

    const shadow = this.attachShadow({ mode: 'closed' });
    this.elWrapper.appendChild(this.elInputer.element);
    this.elWrapper.appendChild(this.editorRef.canvas);
    shadow.appendChild(this.elStyle);
    shadow.appendChild(this.elWrapper);
    this.elStyle.innerHTML = `
      ${style}

      .editor {
        display: flex;
        position: relative;
        outline: 0;
        box-sizing: border-box;
        margin: 0 auto;
        height: 100%;
        justify-content: center;
        align-items: center;
        overflow: auto;
        text-align: left;
        background: #fff;
        cursor: text;
      }

      .editor canvas.editor__canvas {
        width: 100%;
        height: 100%;
      }

      .editor .editor__inputer {
        position: absolute;
        top: 0;
        left: 0;
      }
    `;
  }

  destroy() {
    this.editorRef.destroy();
    this.elInputer.destroy();
    this.elStyle.remove();
    this.elWrapper.remove();
  }

  private _setPageSize(width: string, height: string) {
    this.elWrapper.style.width = width;
    this.elWrapper.style.height = height;
    this.editorRef.resize();
  }

  private _handleClick(ev: MouseEvent) {
    const x = Math.max(ev.offsetX - 4, 0);
    const y = ev.offsetY;
    this.editorRef.point = { x, y };
  };

  private _setPagePadding(padding: any) {
    this.editorRef.pagePadding = padding;
  }

  change(attr: string, val: any) {
    switch (attr) {
      case 'pageSize':
        return this._setPageSize(val.width, val.height);
      case 'fontFamily':
      case 'fontSize':
      case 'lineMargin':
      case 'BIUS':
        // return this._setFontFamily(val);
        // return this._setFontSize(val);
        // return this._setLineMargin(val);
        return this.editorRef.write({ type: EnWriteType.FONT_STYLE, [attr]: val });
      case 'pagePadding':
        return this._setPagePadding(val);
      default:
        console.warn(attr, val);
    }
  }
}

customElements.define('editor-view', EditorView);
