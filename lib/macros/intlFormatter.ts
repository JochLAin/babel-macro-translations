import * as Babel from "@babel/core";
import * as BabelTypes from "@babel/types";
import { addNamed } from "@babel/helper-module-imports";

let counter = -1;

export default (types: typeof BabelTypes, node: Babel.NodePath) => {
    const nodeIntl = addNamed(node.parentPath, 'IntlMessageFormat', 'intl-messageformat', { hintedName: `IntlMessageFormat_$${++counter}` });
    const nodeFormatter = types.identifier(`formatter_$${counter}`);
    const nodeLocale = types.identifier('locale');
    const nodeMessage = types.identifier('message');
    const nodeReplacements = types.identifier('replacements');

    const nodeDeclaration = types.variableDeclaration('const', [
        types.variableDeclarator(
            nodeFormatter,
            types.objectExpression([
                types.objectProperty(
                    types.identifier('format'),
                    types.arrowFunctionExpression(
                        [nodeMessage, nodeReplacements, nodeLocale],
                        types.blockStatement([
                            types.returnStatement(
                                types.callExpression(
                                    types.memberExpression(
                                        types.parenthesizedExpression(types.newExpression(nodeIntl, [nodeMessage, nodeLocale])),
                                        types.identifier('format')
                                    ),
                                    [nodeReplacements]
                                )
                            )
                        ])
                    )
                )
            ])
        )
    ]);

    const programPath = node.parentPath?.find((nodePath) => nodePath.isProgram());
    if (programPath) {
        const body = programPath.get('body') as Babel.NodePath<Babel.Node>[];
        for (let idx = body.length - 1; idx >= 0; idx--) {
            if (body[idx].isImportDeclaration()) {
                body[idx].insertAfter(nodeDeclaration);
            }
        }
    }

    return nodeFormatter;
};
