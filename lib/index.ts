import * as Babel from '@babel/core';
import * as BabelTypes from '@babel/types';
import { MacroError, MacroParams } from "babel-plugin-macros";
import { resolve } from "path";
import createFactoryTranslator from "./macros/createTranslator";
import createFactoryTranslate from "./macros/translate";
import { clear } from "./cache";
import { InputType, LoaderType } from "./types";

const AVAILABLE_METHODS = ['createTranslator', 'translate'];
const DEFAULT_ROOT_DIR = 'translations';

const getOptions = (config: InputType) => {
    const options = Object.assign({ rootDir: DEFAULT_ROOT_DIR }, config);
    return Object.assign(options, {
        rootDir: resolve(process.cwd(), options.rootDir),
    });
};

export default (loader: LoaderType) =>  ({ babel, config, references }: MacroParams) => {
    clear();
    const { types } = babel;
    const options = getOptions(config);
    const factoryTranslator = createFactoryTranslator(types, loader, options);
    const factoryTranslate = createFactoryTranslate(types, loader, options);

    Object.keys(references).forEach((method) => {
        references[method].forEach((node: Babel.NodePath<BabelTypes.Node>) => {
            if (!node.parentPath) return;
            if (!types.isCallExpression(node.parentPath.node)) {
                throw node.parentPath
                    ? node.parentPath.buildCodeFrameError(`Only method call can be used by macro`, MacroError)
                    : new Error(`Only method call can be used by macro`)
                ;
            }

            if (!AVAILABLE_METHODS.includes(method)) {
                throw node.parentPath
                    ? node.parentPath.buildCodeFrameError(`Method must be one of ${AVAILABLE_METHODS.join(' or ')}`, MacroError)
                    : new Error(`Method must be one of ${AVAILABLE_METHODS.join(' or ')}`)
                ;
            }

            switch (method) {
                case 'createTranslator': {
                    const translator = factoryTranslator.buildNode(node.parentPath as Babel.NodePath<BabelTypes.CallExpression>);
                    if (translator && node.parentPath) node.parentPath.replaceWith(translator);
                    break;
                }
                case 'translate': {
                    const translate = factoryTranslate.buildNode(node.parentPath as Babel.NodePath<BabelTypes.CallExpression>);
                    if (translate && node.parentPath) node.parentPath.replaceWith(translate);
                    break;
                }
            }
        });
    });
};
