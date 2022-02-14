"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.set = void 0;
const CACHE = {};
const set = (key, value) => Object.assign(CACHE, { [key]: value });
exports.set = set;
const get = (key) => CACHE[key];
exports.get = get;
//# sourceMappingURL=cache.js.map