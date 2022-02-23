import { EventEmitter } from 'events';
import { ISyncer } from 'editor';

export class Syncer extends EventEmitter implements ISyncer {
  constructor() {
    super();
    (window as any).emitRecv = (data: any) => this.emit('recv', data);
  }
  send(data: any[]) {
    console.log(data);
  }
}
