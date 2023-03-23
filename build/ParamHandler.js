"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requiredParams = void 0;
const DashError_1 = require("./DashError");
function requiredParams(Arguments, argTypes) {
    return __awaiter(this, void 0, void 0, function* () {
        var receivedArgsLen = Arguments.length;
        var expectedArgsLen = argTypes.length;
        if (receivedArgsLen != expectedArgsLen) {
            throw new DashError_1.DashError(`Function expected ${expectedArgsLen} arguments, but received ${receivedArgsLen}.`);
        }
        argTypes.forEach((type, index) => {
            if (type !== Arguments[index].constructor) {
                throw new DashError_1.DashError(`Function expected argument at index ${index} to be a ${type.name} type.`);
            }
        });
    });
}
exports.requiredParams = requiredParams;
