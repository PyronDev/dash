interface Dash {
	userHash?: string;
	xstsToken?: string;
}

interface Realm {
	userHash?: string;
	xstsToken?: string;
	realmID?: number;
	owner?: boolean;
	dash?: Dash;
}
interface Auth {
	xuid: string;
	user_hash: string;
	xsts_token: string;
	display_claims: object;
	expires_on: string;
}

export { Dash, Realm, Auth };