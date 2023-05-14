import { Dash, Realm, Auth } from './interfaces';
declare class dash implements Dash {
    userHash?: string;
    xstsToken?: string;
    args?: any;
    isCombo?: boolean;
    constructor(auth: Auth);
    refreshCredentials(): Promise<void>;
    realm(realmID: number): Promise<realm>;
    realmFromInvite(realmInvite: string): Promise<realm>;
    client(): Promise<client>;
}
declare class realm implements Realm {
    #private;
    userHash?: string;
    xstsToken?: string;
    currentVersion?: string;
    owner?: boolean;
    realmID?: number;
    dash?: Dash;
    static fromID(dash: Dash, realmID: number): Promise<realm>;
    static fromInvite(dash: Dash, realmInvite: string): Promise<realm>;
    info(): Promise<any>;
    address(retryMessages?: boolean): Promise<any>;
    onlinePlayers(): Promise<any>;
    content(): Promise<any>;
    subscription(): Promise<any>;
    backups(): Promise<backup>;
    invite(): Promise<any>;
    blocklist(): Promise<any>;
    regenerateInvite(): Promise<any>;
    blockUser(userXUID: number): Promise<void>;
    updateConfiguration(newConfiguration: any): Promise<void>;
    applyContent(packUUIDS: string[]): Promise<void>;
    inviteUser(userXUID: number): Promise<any>;
    removeUser(userXUID: number): Promise<any>;
    setDefaultPermission(permission: "string"): Promise<void>;
    setUserPermission(userXUID: number, permission: string): Promise<void>;
    activateSlot(slot: number): Promise<any>;
    open(): Promise<any>;
    close(): Promise<any>;
    unblockUser(userXUID: number): Promise<void>;
    delete(): Promise<void>;
    texturePacksRequired(required: boolean): Promise<void>;
}
declare class client implements Dash {
    userHash?: string;
    xstsToken?: string;
    constructor(dash: Dash);
    compatible(clientVersion?: string | undefined): Promise<boolean>;
    realms(): Promise<any>;
    realmInvitesCount(): Promise<any>;
    trialStatus(): Promise<{
        eligible: boolean;
        redeemed: boolean;
    }>;
    acceptInvite(realmInvite: string): Promise<any>;
    removeRealm(realmID: number): Promise<void>;
}
declare class backup {
    backups: any;
    latest: Function;
    fetchBackup: Function;
    constructor(realm: Realm, backups: any, latestBackupFunction: Function, fetchBackupFunction: Function);
}
export { dash };
