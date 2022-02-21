import * as Babel from "@babel/core";
import * as BabelTypes from "@babel/types";
import { TranslationType } from "@jochlain/translations/lib";
import { LoaderType, OptionsType } from "../types";
export default class Abstract {
    types: typeof BabelTypes;
    loader: LoaderType;
    options: OptionsType;
    constructor(types: typeof BabelTypes, loader: LoaderType, options: OptionsType);
    createIntlFormatter(node: Babel.NodePath<BabelTypes.CallExpression>): Babel.types.Identifier;
    getCatalogs(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain?: string, locale?: string): TranslationType;
    getFiles(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain?: string, locale?: string): string[];
    load(rootDir: string, file: string): TranslationType;
    matchFile(file: string): string[];
    testFile(file: string, domain?: string, locale?: string): boolean;
}
