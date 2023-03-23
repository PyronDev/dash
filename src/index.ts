import { DashError } from "./DashError";
import { getCurrentVersion  } from './VersionHandler';
import { getApi, postApi, delApi, putApi } from './ApiHandler';
import { requiredParams } from './ParamHandler';
import { checkPermission } from './PermissionHandler';

const authentiactingProperties = [
	"userHash",
	"xstsToken",
	"realmID",
	"owner"
]

class dash {
	userHash: any;
	xstsToken: any;
	constructor(auth: any) {
	
		(async () => {
			if (!auth.hasOwnProperty("user_hash") || !auth.hasOwnProperty("xsts_token")) {
				throw new DashError(DashError.InvalidAuthorization, 0x1);
			}
			this.userHash = auth.user_hash;
			this.xstsToken = auth.xsts_token;
			try { await getApi("/mco/client/compatible", this) } catch { throw new DashError(DashError.InvalidAuthorization, 0x2); }
		}) ();
	}
	async realm(realmID: number){
		return realm.fromID(this, realmID)
	}
	async realmFromInvite(realmInvite: string){
		return await realm.fromInvite(this, realmInvite)
	}
	async client() {
		return new client(this);
	}
}

class realm {
	userHash: any;
	xstsToken: any;
	owner: any;
	realmID: any;
	dash: any;
	static async fromID(dash: any, realmID: number) {
		var Realm = new realm();
		Realm.userHash = dash.userHash;
		Realm.xstsToken = dash.xstsToken;
		var response: any = await getApi(`/worlds/${realmID}`, dash);
		switch (response.status){
			case 404:
				throw new DashError("That realm id doesnt exist", 0x3);
			case 403:
				Realm.owner = false;
				var response: any = await (await getApi("/worlds", dash)).json();
				var realms = response["servers"];
				var matchingRealms = realms.filter((e: any) => e["id"] === realmID);
				if (matchingRealms.length === 1) {
					Realm.realmID = realmID;
				} else {
					throw new DashError("You do not have access to that realm.", 0x4);
				}
				break;
			case 200:
				Realm.dash = dash;
				Realm.realmID = realmID;
				Realm.owner = true;
				break;
			default:
				throw new DashError(`An unknown status code was returned, this is usually because the realmID was invalid. Status code: ${response.status}`, 0x5);
		}
		return Realm;
	}

	static async fromInvite(dash: any, realmInvite: string) {
		var Realm = new realm();
		var response: any = await getApi(`/worlds/v1/link/${realmInvite}`, dash);
		switch (response.status){
			case 404:
			case 403:
				throw new DashError("That realm invite doesnt exist", 0x6);
			case 200:
				Realm.userHash = dash.userHash;
				Realm.xstsToken = dash.xstsToken;
				Realm.dash = dash;
				Realm.realmID = (await response.json())["id"];
				var response: any = await getApi(`/worlds/${Realm.realmID}`, dash);
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
				throw new DashError(`An unknown status code was returned, this is usually because the realm invite was invalid. Status code: ${response.status}`, 0x7);
		}
		return Realm;
	}
	// GET REQUESTS //
	async info() {
		if (this.owner) {
			var response: any = await getApi(`/worlds/${this.realmID}`, this);
			switch (response.status){
				case 404:
					throw new DashError("That realm doesnt exist", 0x8);
				case 200:
					return await response.json();
			}
		} else {
			var response: any = await (await getApi("/worlds", this)).json();
			var realms = response["servers"];
			var matchingRealms = realms.filter((e:any) => e["id"] === this.realmID);
			return matchingRealms[0];

		}
	}

