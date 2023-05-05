import { DashError } from "./DashError";
import { Realm } from "./interfaces";

async function checkPermission(realm: Realm) {
	if (!realm.owner) {
		throw new DashError("This method requires you to be owner of the specified realm.");
	}

}
export { checkPermission };