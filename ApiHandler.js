const fetch = require("node-fetch");
const { getCurrentVersion } = require("./VersionHandler.js")

async function getApi(path, dashClass, customHeaders = {}) {
	headers = {"authorization": `XBL3.0 x=${dashClass.userHash};${dashClass.xstsToken}`,"client-version": await getCurrentVersion(),"user-agent": "MCPE/UWP",}
		Object.keys(customHeaders).forEach(key => {
			headers[key] = customHeaders[key];
		})
	try{ return await fetch(`https://pocket.realms.minecraft.net${path}`, { "headers": headers }); } catch { throw new DashError(DashError.UnexpectedError); };
}

module.exports = { getApi };