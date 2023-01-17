const fetch = require("node-fetch");
const { DashError } = require("./DashError.js");
const chalk = require("chalk");
const { getCurrentVersion } = require("./VersionHandler.js")

async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function getApi(path, dashClass, customHeaders = {}, retries = 0) {
	headers = {"authorization": `XBL3.0 x=${dashClass.userHash};${dashClass.xstsToken}`,"client-version": await getCurrentVersion(),"user-agent": "MCPE/UWP",}
		Object.keys(customHeaders).forEach(key => {
			headers[key] = customHeaders[key];
		})
	try{ var response = await fetch(`https://pocket.realms.minecraft.net${path}`, { "headers": headers }); } catch { throw new DashError(DashError.UnexpectedError); };
	if (retries !== 0 && response.status !== 200){
		for (var num = 1; num <= retries; num++) {
			var response = await fetch(`https://pocket.realms.minecraft.net${path}`, { "headers": headers });
			if (response.status !== 200){
				var date = new Date();
				console.log(`${chalk.gray(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`)} ping failed: ${chalk.yellow("retrying after 3s")}`);
				await sleep(3000);
				continue;
			}
			return response;
		}
		throw new DashError("Could not get correct response after 5 retries");
	}
	return response;
}

async function postApi(path, dashClass, customHeaders = {}, retries = 0) {
	headers = {"authorization": `XBL3.0 x=${dashClass.userHash};${dashClass.xstsToken}`,"client-version": await getCurrentVersion(),"user-agent": "MCPE/UWP",}
		Object.keys(customHeaders).forEach(key => {
			headers[key] = customHeaders[key];
		})
	try{ var response = await fetch(`https://pocket.realms.minecraft.net${path}`, { "method": "post", "headers": headers }); } catch { throw new DashError(DashError.UnexpectedError); };
	if (retries !== 0 && response.status !== 200){
		for (var num = 1; num <= retries; num++) {
			var response = await fetch(`https://pocket.realms.minecraft.net${path}`, { "method": "post", "headers": headers });
			if (response.status !== 200){
				var date = new Date();
				console.log(`${chalk.gray(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}]`)} ping failed: ${chalk.yellow("retrying after 3s")}`);
				await sleep(3000);
				continue;
			}
			return response;
		}
		throw new DashError("Could not get correct response after 5 retries");
	}
	return response;
}

module.exports = { getApi, postApi };