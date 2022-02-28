import { IMsg } from './connect';
import { IConnectProps, Heartbeat } from './heartbeat';
export { Method, ContentType, request } from './request';
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
export declare class Channel extends Heartbeat {
    protected get beatData(): any;
    private readonly eventor;
    constructor(props: IChannelProps);
    handleRecv(data: IMsg): void;
    register(name: string, fn: IFunction): void;
    removeEventListener(name: string, fn: IFunction): void;
}
