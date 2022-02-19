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
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertImport = exports.getProgramBody = exports.getProgramPath = void 0;
const helper_module_imports_1 = require("@babel/helper-module-imports");
const BabelTypes = __importStar(require("@babel/types"));
const babel_plugin_macros_1 = require("babel-plugin-macros");
const IMPORT_OPTIONS = {
    importedType: 'commonjs',
    importedInterop: 'babel',
    importingInterop: 'babel',
};
const programMap = new Map();
exports.default = (node, moduleName, name, isDefault = false) => {
    const mod = searchModule(node, moduleName, name, isDefault);
    if (mod)
        return mod;
    if (isDefault) {
        return (0, helper_module_imports_1.addDefault)(node.parentPath, moduleName, { ...IMPORT_OPTIONS, nameHint: name });
    }
    return (0, helper_module_imports_1.addNamed)(node.parentPath, name, moduleName, { ...IMPORT_OPTIONS, nameHint: name });
};
const searchModule = (node, moduleName, name, isDefault = false) => {
    const programPath = (0, exports.getProgramPath)(node);
    const isMod = (0, helper_module_imports_1.isModule)(programPath);
    const isModuleForNode = isMod && IMPORT_OPTIONS.importingInterop === "node";
    const isModuleForBabel = isMod && IMPORT_OPTIONS.importingInterop === "babel";
    if (IMPORT_OPTIONS.importedType === 'es6') {
        return searchModuleInImport(node, moduleName, name, isDefault);
    }
    else if (IMPORT_OPTIONS.importedType === 'commonjs') {
        if (['babel', 'compiled', 'uncompiled'].includes(IMPORT_OPTIONS.importedInterop)) {
            if (isModuleForNode || isModuleForBabel) {
                return searchModuleInImport(node, moduleName, name, isDefault);
            }
            else {
                return null;
            }
        }
        else {
            throw new Error(`Unknown importedInterop "${IMPORT_OPTIONS.importedInterop}".`);
        }
    }
    else {
        throw new Error(`Unexpected interopType "${IMPORT_OPTIONS.importedType}"`);
    }
};
const searchModuleInImport = (node, moduleName, name, isDefault = false) => {
    const body = (0, exports.getProgramBody)(node);
    for (let idx = 0; idx < body.length; idx++) {
        if (!BabelTypes.isImportDeclaration(body[idx].node))
            return null;
        const child = body[idx].node;
        if (child.source.value !== moduleName)
            continue;
        for (let spec_idx = 0; spec_idx < child.specifiers.length; spec_idx++) {
            const specifier = child.specifiers[spec_idx];
            if (isDefault) {
                if (BabelTypes.isImportDefaultSpecifier(specifier)) {
                    throw new Error('Can\'t fully support default import');
                }
            }
            else {
                if (BabelTypes.isImportSpecifier(specifier)) {
                    if (specifier.local.name === name) {
                        if (BabelTypes.isStringLiteral(specifier.imported)) {
                            return BabelTypes.identifier(specifier.imported.value);
                        }
                        return specifier.imported;
                    }
                }
            }
        }
    }
    return null;
};
const getProgramPath = (node) => {
    if (!programMap.has(node)) {
        const programPath = node.find((node) => node.isProgram());
        if (!programPath) {
            throw node.parentPath
                ? node.parentPath.buildCodeFrameError(`Can't reach program node`, babel_plugin_macros_1.MacroError)
                : new Error(`Can't reach program node`);
        }
        programMap.set(node, programPath);
    }
    return programMap.get(node);
};
exports.getProgramPath = getProgramPath;
const getProgramBody = (node) => {
    const program = (0, exports.getProgramPath)(node);
    const body = program.get('body');
    if (!Array.isArray(body))
        return [body];
    return body;
};
exports.getProgramBody = getProgramBody;
const insertImport = (node, statements) => {
    const body = (0, exports.getProgramBody)(node);
    for (let idx = body.length - 1; idx >= 0; idx--) {
        if (body[idx].isImportDeclaration()) {
            body[idx].insertAfter(statements);
            return;
        }
    }
    body[0].insertBefore(statements);
};
exports.insertImport = insertImport;
//# sourceMappingURL=import.js.map