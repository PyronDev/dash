const fetch = require("node-fetch");

async function getCurrentVersion() { 
	var response = await fetch("https://raw.githubusercontent.com/MCMrARM/mc-w10-versiondb/master/versions.json.min");
	var versions: any = await response.json();
	var matchingVersion = versions.reverse().find((array: any[]) => array[2] === 0);
	var currentVersion: string = matchingVersion[0];
	return currentVersion;
};

export { getCurrentVersion };