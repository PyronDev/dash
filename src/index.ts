import { DashError } from "./DashError";
import { getCurrentVersion } from './VersionHandler';
import { sendApi } from './ApiHandler';
import { checkPermission } from './PermissionHandler';
import { Dash, Auth, Realm } from './interfaces';
import { comboAuthenticate, msaCodeAuthenticate } from '@pyrondev/dash-auth';

class dash implements Dash {
	userHash?: string;
	xstsToken?: string;
	args?: any;
	isCombo?: boolean;
	token?: any;
	constructor(auth: Auth) {
		(async () => {
			if (!auth.token.hasOwnProperty("user_hash") || !auth.token.hasOwnProperty("xsts_token")) {
				throw new DashError(DashError.InvalidAuthorization);
			}
			this.userHash = auth.token.user_hash;
			this.xstsToken = auth.token.xsts_token;
			this.token = auth.token;
			this.args = auth.args;
			this.isCombo = auth.isCombo;
			try { await sendApi(this, "/mco/client/compatible", "GET"); } catch { throw new DashError(DashError.InvalidAuthorization); }
		})();
	}
	realm(realmID: number) {
		return Promise.resolve(realm.fromID(this, realmID));
	}
	realmFromInvite(realmInvite: string) {
		return Promise.resolve(realm.fromInvite(this, realmInvite));
	}
	client() {
		return Promise.resolve(new client(this));
	}
}

class realm implements Realm {
	userHash?: string;
	xstsToken?: string;
	currentVersion?: string;
	owner?: boolean;
	realmID?: number;
	args?: any;
	isCombo?: boolean;
	token?: any;
	static async fromID(dash: Dash, realmID: number) {
		let Realm = new realm();
		Realm.userHash = dash.userHash;
		Realm.xstsToken = dash.xstsToken;
		Realm.args = dash.args;
		Realm.token = dash.token;
		Realm.isCombo = dash.isCombo;
		let response: Response = await sendApi(Realm, `/worlds/${realmID}`, "GET");
		switch (response.status) {
			case 404:
				throw new DashError("That realm id doesnt exist");
			case 403:
				Realm.owner = false;
				let response = await (await sendApi(dash, "/worlds", "GET")).json();
				let realms = response["servers"];
				let matchingRealms = realms.filter((e: any) => e["id"] === realmID);
				if (matchingRealms.length === 1) {
					Realm.realmID = realmID;
				} else {
					throw new DashError("You do not have access to that realm");
				}
				break;
			case 200:
				Realm.realmID = realmID;
				Realm.owner = true;
				break;
			default:
				throw new DashError("An unknown status code was returned, this is usually because the realmID was invalid.");
		}
		return Realm;
	}

	static async fromInvite(dash: Dash, realmInvite: string) {
		let Realm = new realm();
		let response: Response = await sendApi(dash, `/worlds/v1/link/${realmInvite}`, "GET");

		switch (response.status) {
			case 404:
			case 403:
				throw new DashError("That realm invite doesnt exist", response.status);
			case 200:
				Realm.userHash = dash.userHash;
				Realm.xstsToken = dash.xstsToken;
				Realm.args = dash.args;
				Realm.token = dash.token;
				Realm.isCombo = dash.isCombo;
				Realm.realmID = (await response.json())["id"];
				response = await sendApi(dash, `/worlds/${Realm.realmID}`, "GET");
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
				throw new DashError("An unknown status code was returned, this is usually because the realm invite was invalid", response.status);
		}
		return Realm;
	}

	async refreshCredentials() {
		try {
			let auth: any;
			if (this.isCombo) {
				auth = await comboAuthenticate.apply(null, this.args);
			} else {
				auth = await msaCodeAuthenticate.apply(null, this.args);
			}
			this.userHash = auth.token.user_hash;
			this.xstsToken = auth.token.xsts_token;
			this.token = auth.token;
			console.log("Credentials refreshed successfully");
		} catch (error) {
			console.log("Error occurred when trying to refresh credentials: " + error);
		}
	}

	async checkCredentials() {
		let expires = this.token?.expires_on;
		if (!expires || new Date() >= new Date(expires)) {
			this.refreshCredentials();
		}
	}

	// GET REQUESTS //
	async info() {
		await this.checkCredentials();
		if (this.owner) {
			let response: Response = await sendApi(this, `/worlds/${this.realmID}`, "GET");
			switch (response.status) {
				case 404:
					throw new DashError("That realm doesnt exist", response.status);
				case 200:
					return await response.json();
			}
		} else {
			let responseJson: any = await (await sendApi(this, "/worlds", "GET")).json();
			let realms = responseJson["servers"];
			let matchingRealms = realms.filter((e: any) => e["id"] === this.realmID);
			return matchingRealms[0];

		}
	}

