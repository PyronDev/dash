declare class DashError extends Error {
    errorCode?: string;
    date: Date;
    constructor(message: string, errorCode?: number, ...params: any[]);
    static get UnexpectedError(): string;
    static get UnexpectedResult(): string;
    static get InvalidAuthorization(): string;
}
export { DashError };
