import { IPoint } from './core';
import { EnDeleteType } from './types';

export interface IInputerCtrl {
  get element(): HTMLDivElement;
  set onInput(fn: (str: string) => void);
  focus: (p: IPoint) => void;
}

export const style = `
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

export class CaretInputer implements IInputerCtrl {
  private readonly selfElement = document.createElement('div');
  // 输入缓存
  private readonly inputElement = document.createElement('div');
  // 是否开启输入法
  private compositionRef = false;
  private _onInput?: (str: string) => void;
  private _onDelete?: (type: EnDeleteType) => void;

  constructor(className = '', fn?: (str: string) => void) {
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
    this.inputElement.addEventListener('compositionstart', (ev: any) => this._handleComposition(ev, true));
    this.inputElement.addEventListener('compositionend', (ev: any) => this._handleComposition(ev, false));

    this.selfElement.appendChild(caret);
    this.selfElement.appendChild(this.inputElement);
  }

  destroy() {
    this._onInput = undefined;
    this.inputElement.remove();
    this.selfElement.remove();
  }

  public get element() {
    return this.selfElement;
  }

  public set onInput(fn: (str: string) => void) {
    this._onInput = fn;
  }

  public set onDelete(fn: (type: EnDeleteType) => void) {
    this._onDelete = fn;
  }

  private _follow(inputType: string, str: string) {
    switch (inputType) {
      case 'insertParagraph':
        str = '\n';
        break;
      case 'backspace':
        this._onDelete!(EnDeleteType.BACK);
        return;
    }
    // console.log(`inputType: ${inputType}, str: ${str}`);
    this._onInput!(str);
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
    // console.log(ev);
    switch (ev.keyCode) {
      case 8: // backspace
        this._follow('backspace', '');
        break;
      default:
    }
  }

  public focus(p: IPoint) {
    const styl = this.selfElement.style;
    styl.left = `${p.x || 0}px`;
    styl.top = `${p.y || 0}px`;
    styl.height = `${p.height || 16}px`;
    this.inputElement.focus();
  }
}
