import EventEmitter from 'events';
import { IMsg } from './connect';
import { IConnectProps, Heartbeat } from './heartbeat';

export { Method, ContentType, request } from './request';

interface IChannelProps extends IConnectProps {
}

interface IFunction {
  (...args: any[]): void;
}

export class Channel extends Heartbeat {
  protected get beatData(): any {
    throw new Error('Method not implemented.');
  }
  private readonly eventor = new EventEmitter();

  constructor(props: IChannelProps) {
    super(props);
  }

  handleRecv(data: IMsg) {
    this.eventor.emit(data.msgUser || 'broadcast', data);
  }

  register(name: string, fn: IFunction) {
    this.eventor.addListener(name, fn);
  }

  removeEventListener(name: string, fn: IFunction) {
    this.eventor.removeListener(name, fn);
  }
}
