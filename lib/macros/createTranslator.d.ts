import * as Babel from "@babel/core";
import * as BabelTypes from "@babel/types";
import { CatalogType } from "@jochlain/translations/lib/types";
import { LoaderType, OptionsType } from "../types";
declare const _default: (types: typeof BabelTypes, loader: LoaderType, options: OptionsType) => FactoryTranslator;
export default _default;
declare class FactoryTranslator {
    types: typeof BabelTypes;
    loader: LoaderType;
    options: OptionsType;
    constructor(types: typeof BabelTypes, loader: LoaderType, options: OptionsType);
    buildNode(node: Babel.NodePath<BabelTypes.CallExpression> | null): Babel.types.CallExpression | undefined;
    getCatalogs(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain?: string, locale?: string): CatalogType;
    getFiles(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain?: string, locale?: string): string[];
    getOptions(node: Babel.NodePath<BabelTypes.CallExpression>): {
        [x: string]: string;
    };
}
