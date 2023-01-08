const { exit } = require('process');

try {
	const { dashAuthenticate } = require('./index.js');
	(async () => {
		try {
			const dashAuth = await new dashAuthenticate("email", "password");
		} catch (e) {
			if (e.toString() != "XRError: Invalid credentials or 2FA enabled") {
				console.log(`Error: test.js ran with error: \"${e}\"`);
				var exec = require('child_process').exec;
				process.exit(1);
			} else {
				console.log("Test 1 passed");
			}
		}
	})();
} catch (e) {
	if (e.toString() != "XRError: Invalid credentials or 2FA enabled") {
		console.log(`Error: test.js ran with error: \"${e}\"`);
		var exec = require('child_process').exec;
		process.exit(1);
	} else {
		console.log("Test 2 passed");
	}
}