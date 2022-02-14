"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const babel_plugin_macros_1 = require("babel-plugin-macros");
const path_1 = require("path");
const createTranslator_1 = __importDefault(require("./macros/createTranslator"));
const translate_1 = __importDefault(require("./macros/translate"));
const AVAILABLE_METHODS = ['createTranslator', 'translate'];
const DEFAULT_ROOT_DIR = 'translations';
exports.default = (loader) => {
    const getOptions = (config) => {
        const options = Object.assign({ rootDir: DEFAULT_ROOT_DIR }, config);
        return Object.assign(options, {
            rootDir: (0, path_1.resolve)(process.cwd(), options.rootDir),
        });
    };
    return ({ babel, config, references }) => {
        const { types } = babel;
        const options = getOptions(config);
        const factoryTranslator = (0, createTranslator_1.default)(types, loader, options);
        const factoryTranslate = (0, translate_1.default)(types, loader, options);
        Object.keys(references).forEach((method) => {
            references[method].forEach((node) => {
                if (!node.parentPath)
                    return;
                if (!types.isCallExpression(node.parentPath.node)) {
                    throw node.parentPath?.buildCodeFrameError(`Only method call can be used by macro`, babel_plugin_macros_1.MacroError);
                }
                switch (method) {
                    case 'createTranslator': {
                        const translator = factoryTranslator.buildNode(node.parentPath);
                        if (translator)
                            node.parentPath?.replaceWith(translator);
                        break;
                    }
                    case 'translate': {
                        const translate = factoryTranslate.buildNode(node.parentPath);
                        if (translate)
                            node.parentPath?.replaceWith(translate);
                        break;
                    }
                }
            });
        });
    };
};
//# sourceMappingURL=index.js.map