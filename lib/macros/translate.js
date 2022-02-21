"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const translations_1 = require("@jochlain/translations");
const babel_plugin_macros_1 = require("babel-plugin-macros");
const intl_messageformat_1 = require("intl-messageformat");
const path_1 = __importDefault(require("path"));
const import_1 = __importDefault(require("../utils/import"));
const abstract_1 = __importDefault(require("./abstract"));
const AVAILABLE_OPTION_KEYS = ['domain', 'host', 'locale'];
const SIGNATURE = `translate(message: identifier|string, replacements: identifier|{ [key: string]: number|string }, { domain: string = 'messages', locale: identifier|string = 'en', host?: string })`;
const formatter = { format: (message, replacements, locale) => String((new intl_messageformat_1.IntlMessageFormat(message, locale)).format(replacements)) };
exports.default = (types, loader, options) => {
    return new TranslateMacro(types, loader, options);
};
class TranslateMacro extends abstract_1.default {
    buildNode(node) {
        if (!node)
            return;
        if (this.isLocaleLiteral(node)) {
            return this.buildNodeWithLiteralLocale(node);
        }
        return this.buildNodeWithIdentifierLocale(node);
    }
    buildNodeWithIdentifierLocale(node) {
        const { catalog, replacements, locale } = this.getArguments(node);
        const translateMethodIdentifier = (0, import_1.default)(node, '@jochlain/translations', 'translate');
        return this.types.callExpression(translateMethodIdentifier, [
            this.types.valueToNode(catalog),
            this.types.valueToNode(replacements),
            this.types.identifier(locale),
            this.createIntlFormatter(node),
        ]);
    }
    buildNodeWithLiteralLocale(node) {
        const { catalog, replacements, locale } = this.getArguments(node);
        const value = (0, translations_1.translate)(catalog, replacements, locale, formatter);
        return this.types.stringLiteral(value);
    }
    getArguments(node) {
        const message = this.getArgumentMessage(node);
        const replacements = this.getArgumentReplacements(node);
        const { domain, host, locale } = this.getOptions(node);
        const rootDir = host ? path_1.default.resolve(this.options.rootDir, host) : this.options.rootDir;
        if (this.isLocaleLiteral(node)) {
            const catalogs = this.getCatalogs(node, rootDir, domain, locale);
            let value = message;
            if (catalogs && catalogs[locale] && catalogs[locale][domain]) {
                value = (0, translations_1.getCatalogValue)(catalogs[locale][domain], message);
            }
            const catalog = { [locale]: value };
            return { catalog, replacements, locale };
        }
        const catalogs = this.getCatalogs(node, rootDir, domain);
        const catalog = Object.keys(catalogs).reduce((accu, locale) => ({ ...accu, [locale]: (0, translations_1.getCatalogValue)(catalogs[locale][domain], message) }), {});
        return { catalog, replacements, locale };
    }
    getArgumentMessage(node) {
        return node.node.arguments[0].value;
    }
    getArgumentReplacements(node) {
        if (node.node.arguments.length <= 1)
            return {};
        if (this.types.isNullLiteral(node.node.arguments[1]))
            return {};
        if (!this.types.isObjectExpression(node.node.arguments[1])) {
            throw node.parentPath.buildCodeFrameError(`Replacement argument is not an object`, babel_plugin_macros_1.MacroError);
        }
        return node.node.arguments[1].properties.reduce((accu, property) => {
            if (!this.types.isObjectProperty(property))
                return accu;
            property = property;
            if (!property)
                return accu;
            if (!this.types.isIdentifier(property.key) && !this.types.isStringLiteral(property.key)) {
                throw node.parentPath.buildCodeFrameError(`Replacements option parameter has an invalid key`, babel_plugin_macros_1.MacroError);
            }
            const key = this.types.isIdentifier(property.key) ? property.key.name : property.key.value;
            if (this.types.isStringLiteral(property.value)) {
                return { ...accu, [key]: property.value.value };
            }
            else if (this.types.isNumericLiteral(property.value)) {
                return { ...accu, [key]: property.value.value };
            }
            throw node.parentPath.buildCodeFrameError(`Replacements option parameter must be an object of string or number`, babel_plugin_macros_1.MacroError);
        }, {});
    }
    getOptions(node) {
        if (node.node.arguments.length > 3) {
            throw node.parentPath.buildCodeFrameError(`Received an invalid number of arguments.\n Signature: ${SIGNATURE}`, babel_plugin_macros_1.MacroError);
        }
        if (!node.node.arguments.length) {
            throw node.parentPath.buildCodeFrameError(`Message argument is mandatory.\n Signature: ${SIGNATURE}`, babel_plugin_macros_1.MacroError);
        }
        if (!this.types.isStringLiteral(node.node.arguments[0])) {
            throw node.parentPath.buildCodeFrameError(`Message argument must be a string.\nIf you want to use variable for domain, please use createTranslator instead.\n Signature: ${SIGNATURE}`, babel_plugin_macros_1.MacroError);
        }
        if (node.node.arguments[2] && !this.types.isObjectExpression(node.node.arguments[2])) {
            throw node.parentPath.buildCodeFrameError(`Options argument is not a object.\n Signature: ${SIGNATURE}`, babel_plugin_macros_1.MacroError);
        }
        const options = ((node.node.arguments[2] ? node.node.arguments[2].properties : []) || []).reduce((accu, property) => {
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
    isLocaleLiteral(node) {
        if (!node.node.arguments[2])
            return true;
        if (!this.types.isObjectExpression(node.node.arguments[2]))
            return false;
        for (let idx = 0; idx < node.node.arguments[2].properties.length; idx++) {
            const property = node.node.arguments[2].properties[idx];
            if (!this.types.isObjectProperty(property))
                continue;
            if (!this.types.isIdentifier(property.key) && !this.types.isStringLiteral(property.key))
                continue;
            const key = this.types.isIdentifier(property.key) ? property.key.name : property.key.value;
            if (key === 'locale')
                return this.types.isStringLiteral(property.value);
        }
        return true;
    }
}
//# sourceMappingURL=translate.js.map