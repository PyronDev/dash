interface Dash {
	userHash?: string;
	xstsToken?: string;
	isCombo?: boolean;
	token?: any;
	args?: any;
	dash?: any;
}

interface Realm {
	userHash?: string;
	xstsToken?: string;
	realmID?: number;
	owner?: boolean;
	dash?: Dash;
}
interface Auth {
	token: any;
	args: any;
	isCombo: boolean;
}

export { Dash, Realm, Auth };