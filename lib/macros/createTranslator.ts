import * as Babel from "@babel/core";
import { addDefault } from "@babel/helper-module-imports";
import * as BabelTypes from "@babel/types";
import { mergeCatalogs } from "@jochlain/translations";
import { CatalogType } from "@jochlain/translations/lib/types";
import { MacroError } from "babel-plugin-macros";
import fs from "fs";
import path from "path";
import * as cache from "../cache";
import { LoaderType, OptionsType } from "../types";
import createIntlFormatter from "./intlFormatter";

const AVAILABLE_OPTION_KEYS = ['domain', 'host', 'locale'];
const REGEX_FILENAME = /^(\w+)(\+intl-icu)?\.([\w_]+)(\.(ya?ml|xlf|php|csv|json|ini|dat|res|mo|po|qt))$/i;
const SIGNATURE = `createTranslator({ domain?: string, host?: string, locale?: identifier|string })`;

let counter = 0;

export default (types: typeof BabelTypes, loader: LoaderType, options: OptionsType) => {
    return new FactoryTranslator(types, loader, options);
};

class FactoryTranslator {
    types: typeof BabelTypes;
    loader: LoaderType;
    options: OptionsType;

    constructor(types: typeof BabelTypes, loader: LoaderType, options: OptionsType) {
        this.types = types;
        this.loader = loader;
        this.options = options;
    }

    buildNode(node: Babel.NodePath<BabelTypes.CallExpression>|null) {
        if (!node) return;
        const { domain, host, locale } = this.getOptions(node);
        const rootDir = host ? path.join(this.options.rootDir, host) : this.options.rootDir;
        const catalogs = this.getCatalogs(node, rootDir, domain, locale);

        const method = addDefault(node.parentPath, '@jochlain/translations', { nameHint: `createTranslator_i${counter++}` });
        const options = [this.types.objectProperty(this.types.identifier('formatter'), createIntlFormatter(this.types, node))];
        if (locale) options.push(this.types.objectProperty(this.types.identifier('locale'), this.types.stringLiteral(locale)));
        if (domain) options.push(this.types.objectProperty(this.types.identifier('domain'), this.types.stringLiteral(domain)));

        return this.types.callExpression(method, [
            this.types.valueToNode(catalogs),
            this.types.objectExpression(options)
        ]);
    }

    getCatalogs(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain?: string, locale?: string): CatalogType {
        const files = this.getFiles(node, rootDir, domain, locale);
        const catalogs = {};
        for (let idx = 0; idx < files.length; idx++) {
            const matches = files[idx].match(REGEX_FILENAME);
            if (!matches) continue;
            const [, domain,, locale] = matches;
            const key = path.relative(process.cwd(), path.join(rootDir, file));
            if (!cache.get(key)) {
                const filename = path.join(rootDir, files[idx]);
                const content = fs.readFileSync(filename).toString();
                cache.set(key, this.loader.load(content));
            }
            Object.assign(catalogs, mergeCatalogs(catalogs, { [locale]: { [domain]: cache.get(key) } }));
        }
        return catalogs;
    }

    getFiles(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain?: string, locale?: string): string[] {
        try {
            const stat = fs.lstatSync(rootDir);
            if (stat.isDirectory()) {
                return fs.readdirSync(rootDir).filter((filename) => {
                    const matches = filename.match(REGEX_FILENAME);
                    if (!matches) return false;
                    if (domain && matches[1] !== domain) return false;
                    if (locale && matches[3] !== locale) return false;
                    return this.loader.extension.test(matches[4]);
                });
            }
        } catch (error) {
        }

        throw node.parentPath.buildCodeFrameError(
            `Host parameter must refer to a directory`,
            MacroError
        );
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
