export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD'
}

export enum ContentType {
  URLENCODE = 'application/x-www-form-urlencoded',
  FORMDATA = 'multipart/form-data',
  JSON = 'application/json',
  PROTOBUF = 'application/x-protobuf',
}

export interface RequestOptions {
  url: string;
  method?: Method;
  headers: any;
  data?: any;
  timeout?: number;
}

function urlEncode(data: any, searchParams = new URLSearchParams()) {
  Object.keys(data).forEach(key => {
    const item = data[key];
    (Array.isArray(item) ? item : [item]).forEach(val => {
      searchParams.append(key, val);
    });
  });
  return searchParams;
}

export async function base_request(options: RequestOptions): Promise<{ headers: any; body: ArrayBuffer }> {
  const { url, method, headers, data, timeout } = options;
  const reqNoBody = Method.GET === method || Method.HEAD === method;

  try {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      throw new Error('timeout');
    }, timeout);

    const resp = await fetch(url, {
      method,
      headers,
      cache: 'no-cache',
      credentials: 'include',
      mode: 'no-cors',
      referrerPolicy:'same-origin',
      keepalive: true,
      body: (reqNoBody) ? undefined : data
    });
    clearTimeout(timer);

    if (!resp.ok) return Promise.reject(new Error(resp.statusText || String(resp.status)));

    const respBody = await resp.arrayBuffer();
    return { headers: resp.headers, body: respBody };
  } catch(err) {
    return Promise.reject(err);
  }
}

export async function request(options: RequestOptions): Promise<any> {
  const { url: _url, method, headers: _headers, data: _data } = options;
  const url = new URL(_url);
  const reqNoBody = Method.GET === method || Method.HEAD === method;
  let data, headers = { ...(_headers || {}) };

  // 可以有body，但没有
  if (!data && !reqNoBody)
    headers['Content-Length'] = '0';

  // 不应该有body，但有数据
  if (_data && reqNoBody)
    urlEncode(_data, url.searchParams);

  // 有body数据
  if (_data && !reqNoBody) {
    headers = {
      'Content-Type': `${ContentType.URLENCODE}; charset=utf-8`,
      ...headers
    } as any;
    const contentType = headers['Content-Type'].split(';')[0] || ContentType.PROTOBUF

    switch (contentType) {
      case ContentType.JSON:
        data = JSON.stringify(_data);
        break
      case ContentType.URLENCODE:
        data = urlEncode(_data).toString();
        break
      default:
        data = _data;
    }

    headers = {
      ...headers,
      'Content-Type': `${contentType}; charset=utf-8`
    }
  }

  const { headers: respHeaders, body } = await base_request({
    url: url.toString(),
    method,
    headers,
    data: (reqNoBody) ? undefined : data
  });

  const contentType = (respHeaders.get('Content-Type') || '').split(';')[0];

  if (ContentType.JSON !== contentType && !contentType.startsWith('text/'))
    return body;
  const str = new TextDecoder('utf-8').decode(body);
  return JSON.parse(str);
}
