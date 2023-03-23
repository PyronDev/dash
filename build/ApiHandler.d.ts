declare function getApi(path: any, dashClass: any, customHeaders?: any, retries?: any): Promise<any>;
declare function postApi(path: string, dashClass: any, customHeaders?: any, reqBody?: any, retries?: any): Promise<any>;
declare function delApi(path: string, dashClass: any, customHeaders?: any, retries?: any): Promise<any>;
declare function putApi(path: string, dashClass: any, customHeaders?: any, reqBody?: any, retries?: any): Promise<any>;
export { getApi, postApi, delApi, putApi };
