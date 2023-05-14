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
    token: any;
    args: any;
    isCombo: boolean;
}
export { Dash, Realm, Auth };
