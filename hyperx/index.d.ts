import { type TioError } from "./util/error";
export type Result<T> = [value: T, err: null] | [value: null, err: TioError];
export default class Hyperx {
    private host;
    private port;
    private token;
    private connection;
    private connecting;
    connection_error: TioError;
    static protocol_error: TioError;
    static empty_host_error: TioError;
    static invalid_url_error: TioError;
    static missing_host_error: TioError;
    static invalid_port_error: TioError;
    private constructor();
    static create(rawUrl: string, token: string): Result<Hyperx>;
    private getClient;
    SET(id_data: string, data: Record<string, unknown>, expired?: number): Promise<Result<unknown>>;
    GET(id_data: string): Promise<Result<unknown>>;
    DELETE(id_data: string): Promise<Result<unknown>>;
    FLUSH(): Promise<Result<unknown>>;
    HEALTH(): Promise<Result<unknown>>;
    disconnect(): Promise<Result<void>>;
}
//# sourceMappingURL=index.d.ts.map