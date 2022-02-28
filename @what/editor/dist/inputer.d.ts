import { IPoint } from './core';
export interface IInputerCtrl {
    get element(): HTMLDivElement;
    set onInput(fn: (str: string) => void);
    focus: (p: IPoint) => void;
}
export declare const style = "\n  @keyframes flash {\n    0% {\n      opacity: 1;\n    }\n    20% {\n      opacity: 1;\n    }\n    30% {\n      opacity: 0;\n    }\n    70% {\n      opacity: 0;\n    }\n    80% {\n      opacity: 1;\n    }\n    100% {\n      opacity: 1;\n    }\n  }\n  \n  .inputer {\n    display: flex;\n    height: 100%;\n    flex-direction: column;\n    justify-content: center;\n  }\n\n  .inputer .inputer__caret {\n    width: 1px;\n    height: 50%;\n    animation: flash 1000ms linear infinite;\n    background: #000;\n  }\n\n  .inputer .inputer__cache {\n    width: 1px;\n    height: 1px;\n    transform: rotateX(90deg);\n    font-size: 1px;\n  }\n";
export declare class CaretInputer implements IInputerCtrl {
    private readonly selfElement;
    private readonly inputElement;
    private compositionRef;
    private _onInput?;
    constructor(className?: string, fn?: (str: string) => void);
    destroy(): void;
    get element(): HTMLDivElement;
    set onInput(fn: (str: string) => void);
    private _follow;
    private _handleInput;
    private _handleComposition;
    private _handleKeyDown;
    focus(p: IPoint): void;
}
