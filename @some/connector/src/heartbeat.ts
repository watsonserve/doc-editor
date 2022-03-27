import { IMsg, IConnectionProps, Connection } from './connect';

export interface IConnectProps extends IConnectionProps {
  beatTime: number;
  intervalTime: number;
  beatRetryTime: number;
  beatRetryInterval: number;
}

export abstract class Heartbeat extends Connection {
  private beatTimer = 0;
  private initStep = 0;

  private _handleBeat(resp: IMsg) {
    // @TODO
  }

  /**
   * 心跳循环
   * @param timeout 超时时间
   */
  private _beat(timeout = 5000) {
    if (this.initStep < 3) return;

    this.beatTimer = self.setTimeout(() => {
      clearTimeout(this.beatTimer);
      return this._beat(timeout);
    }, this.canUse ? this.opts.beatTime : this.opts.intervalTime);

    this.sendBeat(timeout);
  }

  protected opts: IConnectProps;
  protected abstract get beatData(): any;

  protected _encode(data: IMsg): ArrayBuffer {
    const raw = JSON.stringify(data);
    return new TextEncoder().encode(raw);
  }

  protected _decode(data: ArrayBuffer): IMsg {
    return JSON.parse(new TextDecoder('utf-8').decode(data)) as IMsg;
  }

  constructor(opts: IConnectProps) {
    super(opts);
    this.opts = { ...opts };
    this._connect().then(() => {
      this.initStep |= 1;
      this._beat();
    });
  }

  destroy() {
    this.stop();
    this._destroy();
  }

  /**
   * 发送一个心跳，内含超时重试、消息和错误处理
   * @param timeout 超时时间
   */
  sendBeat(timeout = 5000) {
    this._post(
      { msgUser: 'heartbeat', data: this.beatData },
      timeout,
      this.opts.beatRetryTime,
      this.opts.beatRetryInterval
    ).then(resp => this._handleBeat(resp), err => {
      // @TODO log.error(err);
    });
  }

  start() {
    this.initStep |= 2;
    this._beat();
  }

  stop() {
    clearTimeout(this.beatTimer);
    this.initStep = ~(~this.initStep | 2);
  }
}