	async address(retryMessages: boolean = true) { // this method is very unstable, not my fault, mojangs. To mitigate this we try 5 times to get the correct response.
		var response: any = await getApi(`/worlds/${this.realmID}/join`, this, {}, {"retries": 5, "returnOn": [200, 403, 404], "retryMessages": retryMessages});
		switch (response.status){
			case 403:
				throw new DashError("That realm seems to be inacessable", 0xB);
			case 404:
				throw new DashError("That realm doesnt exist", 0xC);
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0xD);
		}
	}
	async onlinePlayers() { // another dogey method by the wonderful mojang.
		var response: any = await getApi(`/activities/live/players`, this);
		var responseJson = await response.json();
		switch (response.status){
			case 200:
				return responseJson["servers"];
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0xE);
		}
	}
	
	// OWNER ONLY METHODS //
	async content() {
		await checkPermission(this);
		var response: any = await getApi(`/world/${this.realmID}/content`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it", 0xF);
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x10);
		}
	}

	async subscription() {

		await checkPermission(this);
		var response: any = await getApi(`/subscriptions/${this.realmID}/details`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it", 0x11);
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x12);
		}
	}

	async backups() {

		await checkPermission(this);
		var response: any = await getApi(`/worlds/${this.realmID}/backups`, this);
		var responseJson = await response.json()
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it", 0x13);
			case 200:
				if (!responseJson.hasOwnProperty("backups")) {
					throw new DashError(`Invalid property: object does not have a property with the name "backups"`, 0x14);
				}
				return new backup(this, await responseJson["backups"], this.#latestBackupDetails, this.#fetchBackup);;
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x15);
		}
	}

	async #fetchBackup(backupID: string) {
		await checkPermission(this);
		var response: any = await getApi(`/archive/download/world/${this.realmID}/1/${backupID}`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it", 0x16);
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x17);
		}
	}

	async #latestBackupDetails() {
		await checkPermission(this);
		var response: any = await getApi(`/archive/download/world/${this.realmID}/1/latest`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it", 0x18);
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x19);
		}
	}

	async invite() {

		await checkPermission(this);
		var response: any = await getApi(`/links/v1?worldId=${this.realmID}`, this);
		var responseJson = await response.json();
		switch (response.status){
			case 403:
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it", 0x1A);
			case 200:
				return await responseJson[0];
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x1B);
		}
	}

	async blocklist() {

		await checkPermission(this);
		var response: any = await getApi(`/worlds/${this.realmID}/blocklist`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist", 0x1C);
			case 403:
				throw new DashError("You do not have access to that realm", 0x1D);
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x1E);
		}
	}

	// POST REQUESTS //
	async blockUser(userXUID: number) {
		await checkPermission(this);
		var response: any = await postApi(`/worlds/${this.realmID}/blocklist/${userXUID}`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist", 0x1F);
			case 403:
				throw new DashError("You do not have access to that realm", 0x20);
			case 204:
				return;
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x21);
		}
	}

	async updateConfiguration(newConfiguration: any) {
		await requiredParams(arguments, [Object]);
		await checkPermission(this);
		var info: any = await (await getApi(`/worlds/${this.realmID}`, this)).json();
		var currentConfiguration: any = {
			"description" : {
				"name": info["name"], 
				"description": info["motd"]
			},
			"options": JSON.parse(info["slots"][parseInt(info["activeSlot"])-1]["options"])
		}
		Object.keys(newConfiguration).forEach(key => {
			if (!["description", "options"].includes(key)) {
				throw new DashError(`Configuration contained invalid key identifier \"${key}\"`, 0x22);
			}
			Object.keys(newConfiguration[key]).forEach(nestedKey => {
				currentConfiguration[key][nestedKey] = newConfiguration[key][nestedKey];
			})
		});
		var response: any = await postApi(`/worlds/${this.realmID}/configuration`, this, {"Content-Type": "application/json"}, JSON.stringify(currentConfiguration));
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist", 0x23);
			case 403:
				throw new DashError("You do not have access to that realm", 0x24);
			case 204:
				return;
			case 500:
			case 400:
				throw new DashError(`Configuration formatted incorrectly \nStatus code: ${await response.status}`, 0x25);
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x26);
		}
	}

	async applyContent(packUUID: string) {
		await checkPermission(this);
		var response: any = await postApi(`/world/${this.realmID}/content/`, this, {"Content-Type": "application/json"}, JSON.stringify([packUUID]));
		switch (response.status){
			case 404:
				throw new DashError("That packUUID doesnt exist", 0x27);
			case 403:
				throw new DashError("You do not have access to that realm", 0x28);
			case 204:
				return;
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x29);
		}
	}

	// PUT REQUESTS //
	async inviteUser(userXUID: number) {
		await checkPermission(this);
		var response: any = await putApi(`/invites/${this.realmID}/invite/update`, this, {"Content-Type": "application/json"}, JSON.stringify({"invites": {[userXUID]: "ADD"}}));
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist", 0x2D);
			case 403:
				throw new DashError("You do not have access to that realm", 0x2E);
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x2F);
		}
	}
	async removeUser(userXUID: number) {
		await checkPermission(this);
		var response: any = await putApi(`/invites/${this.realmID}/invite/update`, this, {"Content-Type": "application/json"}, JSON.stringify({"invites": {[userXUID]: "REMOVE"}}));
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", 0x30);
			case 403:
				throw new DashError("You do not have access to that realm", 0x31);
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x32);
		}
	}
	
	async setDefaultPermission(permission: string){
		await checkPermission(this);
		if (!(["OPERATOR", "MEMBER", "VISITOR"].includes(permission))) {
			throw new DashError(`Paramater at index 0 must be either: \"OPERATOR\", \"MEMBER\" or \"VISITOR\", not \"${permission}\"`, 0x33);
		}
		var response: any = await putApi(`/worlds/${this.realmID}/defaultPermission`, this, {"Content-Type": "application/json"}, JSON.stringify({"permission": permission}));
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", 0x34);
			case 403:
				throw new DashError("You do not have access to that realm", 0x35);
			case 204:
				return;
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x36);
		}
	}

	async setUserPermission(userXUID: number, permission: string) {
		await checkPermission(this);
		if (!(["OPERATOR", "MEMBER", "VISITOR"].includes(permission))) {
			throw new DashError(`Paramater at index 0 must be either: \"OPERATOR\", \"MEMBER\" or \"VISITOR\", not \"${permission}\"`, 0x37);
		}
		var response: any = await putApi(`/worlds/${this.realmID}/defaultPermission`, this, {"Content-Type": "application/json"}, JSON.stringify({"permission": permission, "xuid": userXUID}));
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", 0x38);
			case 403:
				throw new DashError("You do not have access to that realm", 0x39);
			case 204:
				return;
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x3A);
		}
	}

	async activateSlot(slot: number) {
		await checkPermission(this);
		if (!([1, 2, 3].includes(slot))) {
			throw new DashError(`Paramater at index 0 must be either: 1, 2 or 3, not ${slot}`, 0x3B);
		}
		var response: any = await putApi(`/worlds/${this.realmID}/slot/${slot}`, this);
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", 0x3C);
			case 403:
				throw new DashError("You do not have access to that realm", 0x3D);
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x3E);
		}
	}
	
	async open() {

		await checkPermission(this);
		var response: any = await putApi(`/worlds/${this.realmID}/open`, this);
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", 0x3F);
			case 403:
				throw new DashError("You do not have access to that realm", 0x40);
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x41);
		}
	}

	async close() {

		await checkPermission(this);
		var response: any = await putApi(`/worlds/${this.realmID}/close`, this);
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", 0x42);
			case 403:
				throw new DashError("You do not have access to that realm", 0x43);
			case 200:
				return await response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x44);
		}
	}

	// DELETE REQUESTS //
	async unblockUser(userXUID: number) {
		await checkPermission(this);
		var response: any = await delApi(`/worlds/${this.realmID}/blocklist/${userXUID}`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist", 0x45);
			case 403:
				throw new DashError("You do not have access to that realm", 0x46);
			case 204:
				return;
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x47);
		}
	}

	async delete() {

		await checkPermission(this);
		var response: any = await delApi(`/worlds/${this.realmID}`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist", 0x48);
			case 403:
				throw new DashError("You do not have access to that realm", 0x49);
			case 204:
				return;
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x4A);
		}
	}

	async texturePacksRequired(required: boolean) {
		await checkPermission(this);
		if (required) {
			var response: any = await putApi(`/world/${this.realmID}/content/texturePacksRequired`, this);
		} else {
			var response: any = await delApi(`/world/${this.realmID}/content/texturePacksRequired`, this);
		}
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist", 0x4B);
			case 403:
				throw new DashError("You do not have access to that realm", 0x4C);
			case 204:
				return;
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x4D);
		}
	}
}

