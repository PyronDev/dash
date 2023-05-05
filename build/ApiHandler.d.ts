import { Dash, Realm } from "./interfaces";
declare function sendApi(dash: Dash | Realm, path: string, method: string, data?: any): Promise<any>;
export { sendApi };
