import { IMsg, Connection } from './connect';

export interface IConnectProps {
  longUrl: string;
  shortUrl: string;
  beatTime: number;
  intervalTime: number;
}

export abstract class Heartbeat extends Connection {
  protected opts: IConnectProps;

  protected abstract handleRecv(data: IMsg): void;

  constructor(opts: IConnectProps) {
    super();
    this.opts = { ...opts };
    this._connect(opts.longUrl).catch().then(() => {
      this.beat();
    });
  }

  private async pingpong(data: any, timeout = 5000) {
    const resp = await self.fetch(this.opts.shortUrl, {
      method: 'post',
      mode: 'no-cors',
      credentials: 'include',
      referrerPolicy:'same-origin',
      cache: 'no-cache',
      headers: {},
      keepalive: true,
      body: this._encode({ data })
    });
    if (!resp.ok) return Promise.reject(new Error(resp.statusText));
    const respData = await resp.arrayBuffer();
    return this._decode(respData);
  }

  private beat() {
    const data = {};
    this.canUse
    ? this._send(data)
    : this.pingpong(data).then(resp => this._onRecv(resp), err => this._onError(err));
  }

  async post(data: any, timeout = 5000, retry = 0): Promise<IMsg | undefined> {
    try {
      return await this.canUse ? this._send(data, timeout) : this.pingpong(data, timeout);
    } catch (err) {
      if (retry) return this.post(data, timeout, retry - 1);
      return Promise.reject(err);
    }
  }

  protected _encode(data: IMsg): ArrayBuffer {
    const raw = JSON.stringify(data);
    return new TextEncoder().encode(raw);
  }

  protected _decode(data: ArrayBuffer): IMsg {
    return JSON.parse(new TextDecoder('utf-8').decode(data)) as IMsg;
  }

  protected _onRecv(data: IMsg): void {
    this.onRecv(data);
  }
  protected _onError(err: Event): void {
    throw new Error("Method not implemented.");
  }
  protected _onClose(): void {
    throw new Error("Method not implemented.");
  }
}
