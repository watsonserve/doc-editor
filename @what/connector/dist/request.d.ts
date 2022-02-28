export declare enum Method {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    OPTIONS = "OPTIONS",
    HEAD = "HEAD"
}
export declare enum ContentType {
    URLENCODE = "application/x-www-form-urlencoded",
    FORMDATA = "multipart/form-data",
    JSON = "application/json",
    PROTOBUF = "application/x-protobuf"
}
export interface RequestOptions {
    url: string;
    method?: Method;
    headers: any;
    data?: any;
    timeout?: number;
}
export declare function base_request(options: RequestOptions): Promise<{
    headers: any;
    body: ArrayBuffer;
}>;
export declare function request(options: RequestOptions): Promise<any>;
