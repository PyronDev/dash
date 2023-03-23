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
exports.getCurrentVersion = void 0;
const fetch = require("node-fetch");
function getCurrentVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        var response = yield fetch("https://raw.githubusercontent.com/MCMrARM/mc-w10-versiondb/master/versions.json.min");
        var versions = yield response.json();
        var matchingVersion = versions.reverse().find((array) => array[2] === 0);
        var currentVersion = matchingVersion[0];
        return currentVersion;
    });
}
exports.getCurrentVersion = getCurrentVersion;
;
