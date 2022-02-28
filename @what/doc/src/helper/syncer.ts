import { EventEmitter } from 'events';
import { ISyncer } from '@what/editor';
import { Channel } from '@what/connector';

export class Syncer extends EventEmitter implements ISyncer {
  private channel = new Channel({
    longUrl: '',
    shortUrl: '',
    beatTime: 30000,
    intervalTime: 10000,
    retryTime: 3,
    retryinterval: 0,
  });
  constructor() {
    super();
    (window as any).emitRecv = (data: any) => this.emit('recv', data);
  }
  send(data: any[]) {
    console.log(data);
  }
}
