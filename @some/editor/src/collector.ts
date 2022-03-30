import { EventEmitter } from 'events';
import { Editor } from './core';

export interface ISyncer extends EventEmitter {
  send: (data: any[])=> void;
}

export class Collector<T = {}> extends Editor {
  private cache: T[] = [];
  private todoTimer = 0;
  private syncer?: ISyncer;
  // private doc: any[];

  private handleRecv = (args: any) => this.draw(args);

  constructor(io: ISyncer) {
    super();
    this.syncLayout = io;
  }

  destroy() {
    this.syncer?.removeListener('recv', this.handleRecv);
    this.save();
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

  private save() {
    const dataset = this.cache;
    if (!dataset.length) return;
    this.cache = [];
    this.syncer?.send && this.syncer.send(dataset);
  }

  write(str: string) {
    const list = str.split('\n');
    for (let idx = 0; idx < list.length; idx++) {
      let txt = list[idx];
      let payload = null;

      if (txt) {
        payload = { txt, paragraph: 0 };
      }

      if (idx < list.length - 1) {
        payload = { txt: '\n', paragraph: 0 };
      }

      if (payload) {
        this.draw(payload);
        this.cache.push(payload as any);
      }
    }

    if (this.todoTimer) return;

    this.todoTimer = window.setTimeout(() => {
      clearTimeout(this.todoTimer);
      this.todoTimer = 0;
      this.save();
    }, 300);
  }

  redraw() {}
}
