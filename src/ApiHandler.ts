const fetch = require("node-fetch");
import { DashError } from "./DashError";
import { getCurrentVersion } from './VersionHandler';
const chalk = require('chalk');
import { Dash, Realm } from "./interfaces";

async function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendApi(dash: Dash | Realm, path: string, method: string, data: any = {}) {
	let headers: object = { "authorization": `XBL3.0 x=${dash.userHash};${dash.xstsToken}`, "client-version": await getCurrentVersion(), "user-agent": "MCPE/UWP" };
	if (!data.headers) data.headers = {};
	headers = Object.assign(headers, data.headers);
	switch (method.toUpperCase()) {
		case "GET":
			try {
				var response = await fetch(`https://pocket.realms.minecraft.net${path}`, { method: method, headers: headers });
			} catch {
				throw new DashError(DashError.UnexpectedError);
			};
			if (!data.retry?.returnOn?.includes(response.status)) {
				for (let num = 1; num <= data.retry?.retries; num++) {
					let response = await fetch(`https://pocket.realms.minecraft.net${path}`, { method: method, headers: headers });
					if (data.retry?.returnOn?.includes(response.status)) return response;
					let date = new Date();
					if (data.retry?.retryMessages) console.log(`${chalk.gray(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`)} request failed: ${chalk.yellow("retrying after 3s")}`);
					await sleep(3000);
				}
			}
			break;
		default:
			try {
				var response = await fetch(`https://pocket.realms.minecraft.net${path}`, { method: method, headers: headers, body: JSON.stringify(data.body) || {} });
			} catch {
				throw new DashError(DashError.UnexpectedError);
			};
			if (!data.retry?.returnOn?.includes(response.status)) {
				for (let num = 1; num <= data.retry?.retries; num++) {
					let response = await fetch(`https://pocket.realms.minecraft.net${path}`, { method: method, headers: headers, body: JSON.stringify(data.body) });
					if (data.retry?.returnOn?.includes(response.status)) return response;
					let date = new Date();
					if (data.retry?.retryMessages) console.log(`${chalk.gray(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`)} request failed: ${chalk.yellow("retrying after 3s")}`);
					await sleep(3000);
				}
			}
			break;
	}
	return response;

}

export { sendApi };