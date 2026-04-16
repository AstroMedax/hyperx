var nt = Object.defineProperty;
var s = (r, e) => nt(r, "name", { value: e, configurable: !0 });
import Q from "crypto";
import rt from "crc-32";
import G from "zlib";
import { promisify as W } from "util";
var it = W(G.gzip),
  ot = W(G.gunzip);
async function b(r) {
  return r.then(
    (e) => [e, null],
    (e) => [null, e instanceof Error ? e : new Error(String(e))],
  );
}
s(b, "tryAsync");
function st(r) {
  try {
    return [r(), null];
  } catch (e) {
    return [null, e instanceof Error ? e : new Error(String(e))];
  }
}
s(st, "trySync");
function l(r, e = {}) {
  let t = new Error(r);
  if (
    (e.code && (t.code = e.code),
    e.errno !== void 0 && (t.errno = e.errno),
    e.syscall && (t.syscall = e.syscall),
    e.host && (t.host = e.host),
    e.port && (t.port = e.port),
    e.cause && typeof e.cause == "object")
  ) {
    let n = e.cause;
    (!t.code && n.code && (t.code = String(n.code)),
      t.errno === void 0 && n.errno !== void 0 && (t.errno = Number(n.errno)),
      !t.syscall && n.syscall && (t.syscall = String(n.syscall)));
  }
  return t;
}
s(l, "makeError");
var ct = {
  ECONNREFUSED: "server is not running or the port is incorrect",
  ENOTFOUND: "host not found",
  ETIMEDOUT:
    "connection timed out \u2014 server is slow or a firewall is blocking",
  ECONNRESET: "connection was reset by the server",
  EACCES: "access denied \u2014 check permissions or port < 1024",
  EHOSTUNREACH: "host is unreachable \u2014 check your network connection",
};
function y(r, e, t) {
  let n = t instanceof Error ? t : new Error(String(t)),
    i = t,
    o =
      (i && typeof i.code == "string" ? i.code : "") ||
      (/ECONNREFUSED/i.test(n.message)
        ? "ECONNREFUSED"
        : /ETIMEDOUT/i.test(n.message)
          ? "ETIMEDOUT"
          : /ENOTFOUND/i.test(n.message)
            ? "ENOTFOUND"
            : "CONN_ERROR"),
    c = i && i.errno !== void 0 ? Number(i.errno) : void 0,
    a = i && typeof i.syscall == "string" ? i.syscall : void 0,
    u = ct[o] ?? n.message;
  return l(`[${o}] Failed to connect to ${r}:${e} \u2014 ${u}`, {
    code: o,
    errno: c,
    syscall: a,
    host: r,
    port: e,
    cause: n,
  });
}
s(y, "formatConnErr");
var X = 1364673870,
  K = 3,
  h = Object.freeze({
    Data: 1,
    Request: 2,
    Response: 3,
    Stream: 4,
    StreamEnd: 5,
    Heartbeat: 6,
    Error: 7,
    Ack: 8,
    Auth: 9,
    AuthOK: 10,
    AuthFail: 11,
    StreamAck: 12,
  }),
  m = Object.freeze({ Raw: 0, JSON: 1, Gzip: 2, Bin: 3 }),
  at = Object.freeze({ Normal: 0, High: 1 }),
  E = 24,
  Y = 512 * 1024 * 1024,
  ut = 1024,
  lt = 16,
  V = 64,
  ht = 5e3;
