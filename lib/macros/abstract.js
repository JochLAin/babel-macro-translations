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
let counter = -1;
class Abstract {
    constructor(types, loader, options) {
        this.types = types;
        this.loader = loader;
        this.options = options;
    }
    createIntlFormatter(node) {
        const nodeIntl = (0, helper_module_imports_1.addNamed)(node.parentPath, 'IntlMessageFormat', 'intl-messageformat', { hintedName: `IntlMessageFormat_$${++counter}` });
        const nodeFormatter = this.types.identifier(`jochlain_translation_intl_formatter`);
        const nodeLocale = this.types.identifier('locale');
        const nodeMessage = this.types.identifier('message');
        const nodeReplacements = this.types.identifier('replacements');
        const nodeDeclaration = this.types.variableDeclaration('const', [
            this.types.variableDeclarator(nodeFormatter, this.types.objectExpression([
                this.types.objectProperty(this.types.identifier('format'), this.types.arrowFunctionExpression([nodeMessage, nodeReplacements, nodeLocale], this.types.blockStatement([
                    this.types.returnStatement(this.types.callExpression(this.types.memberExpression(this.types.parenthesizedExpression(this.types.newExpression(nodeIntl, [nodeMessage, nodeLocale])), this.types.identifier('format')), [nodeReplacements]))
                ])))
            ]))
        ]);
        const programPath = node.parentPath?.find((nodePath) => nodePath.isProgram());
        if (programPath) {
            const body = programPath.get('body');
            for (let idx = body.length - 1; idx >= 0; idx--) {
                if (body[idx].isImportDeclaration()) {
                    body[idx].insertAfter(nodeDeclaration);
                    break;
                }
            }
        }
        return nodeFormatter;
    }
    getCatalogs(node, rootDir, domain, locale) {
        const files = this.getFiles(node, rootDir, domain, locale);
        const catalogs = {};
        for (let idx = 0; idx < files.length; idx++) {
            Object.assign(catalogs, (0, translations_1.mergeCatalogs)(catalogs, this.load(rootDir, files[idx])));
        }
        return catalogs;
    }
    getCatalog(node, rootDir, domain, locale) {
        const file = this.getFile(node, rootDir, domain, locale);
        if (!file)
            return {};
        const translations = this.load(rootDir, file);
        return { [locale]: translations[locale][domain] };
    }
    getFiles(node, rootDir, domain, locale) {
        try {
            const stat = fs_1.default.lstatSync(rootDir);
            if (stat.isDirectory()) {
                return fs_1.default.readdirSync(rootDir).filter((file) => this.testFile(file, domain, locale));
            }
        }
        catch (error) {
        }
        throw node.parentPath.buildCodeFrameError(`Host parameter must refer to a directory`, babel_plugin_macros_1.MacroError);
    }
    getFile(node, rootDir, domain, locale) {
        return fs_1.default.readdirSync(rootDir).find((file) => this.testFile(file, domain, locale));
    }
    load(rootDir, file) {
        const [domain, locale] = this.matchFile(file);
        const key = path_1.default.relative(process.cwd(), path_1.default.join(rootDir, file));
        if (!cache.get(key)) {
            const filename = path_1.default.join(rootDir, file);
            const content = fs_1.default.readFileSync(filename).toString();
            cache.set(key, this.loader.load(content));
        }
        return { [locale]: { [domain]: cache.get(key) } };
    }
    matchFile(file) {
        const [extension, locale, ...parts] = file.split('.').reverse();
        return [parts.join('.'), locale, extension];
    }
    testFile(file, domain, locale) {
        const [_domain, _locale, extension] = this.matchFile(file);
        if (domain && _domain !== domain)
            return false;
        if (locale && _locale !== locale)
            return false;
        return this.loader.extension.test(`.${extension}`);
    }
}
exports.default = Abstract;
//# sourceMappingURL=abstract.js.map