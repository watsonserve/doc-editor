import { IPoint } from './core';

export interface IInputerCtrl {
  focusPoint: (p: IPoint) => void;
}

export default class CaretInputer extends HTMLElement {
  private readonly selfElement = document.createElement('div');
  // 输入缓存
  private readonly inputElement = document.createElement('div');
  private readonly elStyle = document.createElement('style');
  // 是否开启输入法
  private compositionRef = false;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'closed' });
    this.selfElement.setAttribute('class', 'inputer');
    const caret = document.createElement('div');
    caret.setAttribute('class', 'inputer__caret');
    this.inputElement.setAttribute('class', 'inputer__cache');
    this.inputElement.setAttribute('tabIndex', '0');
    this.inputElement.setAttribute('contenteditable', 'true');
    this.inputElement.setAttribute('suppresscontenteditablewarning', 'suppresscontenteditablewarning');
    this.inputElement.oninput = ev => this._handleInput(ev);
    this.inputElement.onkeydown = ev => this._handleKeyDown(ev);
    (this.inputElement as any).oncompositionstart = (ev: any) => this._handleComposition(ev, true);
    (this.inputElement as any).oncompositionend = (ev: any) => this._handleComposition(ev, false);

    this.selfElement.appendChild(caret);
    this.selfElement.appendChild(this.inputElement);
    shadow.appendChild(this.elStyle);
    shadow.appendChild(this.selfElement);
    this.elStyle.innerHTML = `
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
  }

  private _follow(inputType: string, str: string) {
    switch (inputType) {
      case 'insertParagraph':
        str = '\n';
    }
    console.log(`inputType: ${inputType}, str: ${str}`);
    this.dispatchEvent(new InputEvent('InputEvent', { data: str }));
    this.inputElement.innerHTML = '';
  }

  private _handleInput(ev: any) {
    if (this.compositionRef) return;
    const { inputType, data } = ev;
    if ('insertCompositionText' === inputType) return;
    this._follow(inputType, data);
  }

  private _handleComposition(ev: any, enter: boolean) {
    this.compositionRef = enter;
    if (enter) return;
    this._follow('insertText', ev.data);
  }

  private _handleKeyDown(ev: any) {
    console.log(ev);
    switch (ev.keyCode) {
      case 8: // backspace
        this._follow('backspace', '');
        break;
      default:
    }
  }

  public focus() {
    this.inputElement.focus();
  }
}

customElements.define('caret-inputer', CaretInputer);