function Z(r) {
  return rt.buf(r) >>> 0;
}
s(Z, "checksum");
async function J(r, e) {
  if (e !== m.Gzip) return { data: r, encoding: e };
  if (r.length <= ut) return { data: r, encoding: m.Raw };
  let t = await it(r, { level: 1 });
  return t.length >= r.length
    ? { data: r, encoding: m.Raw }
    : { data: Buffer.from(t), encoding: m.Gzip };
}
s(J, "compress");
async function z(r, e) {
  return e !== m.Gzip ? r : Buffer.from(await ot(r));
}
s(z, "decompress");
function w({
  type: r,
  requestID: e,
  body: t = Buffer.alloc(0),
  encoding: n = m.Raw,
  flags: i = 0,
}) {
  let o = Buffer.isBuffer(t) ? t : Buffer.from(t);
  if (o.length > Y) throw new Error(`Body too large: ${o.length}`);
  let c = Buffer.alloc(E);
  return (
    c.writeUInt32BE(X, 0),
    c.writeUInt8(K, 4),
    c.writeUInt8(r, 5),
    c.writeUInt8(n, 6),
    c.writeUInt8(i & 255, 7),
    c.writeBigUInt64BE(BigInt(e), 8),
    c.writeUInt32BE(o.length, 16),
    c.writeUInt32BE(Z(c.subarray(0, 20)), 20),
    Buffer.concat([c, o])
  );
}
s(w, "encodeFrame");
function ft(r) {
  if (r.length < E) throw new Error("Buffer too small");
  let e = r.readUInt32BE(0);
  if (e !== X) throw new Error(`Invalid magic: 0x${e.toString(16)}`);
  let t = r.readUInt8(4);
  if (t > K) throw new Error(`Unsupported protocol version: ${t}`);
  let n = Z(r.subarray(0, 20)),
    i = r.readUInt32BE(20);
  if (n !== i)
    throw new Error(
      `CRC32 mismatch (expected 0x${n.toString(16)}, got 0x${i.toString(16)})`,
    );
  let o = r.readUInt8(5),
    c = r.readUInt8(6),
    a = r.readUInt8(7),
    u = Number(r.readBigUInt64BE(8)),
    f = r.readUInt32BE(16);
  if (f > Y) throw new Error(`Body too large: ${f}`);
  if (r.length < E + f) throw new Error("Incomplete frame");
  return {
    magic: e,
    version: t,
    type: o,
    encoding: c,
    flags: a,
    requestID: u,
    body: r.subarray(E, E + f),
  };
}
s(ft, "decodeFrame");
function dt(r) {
  let e = Q.randomBytes(16).toString("hex"),
    t = Math.floor(Date.now() / 1e3),
    n = Q.createHmac("sha256", r).update(`${e}:${t}`).digest("hex");
  return JSON.stringify({ nonce: e, ts: t, sig: n });
}
s(dt, "buildAuthPayload");
var B = class B {
  constructor() {
    this.b = [1e5, 5e5, 1e6, 5e6, 1e7, 5e7, 1e8, 5e8, 1e9];
    this.c = new Array(10).fill(0);
    this.total = 0;
    this.sum = 0n;
  }
  observe(e) {
    (this.total++, (this.sum += BigInt(Math.round(e))));
    for (let t = 0; t < this.b.length; t++)
      if (e <= this.b[t]) {
        this.c[t]++;
        return;
      }
    this.c[this.b.length]++;
  }
  percentile(e) {
    if (this.total === 0) return 0;
    let t = Math.floor((this.total * e) / 100),
      n = 0;
    for (let i = 0; i < this.c.length; i++)
      if (((n += this.c[i]), n >= t))
        return i < this.b.length ? this.b[i] : this.b[this.b.length - 1] * 2;
    return Number(this.sum / BigInt(this.total));
  }
  avg() {
    return this.total === 0 ? 0 : Number(this.sum) / this.total;
  }
  snapshot() {
    return {
      p50: this.percentile(50),
      p95: this.percentile(95),
      p99: this.percentile(99),
      avg: this.avg(),
      total: this.total,
    };
  }
};
s(B, "LatencyHistogram");
var R = B,
  x = class x {
    constructor() {
      this.framesSent = 0;
      this.framesRecv = 0;
      this.bytesSent = 0;
      this.bytesRecv = 0;
      this.errors = 0;
      this.activeRequests = 0;
      this.activeStreams = 0;
      this.reconnectCount = 0;
      this.droppedFrames = 0;
      this.latency = new R();
    }
    snapshot() {
      return {
        framesSent: this.framesSent,
        framesRecv: this.framesRecv,
        bytesSent: this.bytesSent,
        bytesRecv: this.bytesRecv,
        errors: this.errors,
        activeRequests: this.activeRequests,
        activeStreams: this.activeStreams,
        reconnectCount: this.reconnectCount,
        droppedFrames: this.droppedFrames,
        latency: this.latency.snapshot(),
      };
    }
  };
