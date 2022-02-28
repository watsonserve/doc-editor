import { ISyncer } from './collector';
export interface IPoint {
    x: number;
    y: number;
    width?: number;
    height?: number;
}
export declare class Editor {
    private readonly elCanvas;
    private _collector;
    private ctx;
    private _scale;
    private config;
    private _point;
    private _onCaretMove?;
    constructor(sync: ISyncer);
    destroy(): void;
    set syncer(sync: ISyncer);
    get scale(): number;
    set scale(s: number);
    get fontSize(): number;
    set fontSize(s: number);
    get lineMargin(): number;
    set lineMargin(h: number);
    get bgColor(): string;
    set bgColor(c: string);
    get canvas(): HTMLCanvasElement;
    get point(): IPoint;
    set point(p: IPoint);
    set onCaretMove(fn: (p: IPoint) => void);
    private draw;
    resize(): void;
    write(str: string): void;
}
