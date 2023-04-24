class DashError extends Error {
	errorID?: string;
	date: Date;
	statusCode?: number;
	constructor(message: string, errorID?: number, ...params: any[]) {
		super(...params);
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, DashError);
		}
		this.name = "DashError";
		this.message = message;
		if (errorID) {
			this.errorID = "0x" + errorID.toString(16).toUpperCase();
		}
		this.date = new Date();
		this.statusCode = Number.parseInt(message.split('Status code: ')[1]);
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

export { DashError };