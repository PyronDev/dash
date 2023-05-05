import { DashError } from "./DashError";

async function requiredParams(Arguments: IArguments, argTypes: object[]) {
	let receivedArgsLen: number = Arguments.length;
	let expectedArgsLen: number = argTypes.length;
	if (receivedArgsLen != expectedArgsLen) {
		throw new DashError(`Function expected ${expectedArgsLen} arguments, but received ${receivedArgsLen}.`);
	}
	argTypes.forEach((type: any, index: number) => {
		if (type !== Arguments[index].constructor) {
			throw new DashError(`Function expected argument at index ${index} to be a ${type.name} type.`);
		}
	});
}

export { requiredParams };