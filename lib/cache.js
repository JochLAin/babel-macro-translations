"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clear = exports.get = exports.set = void 0;
let CACHE = {};
const set = (key, value) => Object.assign(CACHE, { [key]: value });
exports.set = set;
const get = (key) => CACHE[key];
exports.get = get;
const clear = () => CACHE = {};
exports.clear = clear;
//# sourceMappingURL=cache.js.map