class Collector {
    cache = [];
    todoTimer = 0;
    syncer;
    _onRecv;
    handleRecv = (...args) => {
        this._onRecv && this._onRecv(...args);
    };
    constructor(io) {
        this.syncLayout = io;
    }
    destroy() {
        this.syncer?.removeListener('recv', this.handleRecv);
        this.save();
        this._onRecv = undefined;
        this.syncer = undefined;
        clearTimeout(this.todoTimer);
        this.todoTimer = 0;
    }
    set syncLayout(syncer) {
        if (!syncer) {
            throw new Error(`sync layout can not be ${typeof syncer}`);
        }
        this.syncer?.removeListener('recv', this.handleRecv);
        this.syncer = syncer;
        this.syncer.addListener('recv', this.handleRecv);
    }
    set onRecv(fn) {
        this._onRecv = fn;
    }
    save() {
        const dataset = this.cache;
        this.cache = [];
        this.syncer?.send && this.syncer.send(dataset);
    }
    push(data) {
        this.cache.push(data);
        if (this.todoTimer)
            return;
        this.todoTimer = window.setTimeout(() => {
            clearTimeout(this.todoTimer);
            this.todoTimer = 0;
            this.save();
        }, 300);
    }
}

class Editor {
    elCanvas = document.createElement('canvas');
    _collector;
    ctx;
    _scale = window.devicePixelRatio;
    // 这里存储canvas使用的坐标，向外暴露的是单倍坐标值
    config = {
        fontSize: 32,
        family: 'serif',
        lineMargin: 1,
        color: '#333',
        bgColor: 'transparent'
    };
    _point = {
        x: 0,
        y: this.config.fontSize / 2 * 3 * (this.config.lineMargin - 1) / 2
    };
    _onCaretMove;
    constructor(sync) {
        this._collector = new Collector(sync);
        this._collector.onRecv = (payload) => this.draw({ ...payload, width: payload.width * this._scale });
        this.elCanvas.setAttribute('class', 'editor__canvas');
        const ctx = this.elCanvas.getContext('2d');
        if (!ctx)
            throw new Error('get canvas 2d context faild');
        this.ctx = ctx;
        this.elCanvas.addEventListener('resize', this.resize);
    }
    destroy() {
        console.warn('on editor destroy');
        this.elCanvas.removeEventListener('resize', this.resize);
        this._collector.destroy();
        document.removeChild(this.elCanvas);
    }
    set syncer(sync) {
        this._collector.syncLayout = sync;
    }
    get scale() {
        return this._scale;
    }
    set scale(s) {
        this._scale = s;
    }
    get fontSize() {
        return this.config.fontSize / this._scale;
    }
    set fontSize(s) {
        this.config.fontSize = s * this._scale;
        this._onCaretMove(this.point);
    }
    get lineMargin() {
        return this.config.lineMargin;
    }
    set lineMargin(h) {
        this.config.lineMargin = Math.max(1, h);
    }
    get bgColor() {
        return this.config.bgColor;
    }
    set bgColor(c) {
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
            height: this.config.fontSize / 2 * 3 / this._scale
        };
    }
    set point(p) {
        const halfLineHeight = this.config.fontSize / 4 * 3;
        const x = Math.min(this._point.x, p.x * this._scale);
        // 点击点应该是行的中间高度
        const y = Math.min(this._point.y, p.y * this._scale - halfLineHeight);
        this._point = { x, y };
        const timer = setTimeout(() => {
            clearTimeout(timer);
            this._onCaretMove(this.point);
        }, 0);
    }
    set onCaretMove(fn) {
        this._onCaretMove = fn;
    }
    draw({ txt, width, paragraph }) {
        const { ctx, _point } = this;
        if (!ctx)
            return;
        let x, y;
        const { fontSize = 32, lineMargin } = this.config;
        const lineHeight = fontSize / 2 * 3;
        const baseLine = _point.y + fontSize;
        // enter key
        if ('\n' === txt) {
            x = 0;
            y = _point.y + lineHeight * lineMargin;
        }
        else {
            ctx.fillStyle = this.config.bgColor;
            ctx.fillRect(_point.x, _point.y, width, lineHeight);
            ctx.fillStyle = this.config.color;
            ctx.fillText(txt, _point.x, baseLine, width);
            x = _point.x + width;
            y = _point.y;
        }
        this._point = { x, y };
        this._onCaretMove(this.point);
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
        if (!changed)
            return;
        this.ctx.font = `${config.fontSize}px ${config.family}`;
    }
    write(str) {
        const ctx = this.ctx;
        if (!ctx)
            return;
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

const style = `
  @keyframes flash {
    0% {
      opacity: 1;
    }
    20% {
      opacity: 1;
    }
    30% {
      opacity: 0;
    }
    70% {
      opacity: 0;
    }
    80% {
      opacity: 1;
    }
    100% {
      opacity: 1;
    }
  }
  
  .inputer {
    display: flex;
    height: 100%;
    flex-direction: column;
    justify-content: center;
  }

  .inputer .inputer__caret {
    width: 1px;
    height: 50%;
    animation: flash 1000ms linear infinite;
    background: #000;
  }

  .inputer .inputer__cache {
    width: 1px;
    height: 1px;
    transform: rotateX(90deg);
    font-size: 1px;
  }
`;
class CaretInputer {
    selfElement = document.createElement('div');
    // 输入缓存
    inputElement = document.createElement('div');
    // 是否开启输入法
    compositionRef = false;
    _onInput;
    constructor(className = '', fn) {
        this._onInput = fn;
        this.selfElement.setAttribute('class', `inputer ${className}`);
        const caret = document.createElement('div');
        caret.setAttribute('class', 'inputer__caret');
        this.inputElement.setAttribute('class', 'inputer__cache');
        this.inputElement.setAttribute('tabIndex', '0');
        this.inputElement.setAttribute('contenteditable', 'true');
        this.inputElement.setAttribute('suppresscontenteditablewarning', 'suppresscontenteditablewarning');
        this.inputElement.oninput = ev => this._handleInput(ev);
        this.inputElement.onkeydown = ev => this._handleKeyDown(ev);
        this.inputElement.addEventListener('compositionstart', (ev) => this._handleComposition(ev, true));
        this.inputElement.addEventListener('compositionend', (ev) => this._handleComposition(ev, false));
        this.selfElement.appendChild(caret);
        this.selfElement.appendChild(this.inputElement);
    }
    destroy() {
        this._onInput = undefined;
        this.inputElement.remove();
        this.selfElement.remove();
    }
    get element() {
        return this.selfElement;
    }
    set onInput(fn) {
        this._onInput = fn;
    }
    _follow(inputType, str) {
        switch (inputType) {
            case 'insertParagraph':
                str = '\n';
        }
        console.log(`inputType: ${inputType}, str: ${str}`);
        this._onInput(str);
        this.inputElement.innerHTML = '';
    }
    _handleInput(ev) {
        if (this.compositionRef)
            return;
        const { inputType, data } = ev;
        if ('insertCompositionText' === inputType)
            return;
        this._follow(inputType, data);
    }
    _handleComposition(ev, enter) {
        this.compositionRef = enter;
        if (enter)
            return;
        this._follow('insertText', ev.data);
    }
    _handleKeyDown(ev) {
        console.log(ev);
        switch (ev.keyCode) {
            case 8: // backspace
                this._follow('backspace', '');
                break;
        }
    }
    focus(p) {
        const styl = this.selfElement.style;
        styl.left = `${p.x || 0}px`;
        styl.top = `${p.y || 0}px`;
        styl.height = `${p.height || 16}px`;
        this.inputElement.focus();
    }
}

class EditorView extends HTMLElement {
    elWrapper = document.createElement('div');
    elInputer = new CaretInputer('editor__inputer');
    editorRef;
    elStyle = document.createElement('style');
    constructor(syncer) {
        super();
        this.editorRef = new Editor(syncer);
        this.elWrapper.setAttribute('class', 'editor');
        this.elWrapper.onclick = ev => this._handleClick(ev);
        this.elInputer.onInput = (str) => this.editorRef.write(str);
        this.editorRef.onCaretMove = (p) => this.elInputer.focus(p);
        this.editorRef.resize();
        this.editorRef.bgColor = '#f00';
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
        console.warn('on editor unmount');
        this.editorRef.destroy();
        this.elInputer.destroy();
        this.elStyle.remove();
        this.elWrapper.remove();
    }
    _setPageSize(width, height) {
        this.elWrapper.style.width = width;
        this.elWrapper.style.height = height;
        this.editorRef.resize();
    }
    _setLineHeight(margin = 1) {
        this.editorRef.lineMargin = margin;
    }
    _setFontSize(fontSize = 32) {
        this.editorRef.fontSize = fontSize;
    }
    _handleClick(ev) {
        const x = Math.max(ev.offsetX - 4, 0);
        const y = ev.offsetY;
        this.editorRef.point = { x, y };
    }
    ;
    change(attr, val) {
        switch (attr) {
            case 'pageSize':
                return this._setPageSize(val.width, val.height);
            case 'fontSize':
                return this._setFontSize(val);
            case 'lineHeight':
                return this._setLineHeight(val);
            default:
                console.warn(attr, val);
        }
    }
}
customElements.define('editor-view', EditorView);

export { Collector, Editor, EditorView as default };
