declare class DashError extends Error {
    errorID?: string;
    date: Date;
    statusCode?: number;
    constructor(message: string, errorID?: number, ...params: any[]);
    static get UnexpectedError(): string;
    static get UnexpectedResult(): string;
    static get InvalidAuthorization(): string;
}
export { DashError };
