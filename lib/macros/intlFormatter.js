"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_module_imports_1 = require("@babel/helper-module-imports");
let counter = -1;
exports.default = (types, node) => {
    const nodeIntl = (0, helper_module_imports_1.addNamed)(node.parentPath, 'IntlMessageFormat', 'intl-messageformat', { hintedName: `IntlMessageFormat_$${++counter}` });
    const nodeFormatter = types.identifier(`formatter_$${counter}`);
    const nodeLocale = types.identifier('locale');
    const nodeMessage = types.identifier('message');
    const nodeReplacements = types.identifier('replacements');
    const nodeDeclaration = types.variableDeclaration('const', [
        types.variableDeclarator(nodeFormatter, types.objectExpression([
            types.objectProperty(types.identifier('format'), types.arrowFunctionExpression([nodeMessage, nodeReplacements, nodeLocale], types.blockStatement([
                types.returnStatement(types.callExpression(types.memberExpression(types.parenthesizedExpression(types.newExpression(nodeIntl, [nodeMessage, nodeLocale])), types.identifier('format')), [nodeReplacements]))
            ])))
        ]))
    ]);
    const programPath = node.parentPath?.find((nodePath) => nodePath.isProgram());
    if (programPath) {
        const body = programPath.get('body');
        for (let idx = body.length - 1; idx >= 0; idx--) {
            if (body[idx].isImportDeclaration()) {
                body[idx].insertAfter(nodeDeclaration);
            }
        }
    }
    return nodeFormatter;
};
//# sourceMappingURL=intlFormatter.js.map