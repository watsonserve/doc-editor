import { EventEmitter } from 'events';
import { ISyncer } from 'editor';
import { Channel } from 'connector';

export class Syncer extends EventEmitter implements ISyncer {
  private channel = new Channel();
  constructor() {
    super();
    (window as any).emitRecv = (data: any) => this.emit('recv', data);
  }
  send(data: any[]) {
    console.log(data);
  }
}
