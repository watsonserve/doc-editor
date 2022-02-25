interface IWaiting {
  (...args: any[]): void;
}

export interface IMsg {
  msgSN?: string;
  msgType?: string;
  msgUser?: string;
  data: any;
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
  private __ws: WebSocket | null = null;
  private readonly __waiting = new Map<string, IWaiting>();

  protected abstract _encode(data: IMsg): ArrayBuffer;
  protected abstract _decode(data: ArrayBuffer): IMsg;
  protected abstract _onRecv(data: IMsg): void;
  protected abstract _onError(err: Event): void;
  protected abstract _onClose(): void;

  private __onRecv = (ev: MessageEvent<ArrayBuffer>) => {
    const resp = this._decode(ev.data);
    // a msg sent by caller and need a response
    if (resp.msgSN) {
      const waiter = this.__waiting.get(resp.msgSN);
      waiter && waiter(resp);
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

  protected _send(data: any, timeout = 5000): Promise<IMsg | undefined> {
    if (!this.canUse) return Promise.reject(new Error('not open'));

    if (timeout < 1) {
      this.__ws!.send(this._encode({ data }));
      return Promise.resolve(undefined);
    }

    const uuid = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);

        this.__waiting.delete(uuid);
        reject(new Error('timeout'));
      }, timeout);

      this.__ws!.send(this._encode({ msgSN: uuid, data }));
      this.__waiting.set(uuid, resolve);
    });
  }
}
