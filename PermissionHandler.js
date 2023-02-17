const { DashError } = require('./DashError');

async function checkPermission(realm) {
	if (!realm.owner) {
		throw new DashError("This method requires you to be owner of the specified realm.");
	}

}
module.exports = { checkPermission };