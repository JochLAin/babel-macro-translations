import * as Babel from "@babel/core";
import * as BabelTypes from "@babel/types";
import { ReplacementType } from "@jochlain/translations/lib";
import { LoaderType, OptionsType } from "../types";
import Abstract from "./abstract";
declare const _default: (types: typeof BabelTypes, loader: LoaderType, options: OptionsType) => TranslateMacro;
export default _default;
declare class TranslateMacro extends Abstract {
    buildNode(node: Babel.NodePath<BabelTypes.CallExpression> | null): Babel.types.CallExpression | Babel.types.StringLiteral | undefined;
    buildNodeWithIdentifierLocale(node: Babel.NodePath<BabelTypes.CallExpression>): Babel.types.CallExpression;
    buildNodeWithLiteralLocale(node: Babel.NodePath<BabelTypes.CallExpression>): Babel.types.StringLiteral;
    getArguments(node: Babel.NodePath<BabelTypes.CallExpression>): {
        catalog: {
            [x: string]: string;
        };
        replacements: ReplacementType;
        locale: string;
    };
    getArgumentMessage(node: Babel.NodePath<BabelTypes.CallExpression>): string;
    getArgumentReplacements(node: Babel.NodePath<BabelTypes.CallExpression>): ReplacementType;
    getOptions(node: Babel.NodePath<BabelTypes.CallExpression>): {
        domain: string;
        host: undefined;
        locale: string;
    } & ({
        locale: string;
    } | {
        [x: string]: any;
    });
    isLocaleLiteral(node: Babel.NodePath<BabelTypes.CallExpression>): boolean;
}
