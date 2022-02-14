import * as Babel from "@babel/core";
import * as BabelTypes from "@babel/types";
import { LoaderType, OptionsType } from "../types";
import Abstract from "./abstract";
declare const _default: (types: typeof BabelTypes, loader: LoaderType, options: OptionsType) => CreateTranslatorMacro;
export default _default;
declare class CreateTranslatorMacro extends Abstract {
    buildNode(node: Babel.NodePath<BabelTypes.CallExpression> | null): Babel.types.CallExpression | undefined;
    getOptions(node: Babel.NodePath<BabelTypes.CallExpression>): {
        [x: string]: string;
    };
}
