const { DashError } = require("./DashError.js");

async function requiredParams(Arguments, argTypes) {
	receivedArgsLen = Arguments.length;
	expectedArgsLen = argTypes.length;
	if (receivedArgsLen != expectedArgsLen) {
		throw new DashError(`Function expected ${expectedArgsLen} arguments, but received ${receivedArgsLen}.`);
	}
	argTypes.forEach((type,index) => {
		if (type !== Arguments[index].constructor) {
			throw new DashError(`Function expected argument at index ${index} to be a ${type.name} type.`);
		}
	});
}

module.exports =  { requiredParams }