import { IMsg, Connection } from './connect';
export interface IConnectProps {
    longUrl: string;
    shortUrl: string;
    beatTime: number;
    intervalTime: number;
    retryTime: number;
    retryinterval: number;
}
export declare abstract class Heartbeat extends Connection {
    private beatTimer;
    private initStep;
    protected opts: IConnectProps;
    protected abstract handleRecv(data: IMsg): void;
    protected abstract get beatData(): any;
    constructor(opts: IConnectProps);
    destroy(): void;
    /**
     * 发送一个心跳，内含超时重试、消息和错误处理
     * @param timeout 超时时间
     */
    sendBeat(timeout?: number): void;
    /**
     * 心跳循环
     * @param timeout 超时时间
     */
    private _beat;
    start(): void;
    stop(): void;
    protected _encode(data: IMsg): ArrayBuffer;
    protected _decode(data: ArrayBuffer): IMsg;
    protected _onRecv(data: IMsg): void;
    protected _onError(err: Event): void;
    protected _onClose(): void;
}
