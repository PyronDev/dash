const fetch = require("node-fetch");
import { DashError } from "./DashError";
const chalk = require('chalk');
import { getCurrentVersion } from "./VersionHandler";

async function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function getApi(path: any, dashClass: any, customHeaders: any = {}, retries: any = {"retries": 0, "returnOn":[] ,"retryMessages": false}) {
	var reqHeaders: any = {"authorization": `XBL3.0 x=${dashClass.userHash};${dashClass.xstsToken}`,"client-version": await getCurrentVersion(),"user-agent": "MCPE/UWP"};
	Object.keys(customHeaders).forEach(key => { reqHeaders[key] = customHeaders[key]; });
	try{ var response = await fetch(`https://pocket.realms.minecraft.net${path}`, { headers: reqHeaders }); } catch (error) { throw new DashError(`${DashError.UnexpectedError}\nError: ${error}`, 0x57); };
	if (retries["retries"] !== 0 && !retries["returnOn"].includes(response.status)){
		for (var num = 1; num <= retries["retries"]; num++) {
			var response = await fetch(`https://pocket.realms.minecraft.net${path}`, { headers: reqHeaders});
			if (!retries["returnOn"].includes(response.status)){
				var date = new Date();
				if (retries["retryMessages"]) {
					console.log(`${chalk.gray(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`)} request failed: ${chalk.yellow("retrying after 3s")}`);
				}
				await sleep(3000);
				continue;
			}
			return response;
		}
		throw new DashError(`Could not get correct response after ${retries["retries"]} retries`, 0x58);
	}
	return response;
}

async function postApi(path: string, dashClass: any, customHeaders: any = {}, reqBody: any = {}, retries: any = {"retries": 0, "returnOn":[]}) {
	var reqHeaders: any = {"authorization": `XBL3.0 x=${dashClass.userHash};${dashClass.xstsToken}`,"client-version": await getCurrentVersion(),"user-agent": "MCPE/UWP"};
		Object.keys(customHeaders).forEach(key => {
			reqHeaders[key] = customHeaders[key];
		})
	try{ var response = await fetch(`https://pocket.realms.minecraft.net${path}`, { method: "post", headers: reqHeaders, body: reqBody }); } catch { throw new DashError(DashError.UnexpectedError, 0x59); };
	if (retries["retries"] !== 0 && !retries["returnOn"].includes(response.status)){
		for (var num = 1; num <= retries["retries"]; num++) {
			var response = await fetch(`https://pocket.realms.minecraft.net${path}`, { method: "post", headers: reqHeaders, body: reqBody, redirect: "follow" });
			if (!retries["returnOn"].includes(response.status)){
				var date = new Date();
				console.log(`${chalk.gray(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`)} request failed: ${chalk.yellow("retrying after 3s")}`);
				await sleep(3000);
				continue;
			}
			return response;
		}
		throw new DashError(`Could not get correct response after ${retries["retries"]} retries`);
	}
	return response;
}

async function delApi(path: string, dashClass: any, customHeaders: any = {}, retries: any = {"retries": 0, "returnOn":[]}) {
	var reqHeaders: any = {"authorization": `XBL3.0 x=${dashClass.userHash};${dashClass.xstsToken}`,"client-version": await getCurrentVersion(),"user-agent": "MCPE/UWP"};
		Object.keys(customHeaders).forEach(key => {
			reqHeaders[key] = customHeaders[key];
		})
	try{ var response = await fetch(`https://pocket.realms.minecraft.net${path}`, { method: "delete", headers: reqHeaders }); } catch { throw new DashError(DashError.UnexpectedError, 0x5A); };
	if (retries["retries"] !== 0 && !retries["returnOn"].includes(response.status)){
		for (var num = 1; num <= retries["retries"]; num++) {
			var response = await fetch(`https://pocket.realms.minecraft.net${path}`, { method: "delete", headers: reqHeaders, redirect: "follow" });
			if (!retries["returnOn"].includes(response.status)){
				var date = new Date();
				console.log(`${chalk.gray(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`)} request failed: ${chalk.yellow("retrying after 3s")}`);
				await sleep(3000);
				continue;
			}
			return response;
		}
		throw new DashError(`Could not get correct response after ${retries["retries"]} retries`);
	}
	return response;
}

async function putApi(path: string, dashClass: any, customHeaders: any = {}, reqBody: any = {},retries: any = {"retries": 0, "returnOn":[]}) {
	var reqHeaders: any = {"authorization": `XBL3.0 x=${dashClass.userHash};${dashClass.xstsToken}`,"client-version": await getCurrentVersion(),"user-agent": "MCPE/UWP"};
	Object.keys(customHeaders).forEach(key => {
			reqHeaders[key] = customHeaders[key];
		})
	try{ var response = await fetch(`https://pocket.realms.minecraft.net${path}`, { method: "put", headers: reqHeaders, body: reqBody, redirect: "follow" }); } catch { throw new DashError(DashError.UnexpectedError, 0x5B); };
	if (retries["retries"] !== 0 && !retries["returnOn"].includes(response.status)){
		for (var num = 1; num <= retries["retries"]; num++) {
			var response = await fetch(`https://pocket.realms.minecraft.net${path}`, { method: "put", headers: reqHeaders, body: reqBody, redirect: "follow" });
			if (!retries["returnOn"].includes(response.status)){
				var date = new Date();
				console.log(`${chalk.gray(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`)} request failed: ${chalk.yellow("retrying after 3s")}`);
				await sleep(3000);
				continue;
			}
			return response;
		}
		throw new DashError(`Could not get correct response after ${retries["retries"]} retries`);
	}
	return response;
}
export { getApi, postApi, delApi, putApi };