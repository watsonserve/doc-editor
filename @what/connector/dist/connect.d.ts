export interface IMsg {
    msgUser?: string;
    data: any;
}
export declare abstract class Connection {
    private shortUrl;
    private __ws;
    private readonly __waiting;
    protected abstract _encode(data: any): ArrayBuffer;
    protected abstract _decode(data: ArrayBuffer): any;
    protected abstract _onRecv(data: IMsg): void;
    protected abstract _onError(err: Event): void;
    protected abstract _onClose(): void;
    constructor(url: string);
    private __onRecv;
    protected _connect(wsUrl: string): Promise<void>;
    get url(): string | undefined;
    get canUse(): boolean;
    protected _close(): void;
    protected _destroy(): void;
    protected _send(data: IMsg, timeout?: number): Promise<IMsg | undefined>;
    /**
     * 单次短链请求
     * @param data 含有msgUser的数据
     * @param timeout 超时时间
     * @returns 应答结果
     */
    private __pingpong;
    /**
     * 发送请求，屏蔽长、短链
     * @param data 含有msgUser的数据
     * @param timeout 超时时间
     * @param retry 重试次数
     * @param short 强制使用短链
     * @returns 应答结果
     */
    protected _post(data: IMsg, timeout?: number, retry?: number, retryInterval?: number, short?: boolean): Promise<any | undefined>;
    /**
     * 发送外部自定义的消息
     * @param data 不含有msgUser的数据
     * @param timeout 超时时间
     * @param retry 重试次数
     * @returns 应答结果
     */
    post(data: any, timeout?: number, retry?: number): Promise<any | undefined>;
}
