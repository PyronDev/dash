const axios = require('axios');

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
		return "Invalid authorization: check your credentials";
	}
}

async function getCurrentVersion() { return (await axios.get("https://raw.githubusercontent.com/MCMrARM/mc-w10-versiondb/master/versions.json.min")).data.reverse().find(array => array[2] === 0)[0] };
async function getApi(path, dashClass, headers = undefined) {
	if (headers === undefined) {
		headers = {'authorization': `XBL3.0 x=${dashClass.userHash};${dashClass.xstsToken}`,'client-version': await getCurrentVersion(),'user-agent': 'MCPE/UWP',}
	}
	try{ return await axios.get(`https://pocket.realms.minecraft.net${path}`, { 'headers': headers }); } catch { throw new DashError(DashError.UnexpectedError);; };
}
class dash {
	constructor(auth) {
		(async () => {
			if (!auth.hasOwnProperty("user_hash") || !auth.hasOwnProperty("xsts_token")) {
				throw new DashError(DashError.InvalidAuthorization);
			}
			this.userHash = auth.user_hash;
			this.xstsToken = auth.xsts_token;
			try { await getApi("", this) } catch { throw new DashError(DashError.InvalidAuthorization); }
			this.currentVersion = await getCurrentVersion();
		}) ();
	}

	async clientCompatible(clientVersion = this.currentVersion) {
		if (typeof(clientVersion) !== "string") {
			throw new TypeError(`Unexpected type passed to function`);
		}
		clientVersion = await getCurrentVersion();
		var response = await getApi('/mco/client/compatible', this);
		switch (response.data) {
			case "COMPATIBLE":
				return true;
			case "OUTDATED":
				return false;
			default:
				throw new DashError(DashError.UnexpectedResult);;
		}
	}

	async getWorlds(clientVersion = this.currentVersion) {
		if (typeof(clientVersion) !== "string") {
			throw new TypeError(`Unexpected type passed to function`);
		}
		clientVersion = await getCurrentVersion();
		var response = await getApi('/worlds', this);
		if (!response.data.hasOwnProperty("servers")) {
			throw new DashError(`Invalid property: object does not have a property with the name 'servers'`);
		}
		try { return response.data["servers"]; } catch { throw new DashError(DashError.UnexpectedResult); }
	}
}

module.exports = { dash };