s(x, "Metrics");
var T = x,
  A = class A {
    constructor(e) {
      this.cap = 0;
      this.tok = 0;
      this.rate = 0;
      this.last = 0;
      ((this.u = !e || e <= 0),
        this.u ||
          ((this.cap = e),
          (this.tok = e),
          (this.rate = e / 1e3),
          (this.last = Date.now())));
    }
    allow() {
      if (this.u) return !0;
      let e = Date.now();
      return (
        (this.tok = Math.min(this.cap, this.tok + (e - this.last) * this.rate)),
        (this.last = e),
        this.tok >= 1 ? (this.tok--, !0) : !1
      );
    }
  };
s(A, "RateLimiter");
var S = A,
  N = class N {
    constructor() {
      this._l = new Map();
    }
    on(e, t) {
      return (
        this._l.has(e) || this._l.set(e, []),
        this._l.get(e).push(t),
        this
      );
    }
    off(e, t) {
      let n = this._l.get(e);
      if (n) {
        let i = n.indexOf(t);
        i !== -1 && n.splice(i, 1);
      }
      return this;
    }
    once(e, t) {
      let n = s((...i) => {
        (this.off(e, n), t(...i));
      }, "w");
      return this.on(e, n);
    }
    emit(e, ...t) {
      this._l
        .get(e)
        ?.slice()
        .forEach((n) => {
          try {
            n(...t);
          } catch {}
        });
    }
  };
s(N, "EventEmitter");
var g = N,
  I = class I extends g {
    constructor(t, n) {
      super();
      this._q = [];
      this._w = [];
      this._done = !1;
      this._win = lt;
      this._ack = 0;
      ((this.id = t), (this._m = n), n.activeStreams++);
    }
    _push(t) {
      this._done ||
        (this._w.length > 0
          ? this._w.shift()({ value: t, done: !1 })
          : this._q.push(t));
    }
    _close(t = null) {
      if (!this._done) {
        for (this._done = !0, this._m.activeStreams--; this._w.length > 0; )
          this._w.shift()(
            t ? { value: null, done: !0, error: t } : { value: null, done: !0 },
          );
        this.emit("end", t);
      }
    }
    _ackChunk() {
      ++this._ack >= this._win &&
        this._win < V &&
        (this._win = Math.min(this._win * 2, V));
    }
    read() {
      return this._q.length > 0
        ? (this._ackChunk(),
          Promise.resolve({ value: this._q.shift(), done: !1 }))
        : this._done
          ? Promise.resolve({ value: null, done: !0 })
          : new Promise((t, n) => {
              let i = setTimeout(() => {
                let o = this._w.indexOf(t);
                (o !== -1 && this._w.splice(o, 1),
                  n(new Error("Stream consumer timeout")));
              }, ht);
              this._w.push((o) => {
                (clearTimeout(i),
                  o.error ? n(o.error) : (this._ackChunk(), t(o)));
              });
            });
    }
    [Symbol.asyncIterator]() {
      return {
        next: s(async () => {
          try {
            let t = await this.read();
            return t.done || !t.value
              ? { value: void 0, done: !0 }
              : { value: t.value, done: !1 };
          } catch {
            return { value: void 0, done: !0 };
          }
        }, "next"),
      };
    }
    async collect() {
      let t = [];
      for await (let n of this) t.push(n);
      return Buffer.concat(t);
    }
    get isDone() {
      return this._done;
    }
    get currentWindow() {
      return this._win;
    }
  };
