import * as Babel from "@babel/core";
import { addDefault, addNamed, isModule } from "@babel/helper-module-imports";
import * as BabelTypes from "@babel/types";
import { MacroError } from "babel-plugin-macros";

const IMPORT_OPTIONS = {
    importedType: 'commonjs',
    importedInterop: 'babel',
    importingInterop: 'babel',
};

const programMap = new Map<Babel.NodePath<BabelTypes.Node>, Babel.NodePath<BabelTypes.Program>>();

export default (node: Babel.NodePath<BabelTypes.Node>, moduleName: string, name: string, isDefault: boolean = false) => {
    const mod = searchModule(node, moduleName, name, isDefault);
    if (mod) return mod;

    // Create import
    if (isDefault) {
        return addDefault(node.parentPath, moduleName, { ...IMPORT_OPTIONS, nameHint: name });
    }
    return addNamed(node.parentPath, name, moduleName, { ...IMPORT_OPTIONS, nameHint: name });
}

const searchModule = (node: Babel.NodePath<BabelTypes.Node>, moduleName: string, name: string, isDefault: boolean = false): BabelTypes.Identifier|null => {
    const programPath = getProgramPath(node);
    const isMod = isModule(programPath);
    const isModuleForNode = isMod && IMPORT_OPTIONS.importingInterop === "node";
    const isModuleForBabel = isMod && IMPORT_OPTIONS.importingInterop === "babel";

    if (IMPORT_OPTIONS.importedType === 'es6') {
        return searchModuleInImport(node, moduleName, name, isDefault);
    } else if (IMPORT_OPTIONS.importedType === 'commonjs') {
        if (['babel', 'compiled', 'uncompiled'].includes(IMPORT_OPTIONS.importedInterop)) {
            if (isModuleForNode || isModuleForBabel) {
                return searchModuleInImport(node, moduleName, name, isDefault);
            } else {
                return null;
            //     return searchModuleInRequire(node, moduleName, name, isDefault);
            }
        } else {
            throw new Error(`Unknown importedInterop "${IMPORT_OPTIONS.importedInterop}".`);
        }
    } else {
        throw new Error(`Unexpected interopType "${IMPORT_OPTIONS.importedType}"`);
    }
}

const searchModuleInImport = (node: Babel.NodePath<BabelTypes.Node>, moduleName: string, name: string, isDefault: boolean = false): BabelTypes.Identifier|null => {
    const body = getProgramBody(node);
    for (let idx = 0; idx < body.length; idx++) {
        if (!BabelTypes.isImportDeclaration(body[idx].node)) return null;
        const child = body[idx].node as BabelTypes.ImportDeclaration;
        if (child.source.value !== moduleName) continue;
        for (let spec_idx = 0; spec_idx < child.specifiers.length; spec_idx++) {
            const specifier = child.specifiers[spec_idx];
            if (isDefault) {
                if (BabelTypes.isImportDefaultSpecifier(specifier)) {
                    throw new Error('Can\'t fully support default import');
                    // return specifier.local;
                }
            } else {
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

// const searchModuleInRequire = (node: Babel.NodePath<BabelTypes.Node>, moduleName: string, name: string, isDefault: boolean = false): BabelTypes.Identifier|null => {
//     const body = getProgramBody(node);
//     for (let idx = 0; idx < body.length; idx++) {
//         if (!body[idx].isVariableDeclaration()) return null;
//         const child = body[idx].node as BabelTypes.VariableDeclaration;
//         const declaration = child.declarations.find((declaration) => BabelTypes.isCallExpression(declaration.init)) as BabelTypes.VariableDeclarator;
//         if (!declaration) continue;
//         const callExpression = declaration.init as BabelTypes.CallExpression;
//         if (!callExpression || (callExpression.callee as BabelTypes.Identifier)?.name !== 'require') continue;
//         if (!BabelTypes.isStringLiteral(callExpression.arguments[0])) continue;
//         if (callExpression.arguments[0].value !== moduleName) continue;
//
//     }
//
//     return null;
// };

export const getProgramPath = (node: Babel.NodePath<BabelTypes.Node>): Babel.NodePath<BabelTypes.Program> => {
    if (!programMap.has(node)) {
        const programPath = node.find((node) => node.isProgram());
        if (!programPath) {
            throw node.parentPath
                ? node.parentPath.buildCodeFrameError(`Can't reach program node`, MacroError)
                : new Error(`Can't reach program node`)
            ;
        }
        programMap.set(node, programPath as Babel.NodePath<BabelTypes.Program>);
    }
    return programMap.get(node) as Babel.NodePath<BabelTypes.Program>;
}

export const getProgramBody = (node: Babel.NodePath<BabelTypes.Node>): Babel.NodePath<BabelTypes.Node>[] => {
    const program = getProgramPath(node);
    const body = program.get('body');
    if (!Array.isArray(body)) return [body];
    return body;
}

export const insertImport = (node: Babel.NodePath<BabelTypes.Node>, statements: any) => {
    const body = getProgramBody(node);
    for (let idx = body.length -1; idx >= 0; idx--) {
        if (body[idx].isImportDeclaration()) {
            body[idx].insertAfter(statements);
            return;
        }
    }

    // No import declaration
    body[0].insertBefore(statements);
}
