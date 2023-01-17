const { DashError } = require("./DashError.js");
const { getCurrentVersion } = require("./VersionHandler.js");
const { getApi, postApi } = require("./ApiHandler.js");

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
				throw new DashError(DashError.UnexpectedResult);
		}
	}

	async getRealms() {
		var response = await (await getApi("/worlds", this)).json();
		if (!response.hasOwnProperty("servers")) {
			throw new DashError(`Invalid property: object does not have a property with the name "servers"`);
		}
		return await response["servers"];
}	

	async getOwnedRealm(realmID) {
		var response = await getApi(`/worlds/${realmID}`, this);
		switch (response.status){
			case 403:
				throw new DashError("You do not own this realm");
			case 404:
				throw new DashError("That realm doesnt exist");
			case 200:
				return await response.json();
		}
	}

	async getRealm(realmInvite) {
		var response = await getApi(`/worlds/v1/link/${realmInvite}`, this);
		var responseJson = await response.json();
		switch (response.status){
			case 403:
				throw new DashError("That realm doesnt exist");
			case 200:
				return await responseJson;
		}
	}

	async getRealmAddress(realmID) {
		var response = await getApi(`/worlds/${realmID}/join`, this, {}, 5);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it");
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async getAccountRealmInvites() {
		var response = await getApi(`/invites/count/pending`, this);
		return await response.json();
	}

	async getRealmContent(realmID) {
		var response = await getApi(`/world/${realmID}/content`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it");
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async getRealmSubscriptionDetails(realmID) {
		var response = await getApi(`/subscriptions/${realmID}/details`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it");
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async getRealmBackups(realmID) {
		var response = await getApi(`/worlds/${realmID}/backups`, this);
		var responseJson = await response.json()
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it");
			case 200:
				if (!responseJson.hasOwnProperty("backups")) {
					throw new DashError(`Invalid property: object does not have a property with the name "backups"`);
				}
				return responseJson["backups"];
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async getRealmBackupDetails(realmID, backupID) {
		var response = await getApi(`/archive/download/world/${realmID}/1/${backupID}`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it");
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async getRealmLatestBackupDetails(realmID) {
		var response = await getApi(`/archive/download/world/${realmID}/1/latest`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it");
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async getRealmInvite(realmID) {
		var response = await getApi(`/links/v1?worldId=${realmID}`, this);
		var responseJson = await response.json();
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it");
			case 200:
				return await responseJson[0];
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async accountEligibleForTrial(realmID) {
		var response = await getApi(`/links/v1?worldId=${realmID}`, this);
		switch (response.status){
			case 404:
				return {"eligible": false, "redeemed": false};
			case 403:
				return {"eligible": false, "redeemed": true};
			case 200:
				return {"eligible": true, "redeemed": false};
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async getAccountRealms() {
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

	async realmBlockUser(realmID, userXUID) {
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

	async accountAcceptInvite(realmInvite) {
		var response = await postApi(`/invites/v1/link/accept/${realmInvite}`, this);
		switch (response.status){
			case 403:
				throw new DashError("That realm doesnt exist or you are the owner of it");
			case 200:
				return response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`);
		}
	}

	async realmUpdateConfiguration(realmID) {
		var response = await postApi(`/worlds/${realmID}/configuration`, this);
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

}
const defaultRealmConfiguration = {
	"description":{
	  "description":"Test description",
	  "name":"Test Realm"
	},
	"options":{
	  "adventureMap":false,
	  "cheatsAllowed":false,
	  "commandBlocks":false,
	  "customGameServerGlobalProperties":null,
	  "difficulty":3,
	  "enabledPacks":{
		"behaviorPacks":[],
		"resourcePacks":[]
	  },
	  "forceGameMode":false,
	  "gameMode":0,
	  "incompatibilities":[],
	  "pvp":true,
	  "resourcePackHash":null,
	  "slotName":"My World",
	  "spawnAnimals":true,
	  "spawnMonsters":true,
	  "spawnNPCs":true,
	  "spawnProtection":0,
	  "texturePacksRequired":false,
	  "timeRequest":null,
	  "versionLock":true,
	  "versionRef":"5a7c1bcb9b95ebce0b42e7684a0c8f95f0e0c9d0",
	  "worldTemplateId":-1,
	  "worldTemplateImage":null,
	  "worldSettings":{
		"sendcommandfeedback":{
		  "type":0,
		  "value":false
		},
		"commandblocksenabled":{
		  "type":0,
		  "value":true
		},
		"dodaylightcycle":{
		  "type":0,
		  "value":true
		},
		"randomtickspeed":{
		  "type":1,
		  "value":1
		},
		"naturalregeneration":{
		  "type":0,
		  "value":true
		},
		"showtags":{
		  "type":0,
		  "value":true
		},
		"commandblockoutput":{
		  "type":0,
		  "value":false
		},
		"dofiretick":{
		  "type":0,
		  "value":true
		},
		"maxcommandchainlength":{
		  "type":1,
		  "value":65535
		},
		"falldamage":{
		  "type":0,
		  "value":true
		},
		"tntexplodes":{
		  "type":0,
		  "value":true
		},
		"drowningdamage":{
		  "type":0,
		  "value":true
		},
		"domobloot":{
		  "type":0,
		  "value":true
		},
		"domobspawning":{
		  "type":0,
		  "value":true
		},
		"showbordereffect":{
		  "type":0,
		  "value":true
		},
		"showdeathmessages":{
		  "type":0,
		  "value":true
		},
		"respawnblocksexplode":{
		  "type":0,
		  "value":true
		},
		"doweathercycle":{
		  "type":0,
		  "value":true
		},
		"doentitydrops":{
		  "type":0,
		  "value":true
		},
		"doimmediaterespawn":{
		  "type":0,
		  "value":false
		},
		"freezedamage":{
		  "type":0,
		  "value":true
		},
		"pvp":{
		  "type":0,
		  "value":true
		},
		"keepinventory":{
		  "type":0,
		  "value":false
		},
		"doinsomnia":{
		  "type":0,
		  "value":true
		},
		"mobgriefing":{
		  "type":0,
		  "value":true
		},
		"dotiledrops":{
		  "type":0,
		  "value":true
		},
		"firedamage":{
		  "type":0,
		  "value":true
		},
		"functioncommandlimit":{
		  "type":1,
		  "value":10000
		},
		"spawnradius":{
		  "type":1,
		  "value":1
		},
		"showcoordinates":{
		  "type":0,
		  "value":false
		}
	  }
	}
}
module.exports = { dash, defaultRealmConfiguration };