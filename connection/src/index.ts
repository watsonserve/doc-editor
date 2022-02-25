import EventEmitter from 'events';
import { IMsg } from './connect';
import { IConnectProps, Heartbeat } from './heartbeat';

interface IChannelProps extends IConnectProps {
  wsUrl: string;
  origin: string;
  retry: number;
  timeout: number;
  heartbeatTime: number;
}

interface IFunction {
  (...args: any[]): void;
}

export default class Channel extends Heartbeat {
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
