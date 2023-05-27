"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dash = void 0;
const DashError_1 = require("./DashError");
const VersionHandler_1 = require("./VersionHandler");
const ApiHandler_1 = require("./ApiHandler");
const PermissionHandler_1 = require("./PermissionHandler");
const dash_auth_1 = require("@pyrondev/dash-auth");
class dash {
    constructor(auth) {
        (() => __awaiter(this, void 0, void 0, function* () {
            if (!auth.token.hasOwnProperty("user_hash") || !auth.token.hasOwnProperty("xsts_token")) {
                throw new DashError_1.DashError(DashError_1.DashError.InvalidAuthorization);
            }
            this.userHash = auth.token.user_hash;
            this.xstsToken = auth.token.xsts_token;
            this.token = auth.token;
            this.args = auth.args;
            this.isCombo = auth.isCombo;
            try {
                yield (0, ApiHandler_1.sendApi)(this, "/mco/client/compatible", "GET");
            }
            catch (_a) {
                throw new DashError_1.DashError(DashError_1.DashError.InvalidAuthorization);
            }
        }))();
    }
    realm(realmID) {
        return Promise.resolve(realm.fromID(this, realmID));
    }
    realmFromInvite(realmInvite) {
        return Promise.resolve(realm.fromInvite(this, realmInvite));
    }
    client() {
        return Promise.resolve(new client(this));
    }
}
exports.dash = dash;
class realm {
    static fromID(dash, realmID) {
        return __awaiter(this, void 0, void 0, function* () {
            let Realm = new realm();
            Realm.userHash = dash.userHash;
            Realm.xstsToken = dash.xstsToken;
            Realm.args = dash.args;
            Realm.token = dash.token;
            Realm.isCombo = dash.isCombo;
            let response = yield (0, ApiHandler_1.sendApi)(Realm, `/worlds/${realmID}`, "GET");
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm id doesnt exist");
                case 403:
                    Realm.owner = false;
                    let response = yield (yield (0, ApiHandler_1.sendApi)(dash, "/worlds", "GET")).json();
                    let realms = response["servers"];
                    let matchingRealms = realms.filter((e) => e["id"] === realmID);
                    if (matchingRealms.length === 1) {
                        Realm.realmID = realmID;
                    }
                    else {
                        throw new DashError_1.DashError("You do not have access to that realm");
                    }
                    break;
                case 200:
                    Realm.realmID = realmID;
                    Realm.owner = true;
                    break;
                default:
                    throw new DashError_1.DashError("An unknown status code was returned, this is usually because the realmID was invalid.");
            }
            return Realm;
        });
    }
    static fromInvite(dash, realmInvite) {
        return __awaiter(this, void 0, void 0, function* () {
            let Realm = new realm();
            let response = yield (0, ApiHandler_1.sendApi)(dash, `/worlds/v1/link/${realmInvite}`, "GET");
            switch (response.status) {
                case 404:
                case 403:
                    throw new DashError_1.DashError("That realm invite doesnt exist", response.status);
                case 200:
                    Realm.userHash = dash.userHash;
                    Realm.xstsToken = dash.xstsToken;
                    Realm.args = dash.args;
                    Realm.token = dash.token;
                    Realm.isCombo = dash.isCombo;
                    Realm.realmID = (yield response.json())["id"];
                    response = yield (0, ApiHandler_1.sendApi)(dash, `/worlds/${Realm.realmID}`, "GET");
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
                    throw new DashError_1.DashError("An unknown status code was returned, this is usually because the realm invite was invalid", response.status);
            }
            return Realm;
        });
    }
    refreshCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let auth;
                if (this.isCombo) {
                    auth = yield dash_auth_1.comboAuthenticate.apply(null, this.args);
                }
                else {
                    auth = yield dash_auth_1.msaCodeAuthenticate.apply(null, this.args);
                }
                this.userHash = auth.token.user_hash;
                this.xstsToken = auth.token.xsts_token;
                this.token = auth.token;
                console.log("Credentials refreshed successfully");
            }
            catch (error) {
                console.log("Error occurred when trying to refresh credentials: " + error);
            }
        });
    }
    checkCredentials() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let expires = (_a = this.token) === null || _a === void 0 ? void 0 : _a.expires_on;
            if (!expires || new Date() >= new Date(expires)) {
                this.refreshCredentials();
            }
        });
    }
    // GET REQUESTS //
    info() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkCredentials();
            if (this.owner) {
                let response = yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}`, "GET");
                switch (response.status) {
                    case 404:
                        throw new DashError_1.DashError("That realm doesnt exist", response.status);
                    case 200:
                        return yield response.json();
                }
            }
            else {
                let responseJson = yield (yield (0, ApiHandler_1.sendApi)(this, "/worlds", "GET")).json();
                let realms = responseJson["servers"];
                let matchingRealms = realms.filter((e) => e["id"] === this.realmID);
                return matchingRealms[0];
            }
        });
    }
    address(retryMessages = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}/join`, "GET", { "retry": { "retries": 5, "returnOn": [200, 403, 404], "retryMessages": retryMessages } });
            switch (response.status) {
                case 403:
                    throw new DashError_1.DashError("That realm seems to be inacessable", response.status);
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    onlinePlayers() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/activities/live/players`, "GET");
            let responseJson = yield response.json();
            let servers = responseJson["servers"];
            let id = this.realmID || 0;
            let realm = servers.find((server) => server.id === id);
            if (!realm)
                throw new DashError_1.DashError("Could not find realm id in list of realms");
            switch (response.status) {
                case 200:
                    return realm;
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    // OWNER ONLY METHODS //
    content() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/world/${this.realmID}/content`, "GET");
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist or you dont have access to it", response.status);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    subscription() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/subscriptions/${this.realmID}/details`, "GET");
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist or you dont have access to it", response.status);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    backups() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}/backups`, "GET");
            let responseJson = yield response.json();
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist or you dont have access to it", response.status);
                case 200:
                    if (!responseJson.hasOwnProperty("backups")) {
                        throw new DashError_1.DashError(`Invalid property: object does not have a property with the name "backups"`, response.status);
                    }
                    return yield responseJson["backups"];
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    fetchBackup(backupID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/archive/download/world/${this.realmID}/1/${backupID}`, "GET");
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist or you dont have access to it", response.status);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    worldDownload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/archive/download/world/${this.realmID}/1/latest`, "GET");
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist or you dont have access to it", response.status);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    invite() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/links/v1?worldId=${this.realmID}`, "GET");
            let responseJson = yield response.json();
            switch (response.status) {
                case 403:
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist or you dont have access to it", response.status);
                case 200:
                    return yield responseJson[0];
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    blocklist() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}/blocklist`, "GET");
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    // POST REQUESTS //
    regenerateInvite() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/links/v1`, "POST", {
                "headers": { "Content-Type": "application/json" },
                "body": { "type": "INFINITE", "worldId": this.realmID }
            });
            switch (response.status) {
                case 403:
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist or you dont have access to it", response.status);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    blockUser(userXUID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}/blocklist/${userXUID}`, "POST");
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    updateConfiguration(newConfiguration) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let info = yield (yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}`, "GET")).json();
            let currentConfiguration = {
                "description": {
                    "name": info["name"],
                    "description": info["motd"]
                },
                "options": JSON.parse(info["slots"][parseInt(info["activeSlot"]) - 1]["options"])
            };
            Object.keys(newConfiguration).forEach(key => {
                if (!["description", "options"].includes(key)) {
                    throw new DashError_1.DashError(`Configuration contained invalid key identifier \"${key}\"`);
                }
                Object.keys(newConfiguration[key]).forEach(nestedKey => {
                    currentConfiguration[key][nestedKey] = newConfiguration[key][nestedKey];
                });
            });
            let response = yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}/configuration`, "POST", { "headers": { "Content-Type": "application/json" }, "body": currentConfiguration });
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 204:
                    return;
                case 500:
                case 400:
                    throw new DashError_1.DashError("Configuration formatted incorrectly", response.status);
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    applyContent(packUUIDS) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/world/${this.realmID}/content/`, "GET", { "headers": { "Content-Type": "application/json" }, "body": packUUIDS });
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That packUUID doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    // PUT REQUESTS //
    loadBackup(backupID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}/backups?backupId=${backupID}&clientSupportsRetries`, "PUT", { "headers": { "Content-Type": "application/json" } });
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That backupID does not exist", response.status);
                case 503:
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    inviteUser(userXUID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/invites/${this.realmID}/invite/update`, "PUT", { "headers": { "Content-Type": "application/json" }, "body": { "invites": { [userXUID.toString()]: "ADD" } } });
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    removeUser(userXUID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/invites/${this.realmID}/invite/update`, "PUT", { "headers": { "Content-Type": "application/json" }, "body": { "invites": { [userXUID.toString()]: "REMOVE" } } });
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    setDefaultPermission(permission) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            if (!(["OPERATOR", "MEMBER", "VISITOR"].includes(permission))) {
                throw new DashError_1.DashError(`Paramater at index 0 must be either: \"OPERATOR\", \"MEMBER\" or \"VISITOR\", not \"${permission}\"`);
            }
            let response = yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}/defaultPermission`, "PUT", { "headers": { "Content-Type": "application/json" }, "body": { "permission": permission } });
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    setUserPermission(userXUID, permission) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            if (!(["OPERATOR", "MEMBER", "VISITOR"].includes(permission))) {
                throw new DashError_1.DashError(`Paramater at index 0 must be either: \"OPERATOR\", \"MEMBER\" or \"VISITOR\", not \"${permission}\"`);
            }
            let response = yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}/userPermission`, "PUT", { "headers": { "Content-Type": "application/json" }, "body": { "permission": permission, "xuid": userXUID.toString() } });
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    activateSlot(slot) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            if (!([1, 2, 3].includes(slot))) {
                throw new DashError_1.DashError(`Paramater at index 0 must be either: 1, 2 or 3, not ${slot}`);
            }
            let response = yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}/slot/${slot}`, "PUT");
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}/open`, "PUT");
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}/close`, "PUT");
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    // DELETE REQUESTS //
    unblockUser(userXUID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}/blocklist/${userXUID}`, "DELETE");
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/worlds/${this.realmID}`, "DELETE");
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    texturePacksRequired(required) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            yield this.checkCredentials();
            if (required) {
                var response = yield (0, ApiHandler_1.sendApi)(this, `/world/${this.realmID}/content/texturePacksRequired`, "PUT");
            }
            else {
                var response = yield (0, ApiHandler_1.sendApi)(this, `/world/${this.realmID}/content/texturePacksRequired`, "DELETE");
            }
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
}
class client {
    constructor(dash) {
        (() => __awaiter(this, void 0, void 0, function* () {
            this.userHash = dash.userHash;
            this.xstsToken = dash.xstsToken;
            this.args = dash.args;
            this.token = dash.token;
            this.isCombo = dash.isCombo;
            try {
                yield (0, ApiHandler_1.sendApi)(this, "/mco/client/compatible", "GET");
            }
            catch (_a) {
                throw new DashError_1.DashError(DashError_1.DashError.InvalidAuthorization);
            }
        }))();
    }
    refreshCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let auth;
                if (this.isCombo) {
                    auth = yield dash_auth_1.comboAuthenticate.apply(null, this.args);
                }
                else {
                    auth = yield dash_auth_1.msaCodeAuthenticate.apply(null, this.args);
                }
                this.userHash = auth.token.user_hash;
                this.xstsToken = auth.token.xsts_token;
                this.token = auth.token;
                console.log("Credentials refreshed successfully");
            }
            catch (error) {
                console.log("Error occurred when trying to refresh credentials: " + error);
            }
        });
    }
    checkCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            let expires = this.token.expires_on;
            if (!expires || new Date() >= new Date(expires)) {
                this.refreshCredentials();
            }
        });
    }
    // GET REQUESTS //
    compatible(clientVersion = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkCredentials();
            if (clientVersion === undefined) {
                clientVersion = yield (0, VersionHandler_1.getCurrentVersion)();
            }
            ;
            let clientHeaders = { "client-version": clientVersion };
            let response = yield (0, ApiHandler_1.sendApi)(this, "/mco/client/compatible", "GET", clientHeaders);
            let responseText = yield response.text();
            switch (responseText) {
                case "COMPATIBLE":
                    return true;
                case "OUTDATED":
                    return false;
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    realms() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, "/worlds", "GET");
            let responseJson = yield response.json();
            if (!responseJson.hasOwnProperty("servers")) {
                throw new DashError_1.DashError(`Invalid property: object does not have a property with the name "servers"`, response.status);
            }
            return yield responseJson["servers"];
        });
    }
    realmInvitesCount() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/invites/count/pending`, "GET");
            return yield response.json();
        });
    }
    trialStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/trial/new`, "GET");
            switch (response.status) {
                case 403:
                    return { "eligible": true, "redeemed": true };
                default:
                    return { "eligible": true, "redeemed": false };
            }
        });
    }
    // POST REQUESTS //
    acceptInvite(realmInvite) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/invites/v1/link/accept/${realmInvite}`, "POST");
            switch (response.status) {
                case 403:
                    throw new DashError_1.DashError("That realm doesnt exist or you are already the owner of it", response.status);
                case 200:
                    return response.json();
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
    // DELETE REQUESTS //
    removeRealm(realmID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkCredentials();
            let response = yield (0, ApiHandler_1.sendApi)(this, `/invites/${realmID}`, "DELETE");
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", response.status);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", response.status);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, response.status);
            }
        });
    }
}
