var events = {exports: {}};

var R = typeof Reflect === 'object' ? Reflect : null;
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  };

var ReflectOwnKeys;
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys;
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
};

function EventEmitter() {
  EventEmitter.init.call(this);
}
events.exports = EventEmitter;
events.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    }
    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}

var EventEmitter$1 = events.exports;

var Method;
(function (Method) {
    Method["GET"] = "GET";
    Method["POST"] = "POST";
    Method["PUT"] = "PUT";
    Method["DELETE"] = "DELETE";
    Method["OPTIONS"] = "OPTIONS";
    Method["HEAD"] = "HEAD";
})(Method || (Method = {}));
var ContentType;
(function (ContentType) {
    ContentType["URLENCODE"] = "application/x-www-form-urlencoded";
    ContentType["FORMDATA"] = "multipart/form-data";
    ContentType["JSON"] = "application/json";
    ContentType["PROTOBUF"] = "application/x-protobuf";
})(ContentType || (ContentType = {}));
function urlEncode(data, searchParams = new URLSearchParams()) {
    Object.keys(data).forEach(key => {
        const item = data[key];
        (Array.isArray(item) ? item : [item]).forEach(val => {
            searchParams.append(key, val);
        });
    });
    return searchParams;
}
async function base_request(options) {
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
            referrerPolicy: 'same-origin',
            keepalive: true,
            body: (reqNoBody) ? undefined : data
        });
        clearTimeout(timer);
        if (!resp.ok)
            return Promise.reject(new Error(resp.statusText || String(resp.status)));
        const respBody = await resp.arrayBuffer();
        return { headers: resp.headers, body: respBody };
    }
    catch (err) {
        return Promise.reject(err);
    }
}
async function request(options) {
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
        };
        const contentType = headers['Content-Type'].split(';')[0] || ContentType.PROTOBUF;
        switch (contentType) {
            case ContentType.JSON:
                data = JSON.stringify(_data);
                break;
            case ContentType.URLENCODE:
                data = urlEncode(_data).toString();
                break;
            default:
                data = _data;
        }
        headers = {
            ...headers,
            'Content-Type': `${contentType}; charset=utf-8`
        };
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

function sleep(time) {
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
class Connection {
    shortUrl = '';
    __ws = null;
    __waiting = new Map();
    constructor(url) {
        this.shortUrl = url;
    }
    __onRecv = (ev) => {
        const { msgSN, ...resp } = this._decode(ev.data);
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
    };
    async _connect(wsUrl) {
        this.__ws = await new Promise((resolve, reject) => {
            try {
                const ws = new WebSocket(wsUrl);
                ws.onopen = () => resolve(ws);
                ws.onerror = () => reject(new Error('connect falied'));
            }
            catch (err) {
                reject(err);
            }
        });
        this.__ws.onerror = this._onError;
        this.__ws.onclose = this._onClose;
        this.__ws.onmessage = this.__onRecv;
    }
    get url() {
        return this.__ws?.url;
    }
    get canUse() {
        return WebSocket.OPEN === this.__ws?.readyState;
    }
    _close() {
        if (!this.__ws)
            return;
        this.__ws.onerror = null;
        this.__ws.onclose = null;
        this.__ws.onmessage = null;
        this.__ws.close();
    }
    _destroy() {
        this._close();
        this.__ws = null;
        this.__waiting.clear();
    }
    _send(data, timeout = 5000) {
        if (!this.canUse)
            return Promise.reject(new Error('not open'));
        if (timeout < 1) {
            this.__ws.send(this._encode(data));
            return Promise.resolve(undefined);
        }
        const uuid = randomUUID();
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                clearTimeout(timer);
                this.__waiting.delete(uuid);
                reject(new Error('timeout'));
            }, timeout);
            this.__ws.send(this._encode({ msgSN: uuid, ...data }));
            this.__waiting.set(uuid, resolve);
        });
    }
    /**
     * 单次短链请求
     * @param data 含有msgUser的数据
     * @param timeout 超时时间
     * @returns 应答结果
     */
    async __pingpong(data, timeout = 5000) {
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
    async _post(data, timeout = 5000, retry = 3, retryInterval = 0, short = false) {
        try {
            return await this.canUse && !short ? this._send(data, timeout) : this.__pingpong(data, timeout);
        }
        catch (err) {
            if (retry < 1)
                return Promise.reject(err);
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
    async post(data, timeout = 5000, retry = 0) {
        return this._post({ data }, timeout, retry);
    }
}

class Heartbeat extends Connection {
    beatTimer = 0;
    initStep = 0;
    opts;
    constructor(opts) {
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
        this._post({ msgUser: 'heartbeat', data: this.beatData }, timeout, this.opts.retryTime, this.opts.retryinterval).then(resp => this._onRecv(resp), err => {
            // @TODO log.error(err);
        });
    }
    /**
     * 心跳循环
     * @param timeout 超时时间
     */
    _beat(timeout = 5000) {
        if (this.initStep < 3)
            return;
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
    _encode(data) {
        const raw = JSON.stringify(data);
        return new TextEncoder().encode(raw);
    }
    _decode(data) {
        return JSON.parse(new TextDecoder('utf-8').decode(data));
    }
    _onRecv(data) {
        // 心跳包
        if ('heartbeat' === data.msgUser) {
            return;
        }
        // 广播包
        this.handleRecv(data);
    }
    _onError(err) {
        throw new Error("Method not implemented.");
    }
    _onClose() {
    }
}

class Channel extends Heartbeat {
    get beatData() {
        throw new Error('Method not implemented.');
    }
    eventor = new EventEmitter$1();
    constructor(props) {
        super(props);
    }
    handleRecv(data) {
        this.eventor.emit(data.msgUser || 'broadcast', data);
    }
    register(name, fn) {
        this.eventor.addListener(name, fn);
    }
    removeEventListener(name, fn) {
        this.eventor.removeListener(name, fn);
    }
}

export { Channel, ContentType, Method, request };