	async address(retryMessages: boolean = true) { // this method is very unstable, not my fault, mojangs. To mitigate this we try 5 times to get the correct response.
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/worlds/${this.realmID}/join`, "GET", { "retry": { "retries": 5, "returnOn": [200, 403, 404], "retryMessages": retryMessages } });
		switch (response.status) {
			case 403:
				throw new DashError("That realm seems to be inacessable", response.status);
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 200:
				return await response.json();
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}
	async onlinePlayers() { // another dogey method by the wonderful mojang.
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/activities/live/players`, "GET");
		let responseJson: any = await response.json();
		let servers: any = responseJson["servers"];
		let id = this.realmID || 0;
		let realm: any = servers.find((server: any) => server.id === id);
		if (!realm) throw new DashError("Could not find realm id in list of realms");
		switch (response.status) {
			case 200:
				return realm;
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	// OWNER ONLY METHODS //
	async content() {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/world/${this.realmID}/content`, "GET");
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it", response.status);
			case 200:
				return await response.json();
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async subscription() {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/subscriptions/${this.realmID}/details`, "GET");
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it", response.status);
			case 200:
				return await response.json();
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async backups() {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/worlds/${this.realmID}/backups`, "GET");
		let responseJson: any = await response.json();
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it", response.status);
			case 200:
				if (!responseJson.hasOwnProperty("backups")) {
					throw new DashError(`Invalid property: object does not have a property with the name "backups"`, response.status);
				}
				return await responseJson["backups"];
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async fetchBackup(backupID: string) {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/archive/download/world/${this.realmID}/1/${backupID}`, "GET");
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it", response.status);
			case 200:
				return await response.json();
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async worldDownload() {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/archive/download/world/${this.realmID}/1/latest`, "GET");
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it", response.status);
			case 200:
				return await response.json();
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async invite() {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/links/v1?worldId=${this.realmID}`, "GET");
		let responseJson: any = await response.json();
		switch (response.status) {
			case 403:
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it", response.status);
			case 200:
				return await responseJson[0];
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async blocklist() {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/worlds/${this.realmID}/blocklist`, "GET");
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 200:
				return await response.json();
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	// POST REQUESTS //
	async regenerateInvite() {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/links/v1`, "POST", {
			"headers": { "Content-Type": "application/json" },
			"body": { "type": "INFINITE", "worldId": this.realmID }
		});
		switch (response.status) {
			case 403:
			case 404:
				throw new DashError("That realm doesnt exist or you dont have access to it", response.status);
			case 200:
				return await response.json();
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async blockUser(userXUID: number) {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/worlds/${this.realmID}/blocklist/${userXUID}`, "POST");
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 204:
				return;
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async updateConfiguration(newConfiguration: any) {
		await checkPermission(this);
		await this.checkCredentials();
		let info: any = await (await sendApi(this, `/worlds/${this.realmID}`, "GET")).json();
		let currentConfiguration: any = {
			"description": {
				"name": info["name"],
				"description": info["motd"]
			},
			"options": JSON.parse(info["slots"][parseInt(info["activeSlot"]) - 1]["options"])
		};
		Object.keys(newConfiguration).forEach(key => {
			if (!["description", "options"].includes(key)) {
				throw new DashError(`Configuration contained invalid key identifier \"${key}\"`);
			}
			Object.keys(newConfiguration[key]).forEach(nestedKey => {
				currentConfiguration[key][nestedKey] = newConfiguration[key][nestedKey];
			});
		});
		let response: Response = await sendApi(this, `/worlds/${this.realmID}/configuration`, "POST", { "headers": { "Content-Type": "application/json" }, "body": currentConfiguration });
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 204:
				return;
			case 500:
			case 400:
				throw new DashError("Configuration formatted incorrectly", response.status);
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async applyContent(packUUIDS: string[]) {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/world/${this.realmID}/content/`, "GET", { "headers": { "Content-Type": "application/json" }, "body": packUUIDS });
		switch (response.status) {
			case 404:
				throw new DashError("That packUUID doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 204:
				return;
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	// PUT REQUESTS //
	async loadBackup(backupID: string) {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/worlds/${this.realmID}/backups?backupId=${backupID}&clientSupportsRetries`, "PUT", { "headers": { "Content-Type": "application/json" } });
		switch (response.status) {
			case 404:
				throw new DashError("That backupID does not exist", response.status);
			case 503:
			case 204:
				return;
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async inviteUser(userXUID: number) {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/invites/${this.realmID}/invite/update`, "PUT", { "headers": { "Content-Type": "application/json" }, "body": { "invites": { [userXUID.toString()]: "ADD" } } });
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 200:
				return await response.json();
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async removeUser(userXUID: number) {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/invites/${this.realmID}/invite/update`, "PUT", { "headers": { "Content-Type": "application/json" }, "body": { "invites": { [userXUID.toString()]: "REMOVE" } } });
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 200:
				return await response.json();
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async setDefaultPermission(permission: "string") {
		await checkPermission(this);
		await this.checkCredentials();
		if (!(["OPERATOR", "MEMBER", "VISITOR"].includes(permission))) {
			throw new DashError(`Paramater at index 0 must be either: \"OPERATOR\", \"MEMBER\" or \"VISITOR\", not \"${permission}\"`);
		}
		let response: Response = await sendApi(this, `/worlds/${this.realmID}/defaultPermission`, "PUT", { "headers": { "Content-Type": "application/json" }, "body": { "permission": permission } });
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 204:
				return;
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async setUserPermission(userXUID: number, permission: string) {
		await checkPermission(this);
		await this.checkCredentials();
		if (!(["OPERATOR", "MEMBER", "VISITOR"].includes(permission))) {
			throw new DashError(`Paramater at index 0 must be either: \"OPERATOR\", \"MEMBER\" or \"VISITOR\", not \"${permission}\"`);
		}
		let response: Response = await sendApi(this, `/worlds/${this.realmID}/userPermission`, "PUT", { "headers": { "Content-Type": "application/json" }, "body": { "permission": permission, "xuid": userXUID.toString() } });
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 204:
				return;
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async activateSlot(slot: number) {
		await checkPermission(this);
		await this.checkCredentials();
		if (!([1, 2, 3].includes(slot))) {
			throw new DashError(`Paramater at index 0 must be either: 1, 2 or 3, not ${slot}`);
		}
		let response: Response = await sendApi(this, `/worlds/${this.realmID}/slot/${slot}`, "PUT");
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 200:
				return await response.json();
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async open() {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/worlds/${this.realmID}/open`, "PUT");
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 200:
				return await response.json();
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async close() {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/worlds/${this.realmID}/close`, "PUT");
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 200:
				return await response.json();
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	// DELETE REQUESTS //
	async unblockUser(userXUID: number) {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/worlds/${this.realmID}/blocklist/${userXUID}`, "DELETE");
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 204:
				return;
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async delete() {
		await checkPermission(this);
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/worlds/${this.realmID}`, "DELETE");
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 204:
				return;
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async texturePacksRequired(required: boolean) {
		await checkPermission(this);
		await this.checkCredentials();
		if (required) {
			var response: Response = await sendApi(this, `/world/${this.realmID}/content/texturePacksRequired`, "PUT");
		} else {
			var response: Response = await sendApi(this, `/world/${this.realmID}/content/texturePacksRequired`, "DELETE");
		}
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 204:
				return;
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}
}

class client implements Dash {
	userHash?: string;
	xstsToken?: string;
	args?: any;
	token?: any;
	isCombo?: boolean;
	constructor(dash: Dash) {
		(async () => {
			this.userHash = dash.userHash;
			this.xstsToken = dash.xstsToken;
			this.args = dash.args;
			this.token = dash.token;
			this.isCombo = dash.isCombo;
			try {
				await sendApi(this, "/mco/client/compatible", "GET");
			} catch { throw new DashError(DashError.InvalidAuthorization); }
		})();
	}

	async refreshCredentials() {
		try {
			let auth: any;
			if (this.isCombo) {
				auth = await comboAuthenticate.apply(null, this.args);
			} else {
				auth = await msaCodeAuthenticate.apply(null, this.args);
			}
			this.userHash = auth.token.user_hash;
			this.xstsToken = auth.token.xsts_token;
			this.token = auth.token;
			console.log("Credentials refreshed successfully");
		} catch (error) {
			console.log("Error occurred when trying to refresh credentials: " + error);
		}
	}

	async checkCredentials() {
		let expires = this.token.expires_on;
		if (!expires || new Date() >= new Date(expires)) {
			this.refreshCredentials();
		}
	}

	// GET REQUESTS //
	async compatible(clientVersion: string | undefined = undefined) {
		await this.checkCredentials();
		if (clientVersion === undefined) { clientVersion = await getCurrentVersion(); };
		let clientHeaders = { "client-version": clientVersion };
		let response: any = await sendApi(this, "/mco/client/compatible", "GET", clientHeaders);
		let responseText = await response.text();
		switch (responseText) {
			case "COMPATIBLE":
				return true;
			case "OUTDATED":
				return false;
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	async realms() {
		await this.checkCredentials();
		let response: Response = await sendApi(this, "/worlds", "GET");
		let responseJson: any = await response.json();
		if (!responseJson.hasOwnProperty("servers")) {
			throw new DashError(`Invalid property: object does not have a property with the name "servers"`, response.status);
		}
		return await responseJson["servers"];
	}

	async realmInvitesCount() {
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/invites/count/pending`, "GET");
		return await response.json();
	}

	async trialStatus() {
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/trial/new`, "GET");
		switch (response.status) {
			case 403:
				return { "eligible": true, "redeemed": true };
			default:
				return { "eligible": true, "redeemed": false };
		}
	}

	// POST REQUESTS //
	async acceptInvite(realmInvite: string) {
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/invites/v1/link/accept/${realmInvite}`, "POST");
		switch (response.status) {
			case 403:
				throw new DashError("That realm doesnt exist or you are already the owner of it", response.status);
			case 200:
				return response.json();
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}

	// DELETE REQUESTS //
	async removeRealm(realmID: number) {
		await this.checkCredentials();
		let response: Response = await sendApi(this, `/invites/${realmID}`, "DELETE");
		switch (response.status) {
			case 404:
				throw new DashError("That realm doesnt exist", response.status);
			case 403:
				throw new DashError("You do not have access to that realm", response.status);
			case 204:
				return;
			default:
				throw new DashError(DashError.UnexpectedResult, response.status);
		}
	}
}

export { dash };