declare const TAG: unique symbol;
export interface TioError {
    readonly _id: symbol;
    readonly message: string;
    readonly [TAG]: true;
}
declare function newError(message: string): TioError;
declare function isError(val: unknown, target: TioError): boolean;
declare function wrapError(cause: TioError, message: string): TioError & {
    _cause: TioError;
};
declare function unwrapError(err: TioError): TioError | null;
declare function fromUnknown(err: unknown): TioError;
declare function checkIsError(val: unknown): val is TioError;
declare function toString(err: TioError): string;
export declare const error: {
    readonly new: typeof newError;
    readonly is: typeof isError;
    readonly wrap: typeof wrapError;
    readonly unwrap: typeof unwrapError;
    readonly check: typeof checkIsError;
    readonly string: typeof toString;
    readonly from: typeof fromUnknown;
};
export {};
//# sourceMappingURL=error.d.ts.map