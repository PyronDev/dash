"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashError = void 0;
class DashError extends Error {
    constructor(message, statusCode, ...params) {
        super(...params);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DashError);
        }
        this.name = "DashError";
        this.message = message;
        this.date = new Date();
        this.statusCode = statusCode || null;
    }
    static get UnexpectedError() {
        return "An unexpected error occurred, this is usually because the authentication is invalid";
    }
    static get UnexpectedResult() {
        return "An unexpected result was received, this is usually because the authentication is invalid";
    }
    static get InvalidAuthorization() {
        return "Invalid authorization: check your credentials or 2FA is enabled";
    }
}
exports.DashError = DashError;
