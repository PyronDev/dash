const fetch = require("node-fetch");

async function getCurrentVersion() { return (await (await fetch("https://raw.githubusercontent.com/MCMrARM/mc-w10-versiondb/master/versions.json.min")).json()).reverse().find(array => array[2] === 0)[0]; };

module.exports = { getCurrentVersion };