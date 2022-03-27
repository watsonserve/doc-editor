import { EventEmitter } from 'events';

export interface ISyncer extends EventEmitter {
  send: (data: any[])=> void;
}

export class Collector<T extends Object> {
  private cache: T[] = [];
  private todoTimer = 0;
  private syncer?: ISyncer;
  private _onRecv?: (...args: any[]) => void;

  private handleRecv = (...args: any[]) => {
    this._onRecv && this._onRecv(...args);
  };

  constructor(io: ISyncer) {
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

  set syncLayout(syncer: ISyncer) {
    if (!syncer) {
      throw new Error(`sync layout can not be ${typeof syncer}`);
    }
    this.syncer?.removeListener('recv', this.handleRecv);
    this.syncer = syncer;
    this.syncer.addListener('recv', this.handleRecv);
  }

  set onRecv(fn: (...args: any[]) => void) {
    this._onRecv = fn;
  }

  private save() {
    const dataset = this.cache;
    this.cache = [];
    this.syncer?.send && this.syncer.send(dataset);
  }

  push(data: T) {
    this.cache.push(data);

    if (this.todoTimer) return;

    this.todoTimer = window.setTimeout(() => {
      clearTimeout(this.todoTimer);
      this.todoTimer = 0;
      this.save();
    }, 300);
  }
}
