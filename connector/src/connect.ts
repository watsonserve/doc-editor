import { Method, ContentType, base_request } from './request';

export interface IMsg {
  msgUser?: string;
  data: any;
}

interface _IMsg extends IMsg {
  msgSN?: string;
}

interface IWaiting {
  (args: IMsg): void;
}

function sleep(time: number): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      resolve();
    }, time);
  });
}

function randomUUID() {
  const sp = [4, 6, 8, 10, 0];
  let i = 0;
  return [...self.crypto.getRandomValues(new Uint8Array(16))].reduce((pre, n, idx) => {
    if (idx === sp[i]) {
      pre += '-';
      i++;
    }
    pre += n.toString(16);
    return pre;
  }, '');
}

export abstract class Connection {
  private shortUrl = '';
  private __ws: WebSocket | null = null;
  private readonly __waiting = new Map<string, IWaiting>();

  protected abstract _encode(data: any): ArrayBuffer;
  protected abstract _decode(data: ArrayBuffer): any;
  protected abstract _onRecv(data: IMsg): void;
  protected abstract _onError(err: Event): void;
  protected abstract _onClose(): void;

  constructor(url: string) {
    this.shortUrl = url;
  }

  private __onRecv = (ev: MessageEvent<ArrayBuffer>) => {
    const { msgSN, ...resp } = this._decode(ev.data) as _IMsg;
    // a msg sent by caller and need a response
    if (msgSN) {
      const waiter = this.__waiting.get(msgSN);
      if (waiter) {
        this.__waiting.delete(msgSN);
        waiter(resp);
      }
      return;
    }
    // a broadcast
    this._onRecv(resp);
  }

  protected async _connect(wsUrl: string) {
    this.__ws = await new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(wsUrl);
        ws.onopen = () => resolve(ws);
        ws.onerror = () => reject(new Error('connect falied'));
      } catch (err) {
        reject(err);
      }
    });
    this.__ws!.onerror = this._onError;
    this.__ws!.onclose = this._onClose;
    this.__ws!.onmessage = this.__onRecv;
  }

  get url() {
    return this.__ws?.url;
  }

  get canUse() {
    return WebSocket.OPEN === this.__ws?.readyState;
  }

  protected _close() {
    if (!this.__ws) return;
    this.__ws.onerror = null;
    this.__ws.onclose = null;
    this.__ws.onmessage = null;
    this.__ws.close();
  }

  protected _destroy() {
    this._close();
    this.__ws = null;
    this.__waiting.clear();
  }

  protected _send(data: IMsg, timeout = 5000): Promise<IMsg | undefined> {
    if (!this.canUse) return Promise.reject(new Error('not open'));

    if (timeout < 1) {
      this.__ws!.send(this._encode(data));
      return Promise.resolve(undefined);
    }

    const uuid = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);

        this.__waiting.delete(uuid);
        reject(new Error('timeout'));
      }, timeout);

      this.__ws!.send(this._encode({ msgSN: uuid, ...data }));
      this.__waiting.set(uuid, resolve);
    });
  }

  /**
   * 单次短链请求
   * @param data 含有msgUser的数据
   * @param timeout 超时时间
   * @returns 应答结果
   */
  private async __pingpong(data: IMsg, timeout = 5000) {
    const resp = await base_request({
      url: this.shortUrl,
      method: Method.POST,
      timeout,
      headers: {
        'Content-Type': `${ContentType.JSON}; charset=utf-8`
      },
      data: this._encode(data)
    });
    return this._decode(resp.body);
  }

  /**
   * 发送请求，屏蔽长、短链
   * @param data 含有msgUser的数据
   * @param timeout 超时时间
   * @param retry 重试次数
   * @param short 强制使用短链
   * @returns 应答结果
   */
  protected async _post(data: IMsg, timeout = 5000, retry = 3, retryInterval = 0, short = false): Promise<any | undefined> {
    try {
      return await this.canUse && !short ? this._send(data, timeout) : this.__pingpong(data, timeout);
    } catch (err) {
      if (retry < 1) return Promise.reject(err);
    }
    await sleep(retryInterval);
    return this._post(data, timeout, retry - 1, retryInterval, true);
  }

  /**
   * 发送外部自定义的消息
   * @param data 不含有msgUser的数据
   * @param timeout 超时时间
   * @param retry 重试次数
   * @returns 应答结果
   */
  async post(data: any, timeout = 5000, retry = 0): Promise<any | undefined> {
    return this._post({ data }, timeout, retry);
  }
}