class client {
	userHash: any;
	xstsToken: any;
	constructor(dash: any) {
		(async () => {
			this.userHash = dash.userHash;
			this.xstsToken = dash.xstsToken;
			try { 
				await getApi("/mco/client/compatible", this)
		 } catch { throw new DashError(DashError.InvalidAuthorization, 0x4E); }
		}) ();
	}

	// GET REQUESTS //
	async compatible(clientVersion: any = undefined) {
		if (typeof(clientVersion) !== "number" && clientVersion != undefined) {
			throw new TypeError(`Unexpected type passed to function`);
		}
		if (clientVersion === undefined) { clientVersion = await getCurrentVersion(); };
		var clientHeaders = {"client-version": clientVersion};
		var response: any = await getApi("/mco/client/compatible", this, clientHeaders);
		var responseText = await response.text()
		switch (responseText) {
			case "COMPATIBLE":
				return true;
			case "OUTDATED":
				return false;
			default:
				throw new DashError(DashError.UnexpectedResult, 0x50);
		}
	}

	async realms() {

		var response: any = await (await getApi("/worlds", this)).json();
		if (!response.hasOwnProperty("servers")) {
			throw new DashError(`Invalid property: object does not have a property with the name "servers"`, 0x51);
		}
		return await response["servers"];
	}