s(I, "QwenStream");
var O = I,
  D = class D {
    constructor() {
      this._s = Array.from({ length: 32 }, () => new Map());
    }
    _sh(e) {
      return this._s[e % 32];
    }
    set(e, t) {
      this._sh(e).set(e, t);
    }
    get(e) {
      return this._sh(e).get(e);
    }
    del(e) {
      this._sh(e).delete(e);
    }
    failAll(e) {
      for (let t of this._s) {
        for (let [, n] of t)
          try {
            n.reject(e);
          } catch {}
        t.clear();
      }
    }
    get size() {
      return this._s.reduce((e, t) => e + t.size, 0);
    }
    async drain(e = 5e3) {
      let t = Date.now() + e;
      for (; Date.now() < t; ) {
        if (this.size === 0) return;
        await new Promise((n) => setTimeout(n, 5));
      }
    }
  };
s(D, "PendingMap");
var k = D,
  P = class P extends g {
    constructor(t = {}) {
      super();
      this._sock = null;
      this._buf = Buffer.alloc(0);
      this._pend = new k();
      this._strms = new Map();
      this._id = 0;
      this._closed = !1;
      this._reconn = !1;
      this._reconnAttempts = 0;
      this._met = new T();
      this._hbTimer = null;
      ((this._o = {
        host: t.host ?? "127.0.0.1",
        port: t.port ?? 9e3,
        token: t.token ?? "",
        connectTimeout: t.connectTimeout ?? 1e4,
        readTimeout: t.readTimeout ?? 6e4,
        heartbeatInterval: t.heartbeatInterval ?? 3e4,
        autoReconnect: t.autoReconnect !== !1,
        maxReconnect: t.maxReconnect ?? 10,
        reconnectBase: t.reconnectBase ?? 500,
        rateLimit: t.rateLimit ?? 0,
        defaultEncoding: t.defaultEncoding ?? m.JSON,
        tls: t.tls ?? !1,
        tlsOptions: t.tlsOptions ?? {},
      }),
        (this._auth = !this._o.token),
        (this._rl = new S(this._o.rateLimit)));
    }
    get metrics() {
      return this._met;
    }
    get isAlive() {
      return !!this._sock && this._auth && !this._closed;
    }
    get stats() {
      return this._met.snapshot();
    }
    connectSafe() {
      return new Promise((t) => {
        if (this._sock) {
          t([void 0, null]);
          return;
        }
        let n = !1,
          i = s((a) => {
            n || ((n = !0), clearTimeout(o), t(a));
          }, "settle"),
          o = setTimeout(() => {
            i([
              null,
              l(
                `[ETIMEDOUT] Connection to ${this._o.host}:${this._o.port} timed out after ${this._o.connectTimeout}ms`,
                { code: "ETIMEDOUT", host: this._o.host, port: this._o.port },
              ),
            ]);
          }, this._o.connectTimeout),
          c;
        try {
          c = Bun.connect({
            hostname: this._o.host,
            port: this._o.port,
            tls: this._o.tls ? this._o.tlsOptions : void 0,
            socket: {
              open: s(async (a) => {
                if (
                  ((this._sock = a),
                  (this._buf = Buffer.alloc(0)),
                  (this._closed = !1),
                  this._o.token)
                ) {
                  let [, u] = await b(this._doAuth());
                  if (u) {
                    (a.terminate?.(),
                      (this._sock = null),
                      i([
                        null,
                        l(
                          `[AUTH_FAIL] Authentication failed \u2014 ${u.message}`,
                          {
                            code: "AUTH_FAIL",
                            host: this._o.host,
                            port: this._o.port,
                            cause: u,
                          },
                        ),
                      ]));
                    return;
                  }
                }
                (this._startHB(),
                  this.emit("connect", `${this._o.host}:${this._o.port}`),
                  i([void 0, null]));
              }, "open"),
              data: s((a, u) => {
                this._onData(u);
              }, "data"),
              close: s((a) => {
                ((this._auth = !1), this._stopHB());
                let u = l(
                  `[CONN_CLOSED] Connection to ${this._o.host}:${this._o.port} was closed`,
                  {
                    code: "CONN_CLOSED",
                    host: this._o.host,
                    port: this._o.port,
                  },
                );
                (this._pend.failAll(u),
                  this.emit("disconnect", u),
                  !this._closed &&
                    this._o.autoReconnect &&
                    this._scheduleReconn());
              }, "close"),
              error: s((a, u) => {
                this._met.errors++;
                let f = y(this._o.host, this._o.port, u);
                (this.emit("error", f), i([null, f]));
              }, "error"),
            },
          });
        } catch (a) {
          i([null, y(this._o.host, this._o.port, a)]);
          return;
        }
        c != null &&
          typeof c.catch == "function" &&
          c.catch((a) => {
            i([null, y(this._o.host, this._o.port, a)]);
          });
      });
    }
    _doAuth() {
      let t = dt(this._o.token),
        n = this._nid();
      return new Promise((i, o) => {
        let c = setTimeout(() => {
          (this._pend.del(n),
            o(
              l("[AUTH_TIMEOUT] Authentication timed out", {
                code: "AUTH_TIMEOUT",
              }),
            ));
        }, this._o.connectTimeout);
        (this._pend.set(n, {
          resolve: s((a) => {
            (clearTimeout(c),
              a.type === h.AuthOK
                ? ((this._auth = !0), this.emit("authok"), i())
                : o(
                    l(`[AUTH_REJECTED] ${a.body.toString()}`, {
                      code: "AUTH_REJECTED",
                    }),
                  ));
          }, "resolve"),
          reject: s((a) => {
            (clearTimeout(c), o(a));
          }, "reject"),
          startAt: Date.now(),
        }),
          this._write(
            w({
              type: h.Auth,
              requestID: n,
              body: Buffer.from(t),
              encoding: m.JSON,
              flags: at.High,
            }),
          ));
      });
    }
    _nid() {
      return ((this._id = (this._id + 1) & 4294967295), this._id);
    }
    _write(t) {
      if (this._sock)
        try {
          (this._sock.write(t),
            this._met.framesSent++,
            (this._met.bytesSent += t.length));
        } catch (n) {
          (this._met.errors++, this.emit("error", n));
        }
    }
    _onData(t) {
      for (
        this._buf = Buffer.concat([this._buf, Buffer.from(t)]);
        this._buf.length >= E;
      ) {
        let n = this._buf.readUInt32BE(16),
          i = E + n;
        if (this._buf.length < i) break;
        let o = this._buf.subarray(0, i);
        this._buf = this._buf.subarray(i);
        let c;
        try {
          c = ft(o);
        } catch (a) {
          (this._met.errors++, this.emit("error", a));
          continue;
        }
        (this._met.framesRecv++,
          (this._met.bytesRecv += i),
          this.emit("frame", c),
          this._dispatch(c));
      }
    }
    _dispatch(t) {
      switch (t.type) {
        case h.Response:
        case h.Error:
        case h.AuthOK:
        case h.AuthFail: {
          let n = this._pend.get(t.requestID);
          if (!n) break;
          (n.startAt &&
            this._met.latency.observe((Date.now() - n.startAt) * 1e6),
            this._pend.del(t.requestID),
            n.resolve(t));
          break;
        }
        case h.Stream:
          this._dispatchStream(t.requestID, t.body, t.encoding, !1);
          break;
        case h.StreamEnd:
          this._dispatchStream(t.requestID, t.body, t.encoding, !0);
          break;
        case h.StreamAck:
          this._strms.get(t.requestID)?._ackChunk();
          break;
        case h.Heartbeat:
          this._write(w({ type: h.Heartbeat, requestID: t.requestID }));
          break;
      }
    }
    async _dispatchStream(t, n, i, o) {
      let c = this._strms.get(t);
      if (!c) return;
      if (o) {
        (c._close(), this._strms.delete(t));
        return;
      }
      let [a, u] = await b(z(n, i));
      if (u) {
        (this._met.errors++, c._close(u));
        return;
      }
      (c._push(a), this._write(w({ type: h.StreamAck, requestID: t })));
    }
    _startHB() {
      (this._stopHB(),
        (this._hbTimer = setInterval(() => {
          this.isAlive &&
            this._write(w({ type: h.Heartbeat, requestID: this._nid() }));
        }, this._o.heartbeatInterval)));
    }
    _stopHB() {
      this._hbTimer && (clearInterval(this._hbTimer), (this._hbTimer = null));
    }
    async _scheduleReconn() {
      if (this._reconn || this._closed) return;
      this._reconn = !0;
      let t = this._o.reconnectBase;
      for (; !this._closed; ) {
        if (
          this._o.maxReconnect > 0 &&
          this._reconnAttempts >= this._o.maxReconnect
        ) {
          (this.emit(
            "error",
            l(
              `[MAX_RECONNECT] Maximum reconnect attempts reached (${this._o.maxReconnect})`,
              { code: "MAX_RECONNECT" },
            ),
          ),
            (this._reconn = !1));
          return;
        }
        (this._reconnAttempts++,
          await new Promise((i) => setTimeout(i, t + Math.random() * t * 0.5)),
          (this._sock = null),
          (this._buf = Buffer.alloc(0)),
          (this._auth = !this._o.token));
        let [, n] = await this.connectSafe();
        if (!n) {
          (this._met.reconnectCount++,
            (this._reconnAttempts = 0),
            (this._reconn = !1));
          return;
        }
        (this.emit(
          "error",
          l(
            `[RECONNECT_FAIL] Reconnect attempt #${this._reconnAttempts} failed: ${n.message}`,
            { code: "RECONNECT_FAIL", cause: n },
          ),
        ),
          (t = Math.min(t * 2, 3e4)));
      }
      this._reconn = !1;
    }
    async send(t, n) {
      if (!this.isAlive)
        return [
          null,
          l("[NOT_CONNECTED] Client is not connected", {
            code: "NOT_CONNECTED",
          }),
        ];
      n ?? (n = this._o.defaultEncoding);
      let [i, o] = await b(J(j(t, n), n));
      return o
        ? [null, o]
        : (this._write(
            w({
              type: h.Data,
              requestID: this._nid(),
              body: i.data,
              encoding: i.encoding,
            }),
          ),
          [void 0, null]);
    }
    sendJSON(t) {
      return this.send(t, m.JSON);
    }
    async request(t, n, i) {
      if (this._closed)
        return [
          null,
          l("[CONN_CLOSED] Connection is closed", { code: "CONN_CLOSED" }),
        ];
      if (!this.isAlive)
        return [
          null,
          l("[NOT_CONNECTED] Client is not connected", {
            code: "NOT_CONNECTED",
          }),
        ];
      if (!this._rl.allow())
        return (
          this._met.droppedFrames++,
          [
            null,
            l("[RATE_LIMIT] Request rate limit exceeded", {
              code: "RATE_LIMIT",
            }),
          ]
        );
      n ?? (n = this._o.defaultEncoding);
      let o = this._nid(),
        c = Date.now();
      return (
        this._met.activeRequests++,
        new Promise(async (a) => {
          let u = !1,
            f = s((_) => {
              u || ((u = !0), a(_));
            }, "fin"),
            v = s(() => {
              (this._pend.del(o),
                this._met.activeRequests--,
                f([
                  null,
                  l("[ABORTED] Request was aborted", { code: "ABORTED" }),
                ]));
            }, "onAbort");
          if (i) {
            if (i.aborted)
              return (
                this._met.activeRequests--,
                f([
                  null,
                  l("[ABORTED] Request was aborted", { code: "ABORTED" }),
                ])
              );
            i.addEventListener("abort", v, { once: !0 });
          }
          this._pend.set(o, {
            resolve: s(async (_) => {
              if (
                (i?.removeEventListener("abort", v),
                this._met.activeRequests--,
                this._met.latency.observe((Date.now() - c) * 1e6),
                _.type === h.Error)
              )
                return (
                  this._met.errors++,
                  f([
                    null,
                    l(`[SERVER_ERROR] ${_.body.toString()}`, {
                      code: "SERVER_ERROR",
                    }),
                  ])
                );
              let [et, H] = await b(z(_.body, _.encoding));
              f(H ? [null, H] : [{ body: et, encoding: _.encoding }, null]);
            }, "resolve"),
            reject: s((_) => {
              (i?.removeEventListener("abort", v),
                this._met.activeRequests--,
                f([null, _]));
            }, "reject"),
            startAt: c,
          });
          let [M, $] = await b(J(j(t, n), n));
          if ($) return (this._pend.del(o), f([null, $]));
          this._write(
            w({
              type: h.Request,
              requestID: o,
              body: M.data,
              encoding: M.encoding,
            }),
          );
        })
      );
    }
    async requestJSON(t, n) {
      let [i, o] = await this.request(t, m.JSON, n);
      if (o) return [null, o];
      let [c, a] = st(() => JSON.parse(i.body.toString()));
      return a
        ? [null, l(`[PARSE_ERROR] ${a.message}`, { code: "PARSE_ERROR" })]
        : [c, null];
    }
    async openStream() {
      if (!this.isAlive)
        return [
          null,
          l("[NOT_CONNECTED] Client is not connected", {
            code: "NOT_CONNECTED",
          }),
        ];
      let t = this._nid(),
        n = new O(t, this._met);
      return (
        this._strms.set(t, n),
        this._write(w({ type: h.Stream, requestID: t })),
        [n, null]
      );
    }
    async closeSafe() {
      if (this._closed) return [void 0, null];
      ((this._closed = !0),
        this._stopHB(),
        (this._auth = !1),
        this._pend.failAll(
          l("[CONN_CLOSED] Connection is closed", { code: "CONN_CLOSED" }),
        ));
      for (let [, t] of this._strms) t._close(new Error("Connection closed"));
      this._strms.clear();
      try {
        this._sock?.terminate?.();
      } catch {}
      return ((this._sock = null), [void 0, null]);
    }
    async close() {
      await this.closeSafe();
    }
    async gracefulClose(t = 5e3) {
      return (await this._pend.drain(t), this.closeSafe());
    }
  };
