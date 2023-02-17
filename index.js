const { DashError } = require("./DashError.js");
const { getCurrentVersion } = require("./VersionHandler.js");
const { getApi, postApi } = require("./ApiHandler.js");
const { requiredParams } = require("./ParamHandler.js");
const { checkPermission } = require("./PermissionHandler.js");

const authentiactingProperties = [
	"userHash",
	"xstsToken",
	"realmID",
	"owner"
]

class dash {
	constructor(auth) {
		(async () => {
			if (!auth.hasOwnProperty("user_hash") || !auth.hasOwnProperty("xsts_token")) {
				throw new DashError(DashError.InvalidAuthorization);
			}
			this.userHash = auth.user_hash;
			this.xstsToken = auth.xsts_token;
			try { await getApi("/mco/client/compatible", this) } catch { throw new DashError(DashError.InvalidAuthorization); }
			this.currentVersion = await getCurrentVersion();
		}) ();
	}
	// GET REQUESTS //

	async getAccountRealms() {
		await requiredParams(arguments, []);
		var response = await getApi(`/activities/live/players`, this);
		var responseJson = await response.json();
		switch (response.status){
			case 200:
				if (!responseJson.hasOwnProperty("servers")) {
					throw new DashError(`Invalid property: object does not have a property with the name "servers"`);
				}
				return responseJson["servers"];
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async getRealmBlocklist(realmID) {
		await requiredParams(arguments, [Number]);
		var response = await getApi(`/worlds/${realmID}/blocklist`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist");
			case 403:
				throw new DashError("You do not have access to that realm");
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	
	async accountAcceptInvite(realmInvite) {
		await requiredParams(arguments, [String]);
		var response = await getApi(`/invites/v1/link/accept/${realmInvite}`, this);
		switch (response.status){
			case 403:
				throw new DashError("That realm doesnt exist or you are the owner of it");
			case 200:
				return response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	// POST REQUESTS //
	async realmBlockUser(realmID, userXUID) {
		await requiredParams(arguments, [Number, Number]);
		var response = await postApi(`/worlds/${realmID}/blocklist/${userXUID}`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist");
			case 403:
				throw new DashError("You do not have access to that realm");
			case 204:
				return;
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async realmUpdateConfiguration(realmID, realmConfiguration) {
		await requiredParams(arguments, [Number, JSON]);
		var response = await postApi(`/worlds/${realmID}/configuration`, this, realmConfiguration);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist");
			case 403:
				throw new DashError("You do not have access to that realm");
			case 204:
				return;
			case 400:
				throw new DashError(`Configuration formatted incorrectly \nStatus code: ${await response.status}`);
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async realmInviteUser(realmID, userXUID) {
		await requiredParams(arguments, [Number, Number]);
		var response = await postApi(`/worlds/${realmID}/configuration`, this, {"invites": {[userXUID]: "ADD"}});
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist");
			case 403:
				throw new DashError("You do not have access to that realm");
			case 204:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}
	async realm(realmID){
		await requiredParams(arguments, [Number]);
		return realm.fromID(this, realmID)
	}
	async realmFromInvite(realmInvite){
		await requiredParams(arguments, [String]);
		return await realm.fromInvite(this, realmInvite)
	}
	async client() {
		await requiredParams(arguments, []);
		return new client(this);
	}
}

class realm {
	static async fromID(dash, realmID) {
		var Realm = new realm();
		Realm.userHash = dash.userHash;
		Realm.xstsToken = dash.xstsToken;
		var response = await getApi(`/worlds/${realmID}`, dash);
		switch (response.status){
			case 404:
				throw new DashError("That realm id doesnt exist");
			case 403:
				Realm.owner = false;
				var response = await (await getApi("/worlds", dash)).json();
				var realms = response["servers"];
				var matchingRealms = realms.filter(e => e["id"] === realmID);
				if (matchingRealms.length === 1) {
					Realm.realmID = realmID;
				}
				break;
			case 200:
				Realm.dash = dash;
				Realm.realmID = realmID;
				Realm.owner = true;
				break;
			default:
				throw new DashError(`An unknown status code was returned, this is usually because the realmID was invalid. Status code: ${response.status}`);
		}
		return Realm;
	}

	static async fromInvite(dash, realmInvite) {
		var Realm = new realm();
		var response = await getApi(`/worlds/v1/link/${realmInvite}`, dash);
		switch (response.status){
			case 404:
			case 403:
				throw new DashError("That realm invite doesnt exist");
			case 200:
				Realm.userHash = dash.userHash;
				Realm.xstsToken = dash.xstsToken;
				Realm.dash = dash;
				Realm.realmID = (await response.json())["id"];
				var response = await getApi(`/worlds/${Realm.realmID}`, dash);
				switch (response.status) {
					case 404:
					case 403:
						Realm.owner = false;
						break;
					case 200:
						Realm.owner = true;
						break;
				}
				break;
			default:
				throw new DashError(`An unknown status code was returned, this is usually because the realm invite was invalid. Status code: ${response.status}`);
		}
		return Realm;
	}
	// GET REQUESTS //
	async info() {
		await requiredParams(arguments, []);
		if (this.owner) {
			var response = await getApi(`/worlds/${this.realmID}`, this);
			switch (response.status){
				case 404:
					throw new DashError("That realm doesnt exist");
				case 200:
					return await response.json();
			}
		} else {
			var response = await (await getApi("/worlds", this)).json();
			var realms = response["servers"];
			var matchingRealms = realms.filter(e => e["id"] === this.realmID);
			return matchingRealms[0];

		}
	}

	async address() {
		await requiredParams(arguments, []);
		var response = await getApi(`/worlds/${this.realmID}/join`, this, {}, {}, 5);
		switch (response.status){
			case 403:
				throw new DashError("You do not have access to join that realm");
			case 404:
				throw new DashError("That realm doesnt exist");
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}
	async players() { // this method is very unstable, not my fault, mojangs.
		await requiredParams(arguments, []);
		var response = await getApi(`/activities/live/players`, this);
		var responseJson = await response.json();
		switch (response.status){
			case 200:
				if (!responseJson.hasOwnProperty(this.realmID)) {
					return { "id": this.realmID, "players": [], "full": false };
				}
				return responseJson["servers"];
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}
	// OWNER ONLY METHODS //
	async content() {
		await requiredParams(arguments, []);
		await checkPermission(this);
		var response = await getApi(`/world/${this.realmID}/content`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it");
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async subscription() {
		await requiredParams(arguments, []);
		await checkPermission(this);
		var response = await getApi(`/subscriptions/${this.realmID}/details`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it");
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async backups() {
		await requiredParams(arguments, []);
		await checkPermission(this);
		var response = await getApi(`/worlds/${this.realmID}/backups`, this);
		var responseJson = await response.json()
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it");
			case 200:
				if (!responseJson.hasOwnProperty("backups")) {
					throw new DashError(`Invalid property: object does not have a property with the name "backups"`);
				}
				return new backup(this, await responseJson["backups"], this.#latestBackupDetails, this.#fetchBackup)
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async #fetchBackup(backupID) {
		await requiredParams(arguments, [String]);
		await checkPermission(this);
		var response = await getApi(`/archive/download/world/${this.realmID}/1/${backupID}`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it");
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async #latestBackupDetails() {
		await requiredParams(arguments, []);
		await checkPermission(this);
		var response = await getApi(`/archive/download/world/${this.realmID}/1/latest`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it");
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async invite() {
		await requiredParams(arguments, []);
		var response = await getApi(`/links/v1?worldId=${this.realmID}`, this);
		var responseJson = await response.json();
		switch (response.status){
			case 403:
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it");
			case 200:
				return await responseJson[0];
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}
}

class client {
	constructor(dash) {
		(async () => {
			this.userHash = dash.userHash;
			this.xstsToken = dash.xstsToken;
			try { 
				await getApi("/mco/client/compatible", this)
		 } catch { throw new DashError(DashError.InvalidAuthorization); }
			this.currentVersion = await getCurrentVersion();
		}) ();
	}

	// GET REQUESTS //
	async compatible(clientVersion = undefined) {
		if (typeof(clientVersion) !== "number" && clientVersion != undefined) {
			throw new TypeError(`Unexpected type passed to function`);
		}
		if (clientVersion === undefined) { clientVersion = this.currentVersion; };
		var clientHeaders = {"client-version": clientVersion};
		var response = await getApi("/mco/client/compatible", this, {}, clientHeaders);
		var responseText = await response.text()
		switch (responseText) {
			case "COMPATIBLE":
				return true;
			case "OUTDATED":
				return false;
			default:
				throw new DashError(DashError.UnexpectedResult);
		}
	}

	async realms() {
		await requiredParams(arguments, []);
		var response = await (await getApi("/worlds", this)).json();
		if (!response.hasOwnProperty("servers")) {
			throw new DashError(`Invalid property: object does not have a property with the name "servers"`);
		}
		return await response["servers"];
	}

	async realmInvites() {
		await requiredParams(arguments, []);
		var response = await getApi(`/invites/count/pending`, this);
		return await response.json();
	}

	async trialStatus() {
		await requiredParams(arguments, []);
		var response = await getApi(`/trial/new`, this);
		switch (response.status){
			case 403:
				return {"eligible": true, "redeemed": true};
			default:
				return {"eligible": true, "redeemed": false};
		}
	}
}

class backup {
	constructor(realm, backups, latestBackupFunction, fetchBackupFunction) {
		authentiactingProperties.forEach(property => {
			this[property] = realm[property];
		})
		this.backups = backups;
		this.latest = latestBackupFunction;
		this.fetchBackup = fetchBackupFunction;
	}
}

// class realm {
// 	constructor(realm, backups, latestBackupFunction, fetchBackupFunction) {
// 		authentiactingProperties.forEach(property => {
// 			this[property] = realm[property];
// 		})
// 		this.players
// 	}
// }
module.exports = { dash };