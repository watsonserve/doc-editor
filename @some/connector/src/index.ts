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
  private readonly eventor = new EventEmitter();

  constructor(props: IChannelProps) {
    super(props);
  }

  protected _onRecv(data: IMsg): void {
    this.eventor.emit(data.msgUser || 'broadcast', data);
  }

  protected get beatData(): any {
    return {};
  }

  registerListener(name: string, fn: IFunction) {
    this.eventor.addListener(name, fn);
  }

  removeListener(name: string, fn: IFunction) {
    this.eventor.removeListener(name, fn);
  }
}
