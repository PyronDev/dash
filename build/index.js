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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _realm_instances, _realm_fetchBackup, _realm_latestBackupDetails;
Object.defineProperty(exports, "__esModule", { value: true });
const DashError_1 = require("./DashError");
const VersionHandler_1 = require("./VersionHandler");
const ApiHandler_1 = require("./ApiHandler");
const ParamHandler_1 = require("./ParamHandler");
const PermissionHandler_1 = require("./PermissionHandler");
const authentiactingProperties = [
    "userHash",
    "xstsToken",
    "realmID",
    "owner"
];
class dash {
    constructor(auth) {
        (() => __awaiter(this, void 0, void 0, function* () {
            if (!auth.hasOwnProperty("user_hash") || !auth.hasOwnProperty("xsts_token")) {
                throw new DashError_1.DashError(DashError_1.DashError.InvalidAuthorization, 0x1);
            }
            this.userHash = auth.user_hash;
            this.xstsToken = auth.xsts_token;
            try {
                yield (0, ApiHandler_1.getApi)("/mco/client/compatible", this);
            }
            catch (_a) {
                throw new DashError_1.DashError(DashError_1.DashError.InvalidAuthorization, 0x2);
            }
        }))();
    }
    realm(realmID) {
        return __awaiter(this, void 0, void 0, function* () {
            return realm.fromID(this, realmID);
        });
    }
    realmFromInvite(realmInvite) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield realm.fromInvite(this, realmInvite);
        });
    }
    client() {
        return __awaiter(this, void 0, void 0, function* () {
            return new client(this);
        });
    }
}
class realm {
    constructor() {
        _realm_instances.add(this);
    }
    static fromID(dash, realmID) {
        return __awaiter(this, void 0, void 0, function* () {
            var Realm = new realm();
            Realm.userHash = dash.userHash;
            Realm.xstsToken = dash.xstsToken;
            var response = yield (0, ApiHandler_1.getApi)(`/worlds/${realmID}`, dash);
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm id doesnt exist", 0x3);
                case 403:
                    Realm.owner = false;
                    var response = yield (yield (0, ApiHandler_1.getApi)("/worlds", dash)).json();
                    var realms = response["servers"];
                    var matchingRealms = realms.filter((e) => e["id"] === realmID);
                    if (matchingRealms.length === 1) {
                        Realm.realmID = realmID;
                    }
                    else {
                        throw new DashError_1.DashError("You do not have access to that realm.", 0x4);
                    }
                    break;
                case 200:
                    Realm.dash = dash;
                    Realm.realmID = realmID;
                    Realm.owner = true;
                    break;
                default:
                    throw new DashError_1.DashError(`An unknown status code was returned, this is usually because the realmID was invalid. Status code: ${response.status}`, 0x5);
            }
            return Realm;
        });
    }
    static fromInvite(dash, realmInvite) {
        return __awaiter(this, void 0, void 0, function* () {
            var Realm = new realm();
            var response = yield (0, ApiHandler_1.getApi)(`/worlds/v1/link/${realmInvite}`, dash);
            switch (response.status) {
                case 404:
                case 403:
                    throw new DashError_1.DashError("That realm invite doesnt exist", 0x6);
                case 200:
                    Realm.userHash = dash.userHash;
                    Realm.xstsToken = dash.xstsToken;
                    Realm.dash = dash;
                    Realm.realmID = (yield response.json())["id"];
                    var response = yield (0, ApiHandler_1.getApi)(`/worlds/${Realm.realmID}`, dash);
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
                    throw new DashError_1.DashError(`An unknown status code was returned, this is usually because the realm invite was invalid. Status code: ${response.status}`, 0x7);
            }
            return Realm;
        });
    }
    // GET REQUESTS //
    info() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.owner) {
                var response = yield (0, ApiHandler_1.getApi)(`/worlds/${this.realmID}`, this);
                switch (response.status) {
                    case 404:
                        throw new DashError_1.DashError("That realm doesnt exist", 0x8);
                    case 200:
                        return yield response.json();
                }
            }
            else {
                var response = yield (yield (0, ApiHandler_1.getApi)("/worlds", this)).json();
                var realms = response["servers"];
                var matchingRealms = realms.filter((e) => e["id"] === this.realmID);
                return matchingRealms[0];
            }
        });
    }
    address(retryMessages = true) {
        return __awaiter(this, void 0, void 0, function* () {
            var response = yield (0, ApiHandler_1.getApi)(`/worlds/${this.realmID}/join`, this, {}, { "retries": 5, "returnOn": [200, 403, 404], "retryMessages": retryMessages });
            switch (response.status) {
                case 403:
                    throw new DashError_1.DashError("That realm seems to be inacessable", 0xB);
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0xC);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0xD);
            }
        });
    }
    onlinePlayers() {
        return __awaiter(this, void 0, void 0, function* () {
            var response = yield (0, ApiHandler_1.getApi)(`/activities/live/players`, this);
            var responseJson = yield response.json();
            switch (response.status) {
                case 200:
                    return responseJson["servers"];
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0xE);
            }
        });
    }
    // OWNER ONLY METHODS //
    content() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            var response = yield (0, ApiHandler_1.getApi)(`/world/${this.realmID}/content`, this);
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist or you dont have access to it", 0xF);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x10);
            }
        });
    }
    subscription() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            var response = yield (0, ApiHandler_1.getApi)(`/subscriptions/${this.realmID}/details`, this);
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist or you dont have access to it", 0x11);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x12);
            }
        });
    }
    backups() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            var response = yield (0, ApiHandler_1.getApi)(`/worlds/${this.realmID}/backups`, this);
            var responseJson = yield response.json();
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist or you dont have access to it", 0x13);
                case 200:
                    if (!responseJson.hasOwnProperty("backups")) {
                        throw new DashError_1.DashError(`Invalid property: object does not have a property with the name "backups"`, 0x14);
                    }
                    return new backup(this, yield responseJson["backups"], __classPrivateFieldGet(this, _realm_instances, "m", _realm_latestBackupDetails), __classPrivateFieldGet(this, _realm_instances, "m", _realm_fetchBackup));
                    ;
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x15);
            }
        });
    }
    invite() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            var response = yield (0, ApiHandler_1.getApi)(`/links/v1?worldId=${this.realmID}`, this);
            var responseJson = yield response.json();
            switch (response.status) {
                case 403:
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist or you dont have access to it", 0x1A);
                case 200:
                    return yield responseJson[0];
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x1B);
            }
        });
    }
    regenerateInvite() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            var response = yield (0, ApiHandler_1.postApi)(`/links/v1`, this, { "Content-Type": "application/json" }, JSON.stringify({ "type": "INFINITE", "worldId": this.realmID }));
            console.log(yield response.text());
            var responseJson = yield response.json();
            switch (response.status) {
                case 403:
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist or you dont have access to it", 0x1A);
                case 200:
                    return yield responseJson;
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x1B);
            }
        });
    }
    blocklist() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            var response = yield (0, ApiHandler_1.getApi)(`/worlds/${this.realmID}/blocklist`, this);
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0x1C);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x1D);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x1E);
            }
        });
    }
    // POST REQUESTS //
    blockUser(userXUID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            var response = yield (0, ApiHandler_1.postApi)(`/worlds/${this.realmID}/blocklist/${userXUID}`, this);
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0x1F);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x20);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x21);
            }
        });
    }
    updateConfiguration(newConfiguration) {
        return __awaiter(this, arguments, void 0, function* () {
            yield (0, ParamHandler_1.requiredParams)(arguments, [Object]);
            yield (0, PermissionHandler_1.checkPermission)(this);
            var info = yield (yield (0, ApiHandler_1.getApi)(`/worlds/${this.realmID}`, this)).json();
            var currentConfiguration = {
                "description": {
                    "name": info["name"],
                    "description": info["motd"]
                },
                "options": JSON.parse(info["slots"][parseInt(info["activeSlot"]) - 1]["options"])
            };
            Object.keys(newConfiguration).forEach(key => {
                if (!["description", "options"].includes(key)) {
                    throw new DashError_1.DashError(`Configuration contained invalid key identifier \"${key}\"`, 0x22);
                }
                Object.keys(newConfiguration[key]).forEach(nestedKey => {
                    currentConfiguration[key][nestedKey] = newConfiguration[key][nestedKey];
                });
            });
            var response = yield (0, ApiHandler_1.postApi)(`/worlds/${this.realmID}/configuration`, this, { "Content-Type": "application/json" }, JSON.stringify(currentConfiguration));
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0x23);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x24);
                case 204:
                    return;
                case 500:
                case 400:
                    throw new DashError_1.DashError(`Configuration formatted incorrectly \nStatus code: ${yield response.status}`, 0x25);
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x26);
            }
        });
    }
    applyContent(packUUID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            var response = yield (0, ApiHandler_1.postApi)(`/world/${this.realmID}/content/`, this, { "Content-Type": "application/json" }, JSON.stringify([packUUID]));
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That packUUID doesnt exist", 0x27);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x28);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x29);
            }
        });
    }
    // PUT REQUESTS //
    inviteUser(userXUID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            var response = yield (0, ApiHandler_1.putApi)(`/invites/${this.realmID}/invite/update`, this, { "Content-Type": "application/json" }, JSON.stringify({ "invites": { [userXUID]: "ADD" } }));
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0x2D);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x2E);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x2F);
            }
        });
    }
    removeUser(userXUID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            var response = yield (0, ApiHandler_1.putApi)(`/invites/${this.realmID}/invite/update`, this, { "Content-Type": "application/json" }, JSON.stringify({ "invites": { [userXUID]: "REMOVE" } }));
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0x30);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x31);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x32);
            }
        });
    }
    setDefaultPermission(permission) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            if (!(["OPERATOR", "MEMBER", "VISITOR"].includes(permission))) {
                throw new DashError_1.DashError(`Paramater at index 0 must be either: \"OPERATOR\", \"MEMBER\" or \"VISITOR\", not \"${permission}\"`, 0x33);
            }
            var response = yield (0, ApiHandler_1.putApi)(`/worlds/${this.realmID}/defaultPermission`, this, { "Content-Type": "application/json" }, JSON.stringify({ "permission": permission }));
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0x34);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x35);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x36);
            }
        });
    }
    setUserPermission(userXUID, permission) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            if (!(["OPERATOR", "MEMBER", "VISITOR"].includes(permission))) {
                throw new DashError_1.DashError(`Paramater at index 0 must be either: \"OPERATOR\", \"MEMBER\" or \"VISITOR\", not \"${permission}\"`, 0x37);
            }
            var response = yield (0, ApiHandler_1.putApi)(`/worlds/${this.realmID}/userPermission`, this, { "Content-Type": "application/json" }, JSON.stringify({ "permission": permission, "xuid": userXUID }));
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0x38);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x39);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x3A);
            }
        });
    }
    activateSlot(slot) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            if (!([1, 2, 3].includes(slot))) {
                throw new DashError_1.DashError(`Paramater at index 0 must be either: 1, 2 or 3, not ${slot}`, 0x3B);
            }
            var response = yield (0, ApiHandler_1.putApi)(`/worlds/${this.realmID}/slot/${slot}`, this);
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0x3C);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x3D);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x3E);
            }
        });
    }
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            var response = yield (0, ApiHandler_1.putApi)(`/worlds/${this.realmID}/open`, this);
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0x3F);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x40);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x41);
            }
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            var response = yield (0, ApiHandler_1.putApi)(`/worlds/${this.realmID}/close`, this);
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0x42);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x43);
                case 200:
                    return yield response.json();
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x44);
            }
        });
    }
    // DELETE REQUESTS //
    unblockUser(userXUID) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            var response = yield (0, ApiHandler_1.delApi)(`/worlds/${this.realmID}/blocklist/${userXUID}`, this);
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0x45);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x46);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x47);
            }
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            var response = yield (0, ApiHandler_1.delApi)(`/worlds/${this.realmID}`, this);
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0x48);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x49);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x4A);
            }
        });
    }
    texturePacksRequired(required) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, PermissionHandler_1.checkPermission)(this);
            if (required) {
                var response = yield (0, ApiHandler_1.putApi)(`/world/${this.realmID}/content/texturePacksRequired`, this);
            }
            else {
                var response = yield (0, ApiHandler_1.delApi)(`/world/${this.realmID}/content/texturePacksRequired`, this);
            }
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0x4B);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x4C);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x4D);
            }
        });
    }
}
_realm_instances = new WeakSet(), _realm_fetchBackup = function _realm_fetchBackup(backupID) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, PermissionHandler_1.checkPermission)(this);
        var response = yield (0, ApiHandler_1.getApi)(`/archive/download/world/${this.realmID}/1/${backupID}`, this);
        switch (response.status) {
            case 404:
                throw new DashError_1.DashError("That realm doesnt exist or you dont have access to it", 0x16);
            case 200:
                return yield response.json();
            default:
                throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x17);
        }
    });
}, _realm_latestBackupDetails = function _realm_latestBackupDetails() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, PermissionHandler_1.checkPermission)(this);
        var response = yield (0, ApiHandler_1.getApi)(`/archive/download/world/${this.realmID}/1/latest`, this);
        switch (response.status) {
            case 404:
                throw new DashError_1.DashError("That realm doesnt exist or you dont have access to it", 0x18);
            case 200:
                return yield response.json();
            default:
                throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x19);
        }
    });
};
class client {
    constructor(dash) {
        (() => __awaiter(this, void 0, void 0, function* () {
            this.userHash = dash.userHash;
            this.xstsToken = dash.xstsToken;
            try {
                yield (0, ApiHandler_1.getApi)("/mco/client/compatible", this);
            }
            catch (_a) {
                throw new DashError_1.DashError(DashError_1.DashError.InvalidAuthorization, 0x4E);
            }
        }))();
    }
    // GET REQUESTS //
    compatible(clientVersion = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof (clientVersion) !== "number" && clientVersion != undefined) {
                throw new TypeError(`Unexpected type passed to function`);
            }
            if (clientVersion === undefined) {
                clientVersion = yield (0, VersionHandler_1.getCurrentVersion)();
            }
            ;
            var clientHeaders = { "client-version": clientVersion };
            var response = yield (0, ApiHandler_1.getApi)("/mco/client/compatible", this, clientHeaders);
            var responseText = yield response.text();
            switch (responseText) {
                case "COMPATIBLE":
                    return true;
                case "OUTDATED":
                    return false;
                default:
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedResult, 0x50);
            }
        });
    }
    realms() {
        return __awaiter(this, void 0, void 0, function* () {
            var response = yield (yield (0, ApiHandler_1.getApi)("/worlds", this)).json();
            if (!response.hasOwnProperty("servers")) {
                throw new DashError_1.DashError(`Invalid property: object does not have a property with the name "servers"`, 0x51);
            }
            return yield response["servers"];
        });
    }
    realmInvitesCount() {
        return __awaiter(this, void 0, void 0, function* () {
            var response = yield (0, ApiHandler_1.getApi)(`/invites/count/pending`, this);
            return yield response.json();
        });
    }
    trialStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            var response = yield (0, ApiHandler_1.getApi)(`/trial/new`, this);
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
            var response = yield (0, ApiHandler_1.postApi)(`/invites/v1/link/accept/${realmInvite}`, this);
            switch (response.status) {
                case 403:
                    throw new DashError_1.DashError("That realm doesnt exist or you are already the owner of it", 0x52);
                case 200:
                    return response.json();
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x53);
            }
        });
    }
    // DELETE REQUESTS //
    removeRealm(realmID) {
        return __awaiter(this, arguments, void 0, function* () {
            yield (0, ParamHandler_1.requiredParams)(arguments, [Number]);
            var response = yield (0, ApiHandler_1.delApi)(`/invites/${realmID}`, this);
            switch (response.status) {
                case 404:
                    throw new DashError_1.DashError("That realm doesnt exist", 0x54);
                case 403:
                    throw new DashError_1.DashError("You do not have access to that realm", 0x55);
                case 204:
                    return;
                default:
                    throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedResult} Status code: ${response.status}`, 0x56);
            }
        });
    }
}
class backup {
    constructor(realm, backups, latestBackupFunction, fetchBackupFunction) {
        authentiactingProperties.forEach(property => {
            this[property] = realm[property];
        });
        this.backups = backups;
        this.latest = latestBackupFunction;
        this.fetchBackup = fetchBackupFunction;
    }
}
module.exports = { dash };
