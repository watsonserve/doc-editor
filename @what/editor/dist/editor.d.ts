import { ISyncer } from './collector';
export default class EditorView extends HTMLElement {
    private elWrapper;
    private elInputer;
    private readonly editorRef;
    private readonly elStyle;
    constructor(syncer: ISyncer);
    destroy(): void;
    private _setPageSize;
    private _setLineHeight;
    private _setFontSize;
    private _handleClick;
    change(attr: string, val: any): void;
}
