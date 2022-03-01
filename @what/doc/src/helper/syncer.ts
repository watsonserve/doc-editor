import { EventEmitter } from 'events';
import { ISyncer } from '@what/editor';
import { Channel } from '@what/connector';

export class Syncer extends EventEmitter implements ISyncer {
  private channel = new Channel({
    longUrl: '',
    shortUrl: '',
    beatTime: 30000,
    intervalTime: 10000,
    beatRetryTime: 3,
    beatRetryInterval: 5000,
    weakThresHold: 3,
    connRetryTime: 3,
    connRetryInterval: 1000,
  });
  constructor() {
    super();
    (window as any).emitRecv = (data: any) => this.emit('recv', data);
  }
  send(data: any[]) {
    console.log(data);
  }
}
