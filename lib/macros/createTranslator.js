"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_module_imports_1 = require("@babel/helper-module-imports");
const translations_1 = require("@jochlain/translations");
const babel_plugin_macros_1 = require("babel-plugin-macros");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cache = __importStar(require("../cache"));
const intlFormatter_1 = __importDefault(require("./intlFormatter"));
const AVAILABLE_OPTION_KEYS = ['domain', 'host', 'locale'];
const REGEX_FILENAME = /^(\w+)(\+intl-icu)?\.([\w_]+)(\.(ya?ml|xlf|php|csv|json|ini|dat|res|mo|po|qt))$/i;
const SIGNATURE = `createTranslator({ domain?: string, host?: string, locale?: identifier|string })`;
let counter = 0;
exports.default = (types, loader, options) => {
    return new FactoryTranslator(types, loader, options);
};
class FactoryTranslator {
    constructor(types, loader, options) {
        this.types = types;
        this.loader = loader;
        this.options = options;
    }
    buildNode(node) {
        if (!node)
            return;
        const { domain, host, locale } = this.getOptions(node);
        const rootDir = host ? path_1.default.join(this.options.rootDir, host) : this.options.rootDir;
        const catalogs = this.getCatalogs(node, rootDir, domain, locale);
        const method = (0, helper_module_imports_1.addDefault)(node.parentPath, '@jochlain/translations', { nameHint: `createTranslator_i${counter++}` });
        const options = [this.types.objectProperty(this.types.identifier('formatter'), (0, intlFormatter_1.default)(this.types, node))];
        if (locale)
            options.push(this.types.objectProperty(this.types.identifier('locale'), this.types.stringLiteral(locale)));
        if (domain)
            options.push(this.types.objectProperty(this.types.identifier('domain'), this.types.stringLiteral(domain)));
        return this.types.callExpression(method, [
            this.types.valueToNode(catalogs),
            this.types.objectExpression(options)
        ]);
    }
    getCatalogs(node, rootDir, domain, locale) {
        const files = this.getFiles(node, rootDir, domain, locale);
        const catalogs = {};
        for (let idx = 0; idx < files.length; idx++) {
            const matches = files[idx].match(REGEX_FILENAME);
            if (!matches)
                continue;
            const [, domain, , locale] = matches;
            const key = path_1.default.relative(process.cwd(), path_1.default.join(rootDir, file));
            if (!cache.get(key)) {
                const filename = path_1.default.join(rootDir, files[idx]);
                const content = fs_1.default.readFileSync(filename).toString();
                cache.set(key, this.loader.load(content));
            }
            Object.assign(catalogs, (0, translations_1.mergeCatalogs)(catalogs, { [locale]: { [domain]: cache.get(key) } }));
        }
        return catalogs;
    }
    getFiles(node, rootDir, domain, locale) {
        try {
            const stat = fs_1.default.lstatSync(rootDir);
            if (stat.isDirectory()) {
                return fs_1.default.readdirSync(rootDir).filter((filename) => {
                    const matches = filename.match(REGEX_FILENAME);
                    if (!matches)
                        return false;
                    if (domain && matches[1] !== domain)
                        return false;
                    if (locale && matches[3] !== locale)
                        return false;
                    return this.loader.extension.test(matches[4]);
                });
            }
        }
        catch (error) {
        }
        throw node.parentPath.buildCodeFrameError(`Host parameter must refer to a directory`, babel_plugin_macros_1.MacroError);
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