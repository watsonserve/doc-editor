/// <reference types="node" />
import { EventEmitter } from 'events';
export interface ISyncer extends EventEmitter {
    send: (data: any[]) => void;
}
export declare class Collector<T extends Object> {
    private cache;
    private todoTimer;
    private syncer?;
    private _onRecv?;
    private handleRecv;
    constructor(io: ISyncer);
    destroy(): void;
    set syncLayout(syncer: ISyncer);
    set onRecv(fn: (...args: any[]) => void);
    private save;
    push(data: T): void;
}
