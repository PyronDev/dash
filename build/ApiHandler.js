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
exports.sendApi = void 0;
const fetch = require("node-fetch");
const DashError_1 = require("./DashError");
const VersionHandler_1 = require("./VersionHandler");
const chalk = require('chalk');
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, ms));
    });
}
function sendApi(dash, path, method, data = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    return __awaiter(this, void 0, void 0, function* () {
        let headers = { "authorization": `XBL3.0 x=${dash.userHash};${dash.xstsToken}`, "client-version": yield (0, VersionHandler_1.getCurrentVersion)(), "user-agent": "MCPE/UWP" };
        if (!data.headers)
            data.headers = {};
        headers = Object.assign(headers, data.headers);
        switch (method.toUpperCase()) {
            case "GET":
                try {
                    var response = yield fetch(`https://pocket.realms.minecraft.net${path}`, { method: method, headers: headers });
                }
                catch (_o) {
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedError);
                }
                ;
                if (!((_b = (_a = data.retry) === null || _a === void 0 ? void 0 : _a.returnOn) === null || _b === void 0 ? void 0 : _b.includes(response.status))) {
                    for (let num = 1; num <= ((_c = data.retry) === null || _c === void 0 ? void 0 : _c.retries); num++) {
                        let response = yield fetch(`https://pocket.realms.minecraft.net${path}`, { method: method, headers: headers });
                        if ((_e = (_d = data.retry) === null || _d === void 0 ? void 0 : _d.returnOn) === null || _e === void 0 ? void 0 : _e.includes(response.status))
                            return response;
                        let date = new Date();
                        if ((_f = data.retry) === null || _f === void 0 ? void 0 : _f.retryMessages)
                            console.log(`${chalk.gray(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`)} request failed: ${chalk.yellow("retrying after 3s")}`);
                        yield sleep(3000);
                    }
                }
                break;
            default:
                try {
                    var response = yield fetch(`https://pocket.realms.minecraft.net${path}`, { method: method, headers: headers, body: JSON.stringify(data.body) || {} });
                }
                catch (_p) {
                    throw new DashError_1.DashError(DashError_1.DashError.UnexpectedError);
                }
                ;
                if (!((_h = (_g = data.retry) === null || _g === void 0 ? void 0 : _g.returnOn) === null || _h === void 0 ? void 0 : _h.includes(response.status))) {
                    for (let num = 1; num <= ((_j = data.retry) === null || _j === void 0 ? void 0 : _j.retries); num++) {
                        let response = yield fetch(`https://pocket.realms.minecraft.net${path}`, { method: method, headers: headers, body: JSON.stringify(data.body) });
                        if ((_l = (_k = data.retry) === null || _k === void 0 ? void 0 : _k.returnOn) === null || _l === void 0 ? void 0 : _l.includes(response.status))
                            return response;
                        let date = new Date();
                        if ((_m = data.retry) === null || _m === void 0 ? void 0 : _m.retryMessages)
                            console.log(`${chalk.gray(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`)} request failed: ${chalk.yellow("retrying after 3s")}`);
                        yield sleep(3000);
                    }
                }
                break;
        }
        return response;
    });
}
exports.sendApi = sendApi;
