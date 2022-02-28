import { IMsg, Connection } from './connect';

export interface IConnectProps {
  longUrl: string;
  shortUrl: string;
  beatTime: number;
  intervalTime: number;
  retryTime: number;
  retryinterval: number;
}

export abstract class Heartbeat extends Connection {
  private beatTimer = 0;
  private initStep = 0;
  protected opts: IConnectProps;

  protected abstract handleRecv(data: IMsg): void;
  protected abstract get beatData(): any;

  constructor(opts: IConnectProps) {
    super(opts.shortUrl);
    this.opts = { ...opts };
    this._connect(opts.longUrl).catch().then(() => {
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
      this.opts.retryTime,
      this.opts.retryinterval
    ).then(resp => this._onRecv(resp), err => {
      // @TODO log.error(err);
    });
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

  start() {
    this.initStep |= 2;
    this._beat();
  }

  stop() {
    clearTimeout(this.beatTimer);
    this.initStep = ~(~this.initStep | 2);
  }

  protected _encode(data: IMsg): ArrayBuffer {
    const raw = JSON.stringify(data);
    return new TextEncoder().encode(raw);
  }

  protected _decode(data: ArrayBuffer): IMsg {
    return JSON.parse(new TextDecoder('utf-8').decode(data)) as IMsg;
  }

  protected _onRecv(data: IMsg): void {
    // 心跳包
    if ('heartbeat' === data.msgUser) {
      return;
    }
    // 广播包
    this.handleRecv(data);
  }

  protected _onError(err: Event): void {
    throw new Error("Method not implemented.");
  }

  protected _onClose(): void {

  }
}
