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
exports.putApi = exports.delApi = exports.postApi = exports.getApi = void 0;
const fetch = require("node-fetch");
const DashError_1 = require("./DashError");
const chalk = require('chalk');
const VersionHandler_1 = require("./VersionHandler");
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, ms));
    });
}
function getApi(path, dashClass, customHeaders = {}, retries = { "retries": 0, "returnOn": [], "retryMessages": false }) {
    return __awaiter(this, void 0, void 0, function* () {
        var reqHeaders = { "authorization": `XBL3.0 x=${dashClass.userHash};${dashClass.xstsToken}`, "client-version": yield (0, VersionHandler_1.getCurrentVersion)(), "user-agent": "MCPE/UWP" };
        Object.keys(customHeaders).forEach(key => { reqHeaders[key] = customHeaders[key]; });
        try {
            var response = yield fetch(`https://pocket.realms.minecraft.net${path}`, { headers: reqHeaders });
        }
        catch (error) {
            throw new DashError_1.DashError(`${DashError_1.DashError.UnexpectedError}\nError: ${error}`, 0x57);
        }
        ;
        if (retries["retries"] !== 0 && !retries["returnOn"].includes(response.status)) {
            for (var num = 1; num <= retries["retries"]; num++) {
                var response = yield fetch(`https://pocket.realms.minecraft.net${path}`, { headers: reqHeaders });
                if (!retries["returnOn"].includes(response.status)) {
                    var date = new Date();
                    if (retries["retryMessages"]) {
                        console.log(`${chalk.gray(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`)} request failed: ${chalk.yellow("retrying after 3s")}`);
                    }
                    yield sleep(3000);
                    continue;
                }
                return response;
            }
            throw new DashError_1.DashError(`Could not get correct response after ${retries["retries"]} retries`, 0x58);
        }
        return response;
    });
}
exports.getApi = getApi;
function postApi(path, dashClass, customHeaders = {}, reqBody = {}, retries = { "retries": 0, "returnOn": [] }) {
    return __awaiter(this, void 0, void 0, function* () {
        var reqHeaders = { "authorization": `XBL3.0 x=${dashClass.userHash};${dashClass.xstsToken}`, "client-version": yield (0, VersionHandler_1.getCurrentVersion)(), "user-agent": "MCPE/UWP" };
        Object.keys(customHeaders).forEach(key => {
            reqHeaders[key] = customHeaders[key];
        });
        try {
            var response = yield fetch(`https://pocket.realms.minecraft.net${path}`, { method: "post", headers: reqHeaders, body: reqBody });
        }
        catch (_a) {
            throw new DashError_1.DashError(DashError_1.DashError.UnexpectedError, 0x59);
        }
        ;
        if (retries["retries"] !== 0 && !retries["returnOn"].includes(response.status)) {
            for (var num = 1; num <= retries["retries"]; num++) {
                var response = yield fetch(`https://pocket.realms.minecraft.net${path}`, { method: "post", headers: reqHeaders, body: reqBody, redirect: "follow" });
                if (!retries["returnOn"].includes(response.status)) {
                    var date = new Date();
                    console.log(`${chalk.gray(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`)} request failed: ${chalk.yellow("retrying after 3s")}`);
                    yield sleep(3000);
                    continue;
                }
                return response;
            }
            throw new DashError_1.DashError(`Could not get correct response after ${retries["retries"]} retries`);
        }
        return response;
    });
}
exports.postApi = postApi;
function delApi(path, dashClass, customHeaders = {}, retries = { "retries": 0, "returnOn": [] }) {
    return __awaiter(this, void 0, void 0, function* () {
        var reqHeaders = { "authorization": `XBL3.0 x=${dashClass.userHash};${dashClass.xstsToken}`, "client-version": yield (0, VersionHandler_1.getCurrentVersion)(), "user-agent": "MCPE/UWP" };
        Object.keys(customHeaders).forEach(key => {
            reqHeaders[key] = customHeaders[key];
        });
        try {
            var response = yield fetch(`https://pocket.realms.minecraft.net${path}`, { method: "delete", headers: reqHeaders });
        }
        catch (_a) {
            throw new DashError_1.DashError(DashError_1.DashError.UnexpectedError, 0x5A);
        }
        ;
        if (retries["retries"] !== 0 && !retries["returnOn"].includes(response.status)) {
            for (var num = 1; num <= retries["retries"]; num++) {
                var response = yield fetch(`https://pocket.realms.minecraft.net${path}`, { method: "delete", headers: reqHeaders, redirect: "follow" });
                if (!retries["returnOn"].includes(response.status)) {
                    var date = new Date();
                    console.log(`${chalk.gray(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`)} request failed: ${chalk.yellow("retrying after 3s")}`);
                    yield sleep(3000);
                    continue;
                }
                return response;
            }
            throw new DashError_1.DashError(`Could not get correct response after ${retries["retries"]} retries`);
        }
        return response;
    });
}
exports.delApi = delApi;
function putApi(path, dashClass, customHeaders = {}, reqBody = {}, retries = { "retries": 0, "returnOn": [] }) {
    return __awaiter(this, void 0, void 0, function* () {
        var reqHeaders = { "authorization": `XBL3.0 x=${dashClass.userHash};${dashClass.xstsToken}`, "client-version": yield (0, VersionHandler_1.getCurrentVersion)(), "user-agent": "MCPE/UWP" };
        Object.keys(customHeaders).forEach(key => {
            reqHeaders[key] = customHeaders[key];
        });
        try {
            var response = yield fetch(`https://pocket.realms.minecraft.net${path}`, { method: "put", headers: reqHeaders, body: reqBody, redirect: "follow" });
        }
        catch (_a) {
            throw new DashError_1.DashError(DashError_1.DashError.UnexpectedError, 0x5B);
        }
        ;
        if (retries["retries"] !== 0 && !retries["returnOn"].includes(response.status)) {
            for (var num = 1; num <= retries["retries"]; num++) {
                var response = yield fetch(`https://pocket.realms.minecraft.net${path}`, { method: "put", headers: reqHeaders, body: reqBody, redirect: "follow" });
                if (!retries["returnOn"].includes(response.status)) {
                    var date = new Date();
                    console.log(`${chalk.gray(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`)} request failed: ${chalk.yellow("retrying after 3s")}`);
                    yield sleep(3000);
                    continue;
                }
                return response;
            }
            throw new DashError_1.DashError(`Could not get correct response after ${retries["retries"]} retries`);
        }
        return response;
    });
}
exports.putApi = putApi;
