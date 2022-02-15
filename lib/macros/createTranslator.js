"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const babel_plugin_macros_1 = require("babel-plugin-macros");
const path_1 = __importDefault(require("path"));
const import_1 = __importDefault(require("../utils/import"));
const abstract_1 = __importDefault(require("./abstract"));
const AVAILABLE_OPTION_KEYS = ['domain', 'host', 'locale'];
const SIGNATURE = `createTranslator({ domain?: string, host?: string, locale?: identifier|string })`;
exports.default = (types, loader, options) => {
    return new CreateTranslatorMacro(types, loader, options);
};
class CreateTranslatorMacro extends abstract_1.default {
    buildNode(node) {
        if (node === null)
            return;
        const { domain, host, locale } = this.getOptions(node);
        const rootDir = host ? path_1.default.join(this.options.rootDir, host) : this.options.rootDir;
        const method = (0, import_1.default)(node, '@jochlain/translations', 'createTranslator');
        const catalogs = this.getCatalogs(node, rootDir, domain, locale);
        const options = [this.types.objectProperty(this.types.identifier('formatter'), this.createIntlFormatter(node))];
        if (locale)
            options.push(this.types.objectProperty(this.types.identifier('locale'), this.types.stringLiteral(locale)));
        if (domain)
            options.push(this.types.objectProperty(this.types.identifier('domain'), this.types.stringLiteral(domain)));
        return this.types.callExpression(method, [
            this.types.valueToNode(catalogs),
            this.types.objectExpression(options)
        ]);
    }
    getOptions(node) {
        if (node.node.arguments.length > 1) {
            throw node.parentPath.buildCodeFrameError(`Received an invalid number of arguments (must be 0 or 1)\n  Signature: ${SIGNATURE}`, babel_plugin_macros_1.MacroError);
        }
        if (!node.node.arguments.length)
            return {};
        if (!this.types.isObjectExpression(node.node.arguments[0])) {
            throw node.parentPath.buildCodeFrameError(`Parameter must be an object\n  Signature: ${SIGNATURE}`, babel_plugin_macros_1.MacroError);
        }
        return node.node.arguments[0].properties.reduce((accu, property) => {
            if (!this.types.isObjectProperty(property)) {
                throw node.parentPath.buildCodeFrameError(`Method option parameter must be an object of strings\n  Signature: ${SIGNATURE}`, babel_plugin_macros_1.MacroError);
            }
            if (!this.types.isIdentifier(property.key) && !this.types.isStringLiteral(property.key)) {
                throw node.parentPath.buildCodeFrameError(`Method option parameter has an invalid key\n  Signature: ${SIGNATURE}`, babel_plugin_macros_1.MacroError);
            }
            const key = this.types.isIdentifier(property.key) ? property.key.name : property.key.value;
            if (!AVAILABLE_OPTION_KEYS.includes(key)) {
                throw node.parentPath.buildCodeFrameError(`Option ${key} is not allowed\n  Signature: ${SIGNATURE}`, babel_plugin_macros_1.MacroError);
            }
            if (!this.types.isStringLiteral(property.value)) {
                throw node.parentPath.buildCodeFrameError(`Option ${key} must be a string\n  Signature: ${SIGNATURE}`, babel_plugin_macros_1.MacroError);
            }
            return ({ ...accu, [key]: property.value.value });
        }, {});
    }
}
//# sourceMappingURL=createTranslator.js.map