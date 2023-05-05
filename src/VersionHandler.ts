const fetch = require("node-fetch");

async function getCurrentVersion() {
	let response = await fetch("https://raw.githubusercontent.com/MCMrARM/mc-w10-versiondb/master/versions.json.min");
	let versions: any = await response.json();
	let matchingVersion = versions.reverse().find((array: any[]) => array[2] === 0);
	let currentVersion: string = matchingVersion[0];
	return currentVersion;
};

export { getCurrentVersion };