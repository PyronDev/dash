declare class DashError extends Error {
    date: Date;
    statusCode?: number | null;
    constructor(message: string, statusCode?: number, ...params: any[]);
    static get UnexpectedError(): string;
    static get UnexpectedResult(): string;
    static get InvalidAuthorization(): string;
}
export { DashError };
