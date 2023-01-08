const { DashError } = require("./DashError.js");
const { getCurrentVersion } = require("./VersionHandler.js");
const { getApi } = require("./ApiHandler.js");

class dash {
	constructor(auth) {
		(async () => {
			if (!auth.hasOwnProperty("user_hash") || !auth.hasOwnProperty("xsts_token")) {
				throw new DashError(DashError.InvalidAuthorization);
			}
			this.userHash = auth.user_hash;
			this.xstsToken = auth.xsts_token;
			await getApi("/mco/client/compatible", this)
			try { await getApi("/mco/client/compatible", this) } catch { throw new DashError(DashError.InvalidAuthorization); }
			this.currentVersion = await getCurrentVersion();
		}) ();
	}

	async clientCompatible(clientVersion = undefined) {
		if (typeof(clientVersion) !== "string" && clientVersion != undefined) {
			throw new TypeError(`Unexpected type passed to function`);
		}
		if (clientVersion === undefined) { clientVersion = await getCurrentVersion(); };
		var clientHeaders = {"client-version": clientVersion};
		var response = await getApi("/mco/client/compatible", this, clientHeaders);
		switch (await response.text()) {
			case "COMPATIBLE":
				return true;
			case "OUTDATED":
				return false;
			default:
				throw new DashError(DashError.UnexpectedResult);;
		}
	}

	async getRealms() {
		var response = await (await getApi("/worlds", this)).json();
		if (!response.hasOwnProperty("servers")) {
			throw new DashError(`Invalid property: object does not have a property with the name "servers"`);
		}
		try { return await response["servers"]; } catch { throw new DashError(DashError.UnexpectedResult); }
	}
}

module.exports = { dash };