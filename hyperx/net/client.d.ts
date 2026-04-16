/**
 * QwenTCP Client v3 — PATCHED for Bun v1.3.x Windows
 *
 * Root fix: Bun.connect() on Windows throws "Failed to connect / ECONNREFUSED"
 * as a synchronous throw or rejected promise BEFORE the socket.error callback
 * is called. Solution: wrap Bun.connect() in try/catch + catch the .catch()
 * on its return value, with a `settled` guard so resolve is only called once.
 */
export type Result<T> = [value: T, err: null] | [value: null, err: Error];
export declare function tryAsync<T>(promise: Promise<T>): Promise<Result<T>>;
export declare function trySync<T>(fn: () => T): Result<T>;
export interface QwenError extends Error {
    code?: string;
    errno?: number;
    syscall?: string;
    host?: string;
    port?: number;
}
export declare const FrameMagic = 1364673870;
export declare const ProtoVersion = 3;
export declare const FrameType: Readonly<{
    readonly Data: 1;
    readonly Request: 2;
    readonly Response: 3;
    readonly Stream: 4;
    readonly StreamEnd: 5;
    readonly Heartbeat: 6;
    readonly Error: 7;
    readonly Ack: 8;
    readonly Auth: 9;
    readonly AuthOK: 10;
    readonly AuthFail: 11;
    readonly StreamAck: 12;
}>;
export declare const Encoding: Readonly<{
    readonly Raw: 0;
    readonly JSON: 1;
    readonly Gzip: 2;
    readonly Bin: 3;
}>;
export declare const Priority: Readonly<{
    readonly Normal: 0;
    readonly High: 1;
}>;
export type FrameTypeValue = (typeof FrameType)[keyof typeof FrameType];
export type EncodingValue = (typeof Encoding)[keyof typeof Encoding];
export type PriorityValue = (typeof Priority)[keyof typeof Priority];
export interface DecodedFrame {
    magic: number;
    version: number;
    type: FrameTypeValue;
    encoding: EncodingValue;
    flags: number;
    requestID: number;
    body: Buffer;
}
export interface EncodeFrameInput {
    type: FrameTypeValue;
    requestID: number | bigint;
    body?: Buffer;
    encoding?: EncodingValue;
    flags?: number;
}
export interface AuthPayload {
    nonce: string;
    ts: number;
    sig: string;
}
export declare function encodeFrame({ type, requestID, body, encoding, flags }: EncodeFrameInput): Buffer;
export declare function decodeFrame(buf: Buffer): DecodedFrame;
export declare function buildAuthPayload(token: string): string;
export declare function verifyAuthPayload(data: string, token: string): void;
export interface LatencySnapshot {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
    total: number;
}
export interface MetricsSnapshot {
    framesSent: number;
    framesRecv: number;
    bytesSent: number;
    bytesRecv: number;
    errors: number;
    activeRequests: number;
    activeStreams: number;
    reconnectCount: number;
    droppedFrames: number;
    latency: LatencySnapshot;
}
export declare class LatencyHistogram {
    private readonly b;
    private readonly c;
    total: number;
    private sum;
    observe(ns: number): void;
    percentile(p: number): number;
    avg(): number;
    snapshot(): LatencySnapshot;
}
export declare class Metrics {
    framesSent: number;
    framesRecv: number;
    bytesSent: number;
    bytesRecv: number;
    errors: number;
    activeRequests: number;
    activeStreams: number;
    reconnectCount: number;
    droppedFrames: number;
    latency: LatencyHistogram;
    snapshot(): MetricsSnapshot;
}
export declare class RateLimiter {
    private u;
    private cap;
    private tok;
    private rate;
    private last;
    constructor(rps: number);
    allow(): boolean;
}
type Fn = (...a: unknown[]) => void;
declare class EventEmitter {
    private _l;
    on(e: string, f: Fn): this;
    off(e: string, f: Fn): this;
    once(e: string, f: Fn): this;
    emit(e: string, ...a: unknown[]): void;
}
interface SR {
    value: Buffer | null;
    done: boolean;
    error?: Error;
}
export declare class QwenStream extends EventEmitter {
    readonly id: number;
    private _m;
    private _q;
    private _w;
    private _done;
    private _win;
    private _ack;
    constructor(id: number, m: Metrics);
    _push(c: Buffer): void;
    _close(err?: Error | null): void;
    _ackChunk(): void;
    read(): Promise<SR>;
    [Symbol.asyncIterator](): AsyncIterator<Buffer>;
    collect(): Promise<Buffer>;
    get isDone(): boolean;
    get currentWindow(): number;
}
export interface QwenClientOptions {
    host?: string;
    port?: number;
    token?: string;
    connectTimeout?: number;
    readTimeout?: number;
    heartbeatInterval?: number;
    autoReconnect?: boolean;
    maxReconnect?: number;
    reconnectBase?: number;
    rateLimit?: number;
    defaultEncoding?: EncodingValue;
    tls?: boolean;
    tlsOptions?: Record<string, unknown>;
}
export interface RequestResult {
    body: Buffer;
    encoding: EncodingValue;
}
export declare class QwenClient extends EventEmitter {
    private _o;
    private _sock;
    private _buf;
    private _pend;
    private _strms;
    private _id;
    private _auth;
    private _closed;
    private _reconn;
    private _reconnAttempts;
    private _met;
    private _rl;
    private _hbTimer;
    constructor(o?: QwenClientOptions);
    get metrics(): Metrics;
    get isAlive(): boolean;
    get stats(): MetricsSnapshot;
    connectSafe(): Promise<Result<void>>;
    private _doAuth;
    private _nid;
    private _write;
    private _onData;
    private _dispatch;
    private _dispatchStream;
    private _startHB;
    private _stopHB;
    private _scheduleReconn;
    send(data: Buffer | string | object, enc?: EncodingValue): Promise<Result<void>>;
    sendJSON(o: object): Promise<Result<void>>;
    request(data: Buffer | string | object, enc?: EncodingValue, signal?: AbortSignal): Promise<Result<RequestResult>>;
    requestJSON(req: object, signal?: AbortSignal): Promise<Result<unknown>>;
    openStream(): Promise<Result<QwenStream>>;
    closeSafe(): Promise<Result<void>>;
    close(): Promise<void>;
    gracefulClose(ms?: number): Promise<Result<void>>;
}
export interface QwenPoolOptions extends QwenClientOptions {
    min?: number;
    max?: number;
}
export interface PoolStats {
    total: number;
    active: number;
    idle: number;
}
export declare class QwenPool extends EventEmitter {
    private _o;
    private _min;
    private _max;
    private _idle;
    private _act;
    private _tot;
    private _wait;
    private _closed;
    constructor(o?: QwenPoolOptions);
    initialize(): Promise<Result<this>>;
    private _create;
    acquire(signal?: AbortSignal): Promise<Result<QwenPoolConn>>;
    _release(c: QwenClient): void;
    use<T>(fn: (c: QwenClient) => Promise<Result<T>>, signal?: AbortSignal): Promise<Result<T>>;
    get poolStats(): PoolStats;
    close(): Promise<void>;
}
export declare class QwenPoolConn {
    readonly conn: QwenClient;
    private _p;
    private _rel;
    constructor(c: QwenClient, p: QwenPool);
    release(): void;
}
export declare function connectSafe(o: QwenClientOptions): Promise<Result<QwenClient>>;
export declare function connect(o: QwenClientOptions): Promise<QwenClient>;
export declare function createPool(o: QwenPoolOptions): Promise<Result<QwenPool>>;
declare const _default: {
    QwenClient: typeof QwenClient;
    QwenPool: typeof QwenPool;
    QwenPoolConn: typeof QwenPoolConn;
    QwenStream: typeof QwenStream;
    LatencyHistogram: typeof LatencyHistogram;
    Metrics: typeof Metrics;
    RateLimiter: typeof RateLimiter;
    connect: typeof connect;
    connectSafe: typeof connectSafe;
    createPool: typeof createPool;
    encodeFrame: typeof encodeFrame;
    decodeFrame: typeof decodeFrame;
    buildAuthPayload: typeof buildAuthPayload;
    verifyAuthPayload: typeof verifyAuthPayload;
    tryAsync: typeof tryAsync;
    trySync: typeof trySync;
    FrameType: Readonly<{
        readonly Data: 1;
        readonly Request: 2;
        readonly Response: 3;
        readonly Stream: 4;
        readonly StreamEnd: 5;
        readonly Heartbeat: 6;
        readonly Error: 7;
        readonly Ack: 8;
        readonly Auth: 9;
        readonly AuthOK: 10;
        readonly AuthFail: 11;
        readonly StreamAck: 12;
    }>;
    Encoding: Readonly<{
        readonly Raw: 0;
        readonly JSON: 1;
        readonly Gzip: 2;
        readonly Bin: 3;
    }>;
    Priority: Readonly<{
        readonly Normal: 0;
        readonly High: 1;
    }>;
    FrameMagic: number;
    ProtoVersion: number;
};
export default _default;
//# sourceMappingURL=client.d.ts.map