class DashError extends Error {
	date: Date;
	statusCode?: number | null;
	constructor(message: string, statusCode?: number, ...params: any[]) {
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

export { DashError };