import * as Babel from "@babel/core";
import * as BabelTypes from "@babel/types";
import { CatalogType } from "@jochlain/translations/lib/types";
import { LoaderType, OptionsType } from "../types";
declare const _default: (types: typeof BabelTypes, loader: LoaderType, options: OptionsType) => FactoryTranslate;
export default _default;
declare class FactoryTranslate {
    types: typeof BabelTypes;
    loader: LoaderType;
    options: OptionsType;
    constructor(types: typeof BabelTypes, loader: LoaderType, options: OptionsType);
    buildNode(node: Babel.NodePath<BabelTypes.CallExpression> | null): void | Babel.types.StringLiteral;
    buildNodeWithIdentifierLocaleAndLiteralMessage(node: Babel.NodePath<BabelTypes.CallExpression>): void;
    buildNodeWithIdentifierLocaleAndMessage(node: Babel.NodePath<BabelTypes.CallExpression>): void;
    buildNodeWithLiteralLocaleAndIdentifierMessage(node: Babel.NodePath<BabelTypes.CallExpression>): void;
    buildNodeWithLiteralLocaleAndMessage(node: Babel.NodePath<BabelTypes.CallExpression>): Babel.types.StringLiteral | undefined;
    isLocaleLiteral(node: Babel.NodePath<BabelTypes.CallExpression>): boolean | Babel.types.ObjectMethod | Babel.types.ObjectProperty | Babel.types.SpreadElement | undefined;
    getCatalogs(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain?: string, locale?: string): CatalogType;
    getFiles(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain?: string, locale?: string): string[];
    getOptions(node: Babel.NodePath<BabelTypes.CallExpression>): {
        domain: string;
        host: undefined;
        locale: string;
    } & ({
        locale: string;
    } | {
        [x: string]: any;
    });
}