s(P, "QwenClient");
var C = P;
function j(r, e) {
  return Buffer.isBuffer(r)
    ? r
    : typeof r == "string"
      ? Buffer.from(r, "utf8")
      : e === m.JSON
        ? Buffer.from(JSON.stringify(r), "utf8")
        : Buffer.from(String(r), "utf8");
}
s(j, "_ser");
async function tt(r) {
  let e = new C(r),
    [, t] = await e.connectSafe();
  return t ? [null, t] : [e, null];
}
s(tt, "connectSafe");
var U = Symbol("TioError");
function L(r) {
  return typeof r == "object" && r !== null && r[U] === !0;
}
s(L, "isTioError");
function q(r) {
  return { _id: Symbol(), message: r, [U]: !0 };
}
s(q, "newError");
function mt(r, e) {
  return L(r) ? r._id === e._id : !1;
}
s(mt, "isError");
function _t(r, e) {
  return { _id: r._id, message: `${e}: ${r.message}`, [U]: !0, _cause: r };
}
s(_t, "wrapError");
function pt(r) {
  return r._cause ?? null;
}
s(pt, "unwrapError");
function wt(r) {
  return L(r) ? r : r instanceof Error ? q(r.message) : q(String(r));
}
s(wt, "fromUnknown");
function Et(r) {
  return L(r);
}
s(Et, "checkIsError");
function bt(r) {
  return `[TioError] ${r.message}`;
}
s(bt, "toString");
var d = {
  new: q,
  is: mt,
  wrap: _t,
  unwrap: pt,
  check: Et,
  string: bt,
  from: wt,
};
var p = class p {
  constructor(e, t, n) {
    this.connection = null;
    this.connecting = null;
    ((this.host = e),
      (this.port = t),
      (this.token = n),
      (this.connection_error = d.new(
        `connection to hyperx://${e}:${t} failed`,
      )));
  }
  static create(e, t) {
    if (!e.startsWith("hyperx://")) return [null, this.protocol_error];
    let n = e.slice(9);
    if (!n) return [null, this.empty_host_error];
    if ((n.match(/:/g) || []).length > 1) return [null, this.invalid_url_error];
    let o = n.split(":");
    if (!o[0]) return [null, this.missing_host_error];
    let c = o[0],
      a = null;
    if (o.length === 2) {
      let u = Number(o[1]);
      if (Number.isNaN(u) || !Number.isInteger(u) || u <= 0 || u > 65535)
        return [null, this.invalid_port_error];
      a = u;
    }
    return [new p(c, a, t), null];
  }
  async getClient() {
    return this.connection
      ? [this.connection, null]
      : this.connecting
        ? this.connecting
        : ((this.connecting = tt({
            host: this.host,
            port: this.port ?? 4636,
            token: this.token,
            heartbeatInterval: 3e4,
            autoReconnect: !0,
            maxReconnect: 10,
            reconnectBase: 500,
          }).then((e) => {
            this.connecting = null;
            let [t, n] = e;
            return n
              ? [null, this.connection_error]
              : ((this.connection = t), [t, null]);
          })),
          this.connecting);
  }
  async SET(e, t, n = 0) {
    let [i, o] = await this.getClient();
    if (o) return [null, o];
    let [c, a] = await i.requestJSON({
      action: "ADD",
      data: { id_data: e, expired: n, record: { ...t } },
    });
    return a ? [null, d.from(a)] : [c, null];
  }
  async GET(e) {
    let [t, n] = await this.getClient();
    if (n) return [null, n];
    let [i, o] = await t.requestJSON({ action: "GET", data: { id_data: e } });
    return o ? [null, d.from(o)] : [i, null];
  }
  async DELETE(e) {
    let [t, n] = await this.getClient();
    if (n) return [null, n];
    let [i, o] = await t.requestJSON({
      action: "DELETE",
      data: { id_data: e },
    });
    return o ? [null, d.from(o)] : [i, null];
  }
  async FLUSH() {
    let [e, t] = await this.getClient();
    if (t) return [null, t];
    let [n, i] = await e.requestJSON({ action: "FLUSH" });
    return i ? [null, d.from(i)] : [n, null];
  }
  async HEALTH() {
    let [e, t] = await this.getClient();
    if (t) return [null, t];
    let [n, i] = await e.requestJSON({ action: "HEALTH" });
    return i ? [null, d.from(i)] : [n, null];
  }
  async disconnect() {
    if (!this.connection) return [void 0, null];
    let [, e] = await this.connection.closeSafe();
    return ((this.connection = null), e ? [null, d.from(e)] : [void 0, null]);
  }
};
(s(p, "Hyperx"),
  (p.protocol_error = d.new(
    "[INVALID_PROTOCOL] URL must start with 'hyperx://'",
  )),
  (p.empty_host_error = d.new("[EMPTY_HOST] Host is empty after protocol")),
  (p.invalid_url_error = d.new("[INVALID_URL] Too many ':' characters in URL")),
  (p.missing_host_error = d.new("[MISSING_HOST] Host is missing in URL")),
  (p.invalid_port_error = d.new(
    "[INVALID_PORT] Port must be an integer between 1 and 65535",
  )));
var F = p;
export { F as default };
