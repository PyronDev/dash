# Dash
## Pyron Dash

An Wapper for the Bedrock Realms API [here](https://www.postman.com/LucienHH/workspace/bedrock-realms)

currently for JS but python support might come soon

### javascript (async)

```js
const { dash } = require('./dash/index.js');
const { dashAuthenticate } = require('@pyrondev/dash-auth');
(async () => {
	const dashAuth = await new dashAuthenticate("email", "password");
	var Dash = await new dash(dashAuth);
	console.log(await Dash.getWorlds()); // lists all realms that the account owns or has joined

})();
```
