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

function connSocket(url: string) {
  return new Promise<WebSocket>((resolve, reject) => {
    try {
      const ws = new WebSocket(url);
      ws.onopen = () => resolve(ws);
      ws.onerror = () => reject(new Error('connect falied'));
    } catch (err) {
      reject(err);
    }
  });
}

enum EnConnStat {
  UNINIT,
  CLOSED,
  DOING,
  OK
}

export interface IConnectionProps {
  longUrl: string;
  shortUrl: string;
  weakThresHold: number;
  connRetryTime: number;
  connRetryInterval: number;
}

export abstract class Connection {
  protected abstract _encode(data: _IMsg): ArrayBuffer;
  protected abstract _decode(data: ArrayBuffer): _IMsg;
  protected abstract _onRecv(data: IMsg): void;

  private readonly __waiting = new Map<string, IWaiting>();
  private __weakThresHold: number;
  private __shortOkCnt = 0;
  private __connRetryTime: number;
  private __connRetryInterval: number;
  private __langUrl = '';
  private __shortUrl = '';
  private __ws: WebSocket | null = null;
  private __connStat = EnConnStat.UNINIT;
  
  private __onError = (err: Event) => {
    console.error(err);
  };

  private __onClose = async () => {
    this.__connStat = EnConnStat.CLOSED;
    await sleep(10);
    this._connect();
  };

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

  private __send(data: IMsg, timeout = 5000): Promise<IMsg | undefined> {
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
   * ??????????????????
   * @param data ??????msgUser?????????
   * @param timeout ????????????
   * @returns ????????????
   */
  private async __pingpong(data: IMsg, timeout = 5000) {
    try {
      const resp = await base_request({
        url: this.__shortUrl,
        method: Method.POST,
        timeout,
        headers: {
          'Content-Type': `${ContentType.JSON}; charset=utf-8`
        },
        data: this._encode(data)
      });

      // ?????????????????????????????????????????????????????????????????????????????????????????????
      if (this.__connStat === EnConnStat.CLOSED) {
        this.__shortOkCnt++;
        this.__weakThresHold < this.__shortOkCnt && this._connect();
      }

      return this._decode(resp.body);
    } catch (err) {
      this.__connStat === EnConnStat.CLOSED && (this.__shortOkCnt = 0);
      return Promise.reject(err);
    }
  }

  /**
   * ?????????????????????????????????
   * @param data ??????msgUser?????????
   * @param timeout ????????????
   * @param retry ????????????
   * @param short ??????????????????
   * @returns ????????????
   */
  protected async _post(data: IMsg, timeout = 5000, retry = 3, retryInterval = 0, short = false): Promise<any | undefined> {
    try {
      return await this.canUse && !short ? this.__send(data, timeout) : this.__pingpong(data, timeout);
    } catch (err) {
      if (retry < 1) return Promise.reject(err);
    }
    await sleep(retryInterval);
    return this._post(data, timeout, retry - 1, retryInterval, true);
  }

  protected async _connect(retry = this.__connRetryTime) {
    if (retry < 0) {
      this.__connStat = EnConnStat.CLOSED;
      return;
    }
    this.__connStat = EnConnStat.DOING;
    try {
      this.__ws = await connSocket(this.__langUrl);
      this.__ws!.onerror = this.__onError;
      this.__ws!.onclose = this.__onClose;
      this.__ws!.onmessage = this.__onRecv;
      this.__connStat = EnConnStat.OK;
    } catch (err) {
      sleep(this.__connRetryInterval).then(() => this._connect(retry - 1));
    }
  }

  protected _close() {
    this.__connStat = EnConnStat.UNINIT;
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

  constructor(props: IConnectionProps) {
    this.__weakThresHold = props.weakThresHold;
    this.__langUrl = props.longUrl;
    this.__shortUrl = props.shortUrl;
    this.__connRetryTime = props.connRetryTime;
    this.__connRetryInterval = props.connRetryInterval;
  }

  get canUse() {
    return WebSocket.OPEN === this.__ws?.readyState;
  }

  /**
   * ??????????????????????????????
   * @param data ?????????msgUser?????????
   * @param timeout ????????????
   * @param retry ????????????
   * @returns ????????????
   */
  async post(data: any, timeout = 5000, retry = 0): Promise<any | undefined> {
    return this._post({ data }, timeout, retry);
  }
}
