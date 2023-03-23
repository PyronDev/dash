import { DashError } from "./DashError";

async function checkPermission(realm: any) {
	if (!realm.owner) {
		throw new DashError("This method requires you to be owner of the specified realm.");
	}

}
export { checkPermission };