class DashError extends Error {
	constructor(message, ...params) {
		super(...params);
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, DashError);
		}
		this.name = "DashError";
		this.message = message;
		this.date = new Date();
	}
	static get UnexpectedError () {
		return "An unexpected error occured, this is usually because the authentication is invalid";
	}
	static get UnexpectedResult () {
		return "An unexpected result was recieved, this is usually because the authentication is invalid";
	}
	static get InvalidAuthorization () {
		return "Invalid authorization: check your credentials or 2FA is enabled";
	}
}

module.exports = { DashError }