	async realmInvitesCount() {

		var response: any = await getApi(`/invites/count/pending`, this);
		return await response.json();
	}

	async trialStatus() {

		var response: any = await getApi(`/trial/new`, this);
		switch (response.status){
			case 403:
				return {"eligible": true, "redeemed": true};
			default:
				return {"eligible": true, "redeemed": false};
		}
	}

	// POST REQUESTS //
	async acceptInvite(realmInvite: string) {
		var response: any = await postApi(`/invites/v1/link/accept/${realmInvite}`, this);
		switch (response.status){
			case 403:
				throw new DashError("That realm doesnt exist or you are already the owner of it", 0x52);
			case 200:
				return response.json();
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x53);
		}
	}

	// DELETE REQUESTS //
	async removeRealm(realmID: number) {
		await requiredParams(arguments, [Number]);
		var response: any = await delApi(`/invites/${realmID}`, this);
		switch (response.status){
			case 404:
				throw new DashError("That realm doesnt exist", 0x54);
			case 403:
				throw new DashError("You do not have access to that realm", 0x55);
			case 204:
				return;
			default:
				throw new DashError(`${DashError.UnexpectedResult} Status code: ${response.status}`, 0x56);
		}
	}
}

class backup {
	backups: any;
	latest: Function;
	fetchBackup:Function;
	constructor(realm: any, backups: any, latestBackupFunction:Function, fetchBackupFunction: Function) {
		authentiactingProperties.forEach(property => {
			this[property as keyof backup] = realm[property];
		})
		this.backups = backups;
		this.latest = latestBackupFunction;
		this.fetchBackup = fetchBackupFunction;
	}
}

module.exports = { dash };