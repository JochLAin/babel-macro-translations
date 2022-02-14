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
const translations_1 = require("@jochlain/translations");
const babel_plugin_macros_1 = require("babel-plugin-macros");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cache = __importStar(require("../cache"));
const AVAILABLE_OPTION_KEYS = ['domain', 'host', 'locale'];
const REGEX_FILENAME = /^(\w+)(\+intl-icu)?\.([\w_]+)(\.(ya?ml|xlf|php|csv|json|ini|dat|res|mo|po|qt))$/i;
const SIGNATURE = `translate(message: identifier|string, replacements: identifier|{ [key: string]: number|string }, { domain: string = 'messages', locale: identifier|string = 'en', host?: string })`;
exports.default = (types, loader, options) => {
    return new FactoryTranslate(types, loader, options);
};
class FactoryTranslate {
    constructor(types, loader, options) {
        this.types = types;
        this.loader = loader;
        this.options = options;
    }
    buildNode(node) {
        if (!node)
            return;
        if (this.types.isStringLiteral(node.node.arguments[0])) {
            if (this.isLocaleLiteral(node)) {
                return this.buildNodeWithLiteralLocaleAndMessage(node);
            }
            return this.buildNodeWithIdentifierLocaleAndLiteralMessage(node);
        }
        if (this.isLocaleLiteral(node)) {
            return this.buildNodeWithLiteralLocaleAndIdentifierMessage(node);
        }
        return this.buildNodeWithIdentifierLocaleAndMessage(node);
    }
    buildNodeWithIdentifierLocaleAndLiteralMessage(node) {
        return;
    }
    buildNodeWithIdentifierLocaleAndMessage(node) {
        return;
    }
    buildNodeWithLiteralLocaleAndIdentifierMessage(node) {
        return;
    }
    buildNodeWithLiteralLocaleAndMessage(node) {
        const { domain, host, locale } = this.getOptions(node);
        const rootDir = host ? path_1.default.resolve(this.options.rootDir, host) : this.options.rootDir;
        const filename = fs_1.default.readdirSync(rootDir).find((file) => {
            const [extension, _locale, ...parts] = file.split('.').reverse();
            if (parts.join('.') !== domain)
                return false;
            if (_locale !== locale)
                return false;
            return this.loader.extension.test(`.${extension}`);
        });
        if (!cache.set(filename))
            return this.types.stringLiteral('toto');
    }
    isLocaleLiteral(node) {
        if (!node.node.arguments[2])
            return true;
        if (!this.types.isObjectExpression(node.node.arguments[2]))
            return false;
        return node.node.arguments[2].properties.find((property) => {
            if (!this.types.isObjectProperty(property))
                return false;
            if (!this.types.isIdentifier(property.key) && !this.types.isStringLiteral(property.key))
                return false;
            const key = this.types.isIdentifier(property.key) ? property.key.name : property.key.value;
            return key !== 'locale' && this.types.isStringLiteral(property.value);
        });
    }
    getCatalogs(node, rootDir, domain, locale) {
        const files = this.getFiles(node, rootDir, domain, locale);
        const catalogs = {};
        for (let idx = 0; idx < files.length; idx++) {
            const matches = files[idx].match(REGEX_FILENAME);
            if (!matches)
                continue;
            const [, domain, , locale] = matches;
            if (!cache.get(files[idx])) {
                const filename = path_1.default.join(rootDir, files[idx]);
                const content = fs_1.default.readFileSync(filename).toString();
                cache.set(files[idx], this.loader.load(content));
            }
            Object.assign(catalogs, (0, translations_1.mergeCatalogs)(catalogs, { [locale]: { [domain]: cache.get(files[idx]) } }));
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
        if (node.node.arguments.length > 3) {
            throw node.parentPath.buildCodeFrameError(`Received an invalid number of arguments.\n Signature: ${SIGNATURE}`, babel_plugin_macros_1.MacroError);
        }
        if (!node.node.arguments.length) {
            throw node.parentPath.buildCodeFrameError(`Message argument is mandatory.\n Signature: ${SIGNATURE}`, babel_plugin_macros_1.MacroError);
        }
        if (!this.types.isStringLiteral(node.node.arguments[0])) {
            console.warn('Message argument is not a string, all domain will be load');
        }
        if (node.node.arguments[2] && !this.types.isObjectExpression(node.node.arguments[2])) {
            throw node.parentPath.buildCodeFrameError(`Options argument is not a object.\n Signature: ${SIGNATURE}`, babel_plugin_macros_1.MacroError);
        }
        const options = (node.node.arguments[2]?.properties || []).reduce((accu, property) => {
            if (!this.types.isObjectProperty(property)) {
                throw node.parentPath.buildCodeFrameError(`Method option parameter must be an object of strings`, babel_plugin_macros_1.MacroError);
            }
            if (!this.types.isIdentifier(property.key) && !this.types.isStringLiteral(property.key)) {
                throw node.parentPath.buildCodeFrameError(`Method option parameter has an invalid key`, babel_plugin_macros_1.MacroError);
            }
            const key = this.types.isIdentifier(property.key) ? property.key.name : property.key.value;
            if (!AVAILABLE_OPTION_KEYS.includes(key)) {
                throw node.parentPath.buildCodeFrameError(`Option ${key} is not allowed`, babel_plugin_macros_1.MacroError);
            }
            if ('locale' === key) {
                if (this.types.isStringLiteral(property.value)) {
                    return ({ ...accu, [key]: property.value.value });
                }
                if (this.types.isIdentifier(property.value)) {
                    return ({ ...accu, [key]: property.value.name });
                }
                throw node.parentPath.buildCodeFrameError(`Option ${key} must be a string or a variable`, babel_plugin_macros_1.MacroError);
            }
            if (!this.types.isStringLiteral(property.value)) {
                throw node.parentPath.buildCodeFrameError(`Option ${key} must be a string`, babel_plugin_macros_1.MacroError);
            }
            return ({ ...accu, [key]: property.value.value });
        }, {});
        return Object.assign({ domain: 'messages', host: undefined, locale: 'en' }, options);
    }
}
//# sourceMappingURL=translate.js.map