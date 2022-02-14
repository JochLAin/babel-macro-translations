import * as Babel from "@babel/core";
import * as BabelTypes from "@babel/types";
import { CatalogType, TranslationType } from "@jochlain/translations/lib/types";
import { LoaderType, OptionsType } from "../types";
export default class Abstract {
    types: typeof BabelTypes;
    loader: LoaderType;
    options: OptionsType;
    constructor(types: typeof BabelTypes, loader: LoaderType, options: OptionsType);
    createIntlFormatter(node: Babel.NodePath): Babel.types.Identifier;
    getCatalogs(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain?: string, locale?: string): TranslationType;
    getCatalog(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain: string, locale: string): {
        [locale: string]: CatalogType;
    };
    getFiles(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain?: string, locale?: string): string[];
    getFile(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain: string, locale: string): string | undefined;
    load(rootDir: string, file: string): TranslationType;
    matchFile(file: string): string[];
    testFile(file: string, domain?: string, locale?: string): boolean;
}
