import * as Babel from "@babel/core";
import { addNamed } from "@babel/helper-module-imports";
import * as BabelTypes from "@babel/types";
import { mergeCatalogs } from "@jochlain/translations";
import { CatalogType } from "@jochlain/translations/lib/types";
import { MacroError } from "babel-plugin-macros";
import fs from "fs";
import path from "path";
import * as cache from "../cache";
import { InputType, LoaderType, OptionsType } from "../types";
import createIntlFormatter from "./intlFormatter";

const AVAILABLE_OPTION_KEYS = ['domain', 'host', 'locale'];
const REGEX_FILENAME = /^(\w+)(\+intl-icu)?\.([\w_]+)(\.(ya?ml|xlf|php|csv|json|ini|dat|res|mo|po|qt))$/i;
const SIGNATURE = `translate(message: identifier|string, replacements: identifier|{ [key: string]: number|string }, { domain: string = 'messages', locale: identifier|string = 'en', host?: string })`;

export default (types: typeof BabelTypes, loader: LoaderType, options: OptionsType) => {
    return new FactoryTranslate(types, loader, options);
};

class FactoryTranslate {
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
        if (this.types.isStringLiteral(node.node.arguments[0])) {
            if (this.isLocaleLiteral(node)) {
                return this.buildNodeWithLiteralLocaleAndMessage(node);
            }
            return this.buildNodeWithIdentifierLocaleAndLiteralMessage(node);
        }
        if (this.isLocaleLiteral(node)) {
            return this.buildNodeWithLiteralLocaleAndIdentifierMessage(node);
        }
        return this.buildNodeWithIdentifierLocaleAndMessage(node);

        // const catalogs = this.getCatalogs(node, rootDir, domain, locale);
        // const method = addDefault(node.parentPath, '@jochlain/translations', { nameHint: `createTranslator_i${counter++}` });
        // const options = [this.types.objectProperty(this.types.identifier('formatter'), createIntlFormatter(this.types, node))];
        // if (locale) options.push(this.types.objectProperty(this.types.identifier('locale'), this.types.stringLiteral(locale)));
        // if (domain) options.push(this.types.objectProperty(this.types.identifier('domain'), this.types.stringLiteral(domain)));
        //
        // return this.types.callExpression(method, [
        //     this.types.valueToNode(catalogs),
        //     this.types.objectExpression(options)
        // ]);
    }

    buildNodeWithIdentifierLocaleAndLiteralMessage(node: Babel.NodePath<BabelTypes.CallExpression>) {
        return;
    }

    buildNodeWithIdentifierLocaleAndMessage(node: Babel.NodePath<BabelTypes.CallExpression>) {
        return;
    }

    buildNodeWithLiteralLocaleAndIdentifierMessage(node: Babel.NodePath<BabelTypes.CallExpression>) {
        return;
    }

    buildNodeWithLiteralLocaleAndMessage(node: Babel.NodePath<BabelTypes.CallExpression>) {
        const { domain, host, locale } = this.getOptions(node);
        const rootDir = host ? path.resolve(this.options.rootDir, host) : this.options.rootDir;
        const filename = fs.readdirSync(rootDir).find((file) => {
            const [extension, _locale, ...parts] = file.split('.').reverse();
            if (parts.join('.') !== domain) return false;
            if (_locale !== locale) return false;
            return this.loader.extension.test(`.${extension}`);
        });

        if (!cache.set(filename))

        return this.types.stringLiteral('toto');
    }

    isLocaleLiteral(node: Babel.NodePath<BabelTypes.CallExpression>) {
        if (!node.node.arguments[2]) return true;
        if (!this.types.isObjectExpression(node.node.arguments[2])) return false;
        return node.node.arguments[2].properties.find((property) => {
            if (!this.types.isObjectProperty(property)) return false;
            if (!this.types.isIdentifier(property.key) && !this.types.isStringLiteral(property.key)) return false;
            const key = this.types.isIdentifier(property.key) ? (property.key as BabelTypes.Identifier).name : (property.key as BabelTypes.StringLiteral).value;
            return key !== 'locale' && this.types.isStringLiteral(property.value);
        });
    }

    getCatalogs(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain?: string, locale?: string): CatalogType {
        const files = this.getFiles(node, rootDir, domain, locale);
        const catalogs = {};
        for (let idx = 0; idx < files.length; idx++) {
            const matches = files[idx].match(REGEX_FILENAME);
            if (!matches) continue;
            const [, domain,, locale] = matches;
            if (!cache.get(files[idx])) {
                const filename = path.join(rootDir, files[idx]);
                const content = fs.readFileSync(filename).toString();
                cache.set(files[idx], this.loader.load(content));
            }
            Object.assign(catalogs, mergeCatalogs(catalogs, { [locale]: { [domain]: cache.get(files[idx]) } }));
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
        if (node.node.arguments.length > 3) {
            throw node.parentPath.buildCodeFrameError(
                `Received an invalid number of arguments.\n Signature: ${SIGNATURE}`,
                MacroError
            );
        }

        if (!node.node.arguments.length) {
            throw node.parentPath.buildCodeFrameError(
                `Message argument is mandatory.\n Signature: ${SIGNATURE}`,
                MacroError
            );
        }

        if (!this.types.isStringLiteral(node.node.arguments[0])) {
            console.warn('Message argument is not a string, all domain will be load');
        }

        if (node.node.arguments[2] && !this.types.isObjectExpression(node.node.arguments[2])) {
            throw node.parentPath.buildCodeFrameError(
                `Options argument is not a object.\n Signature: ${SIGNATURE}`,
                MacroError
            );
        }

        const options = (node.node.arguments[2]?.properties || []).reduce((accu: InputType, property: any) => {
            if (!this.types.isObjectProperty(property)) {
                throw node.parentPath.buildCodeFrameError(
                    `Method option parameter must be an object of strings`,
                    MacroError
                );
            }
            if (!this.types.isIdentifier(property.key) && !this.types.isStringLiteral(property.key)) {
                throw node.parentPath.buildCodeFrameError(
                    `Method option parameter has an invalid key`,
                    MacroError
                );
            }

            const key = this.types.isIdentifier(property.key) ? (property.key as BabelTypes.Identifier).name : (property.key as BabelTypes.StringLiteral).value;
            if (!AVAILABLE_OPTION_KEYS.includes(key)) {
                throw node.parentPath.buildCodeFrameError(
                    `Option ${key} is not allowed`,
                    MacroError
                );
            }

            if ('locale' === key) {
                if (this.types.isStringLiteral(property.value)) {
                    return ({ ...accu, [key]: property.value.value });
                }
                if (this.types.isIdentifier(property.value)) {
                    return ({ ...accu, [key]: property.value.name });
                }
                throw node.parentPath.buildCodeFrameError(
                    `Option ${key} must be a string or a variable`,
                    MacroError
                );
            }
            if (!this.types.isStringLiteral(property.value)) {
                throw node.parentPath.buildCodeFrameError(
                    `Option ${key} must be a string`,
                    MacroError
                );
            }

            return ({ ...accu, [key]: property.value.value });
        }, {});

        return Object.assign({ domain: 'messages', host: undefined, locale: 'en' }, options);
    }
}
