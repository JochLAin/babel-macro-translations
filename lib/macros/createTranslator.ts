import * as Babel from "@babel/core";
import * as BabelTypes from "@babel/types";
import { MacroError } from "babel-plugin-macros";
import path from "path";
import { LoaderType, OptionsType } from "../types";
import getModule from "../utils/import";
import Abstract from "./abstract";

const AVAILABLE_OPTION_KEYS = ['domain', 'host', 'locale'];
const SIGNATURE = `createTranslator({ domain?: string, host?: string, locale?: identifier|string })`;

export default (types: typeof BabelTypes, loader: LoaderType, options: OptionsType) => {
    return new CreateTranslatorMacro(types, loader, options);
};

class CreateTranslatorMacro extends Abstract {
    buildNode(node: Babel.NodePath<BabelTypes.CallExpression>|null) {
        if (node === null) return;
        const { domain, host, locale } = this.getOptions(node);
        const rootDir = host ? path.join(this.options.rootDir, host) : this.options.rootDir;
        const method = getModule(node, '@jochlain/translations', 'createTranslator');
        const catalogs = this.getCatalogs(node, rootDir, domain, locale);

        const options = [this.types.objectProperty(this.types.identifier('formatter'), this.createIntlFormatter(node))];
        if (locale) options.push(this.types.objectProperty(this.types.identifier('locale'), this.types.stringLiteral(locale)));
        if (domain) options.push(this.types.objectProperty(this.types.identifier('domain'), this.types.stringLiteral(domain)));

        return this.types.callExpression(method, [
            this.types.valueToNode(catalogs),
            this.types.objectExpression(options)
        ]);
    }

    getOptions(node: Babel.NodePath<BabelTypes.CallExpression>) {
        if (node.node.arguments.length > 1) {
            throw node.parentPath.buildCodeFrameError(
                `Received an invalid number of arguments (must be 0 or 1)\n  Signature: ${SIGNATURE}`,
                MacroError
            );
        }

        if (!node.node.arguments.length) return {};

        if (!this.types.isObjectExpression(node.node.arguments[0])) {
            throw node.parentPath.buildCodeFrameError(
                `Parameter must be an object\n  Signature: ${SIGNATURE}`,
                MacroError
            );
        }

        return node.node.arguments[0].properties.reduce((accu: { [key: string]: string }, property: any) => {
            if (!this.types.isObjectProperty(property)) {
                throw node.parentPath.buildCodeFrameError(
                    `Method option parameter must be an object of strings\n  Signature: ${SIGNATURE}`,
                    MacroError
                );
            }
            if (!this.types.isIdentifier(property.key) && !this.types.isStringLiteral(property.key)) {
                throw node.parentPath.buildCodeFrameError(
                    `Method option parameter has an invalid key\n  Signature: ${SIGNATURE}`,
                    MacroError
                );
            }

            const key = this.types.isIdentifier(property.key) ? (property.key as BabelTypes.Identifier).name : (property.key as BabelTypes.StringLiteral).value;
            if (!AVAILABLE_OPTION_KEYS.includes(key)) {
                throw node.parentPath.buildCodeFrameError(
                    `Option ${key} is not allowed\n  Signature: ${SIGNATURE}`,
                    MacroError
                );
            }

            if (!this.types.isStringLiteral(property.value)) {
                throw node.parentPath.buildCodeFrameError(
                    `Option ${key} must be a string\n  Signature: ${SIGNATURE}`,
                    MacroError
                );
            }

            return ({ ...accu, [key]: property.value.value });
        }, {})
    }
}
