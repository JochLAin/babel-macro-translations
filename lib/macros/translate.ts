import * as Babel from "@babel/core";
import * as BabelTypes from "@babel/types";
import { ReplacementType } from "@jochlain/translations/lib";
import { getCatalogValue, translate } from "@jochlain/translations";
import { MacroError } from "babel-plugin-macros";
import { IntlMessageFormat } from "intl-messageformat";
import path from "path";
import { InputType, LoaderType, OptionsType } from "../types";
import getModule from "../utils/import";
import Abstract from "./abstract";

const AVAILABLE_OPTION_KEYS = ['domain', 'host', 'locale'];
const SIGNATURE = `translate(message: identifier|string, replacements: identifier|{ [key: string]: number|string }, { domain: string = 'messages', locale: identifier|string = 'en', host?: string })`;

const formatter = { format: (message: string, replacements: ReplacementType, locale: string): string => String((new IntlMessageFormat(message, locale)).format(replacements)) };

export default (types: typeof BabelTypes, loader: LoaderType, options: OptionsType) => {
    return new TranslateMacro(types, loader, options);
};

class TranslateMacro extends Abstract {
    buildNode(node: Babel.NodePath<BabelTypes.CallExpression>|null) {
        if (!node) return;
        if (this.isLocaleLiteral(node)) {
            return this.buildNodeWithLiteralLocale(node);
        }
        return this.buildNodeWithIdentifierLocale(node);
    }

    buildNodeWithIdentifierLocale(node: Babel.NodePath<BabelTypes.CallExpression>) {
        const { catalog, replacements, locale } = this.getArguments(node);
        const translateMethodIdentifier = getModule(node, '@jochlain/translations', 'translate');

        return this.types.callExpression(translateMethodIdentifier, [
            this.types.valueToNode(catalog),
            this.types.valueToNode(replacements),
            this.types.identifier(locale),
            this.createIntlFormatter(node),
        ]);
    }

    buildNodeWithLiteralLocale(node: Babel.NodePath<BabelTypes.CallExpression>) {
        const { catalog, replacements, locale } = this.getArguments(node);
        const value = translate(catalog, replacements, locale, formatter);

        return this.types.stringLiteral(value);
    }

    getArguments(node: Babel.NodePath<BabelTypes.CallExpression>) {
        const message = this.getArgumentMessage(node);
        const replacements = this.getArgumentReplacements(node);
        const { domain, host, locale } = this.getOptions(node);
        const rootDir = host ? path.resolve(this.options.rootDir, host) : this.options.rootDir;

        if (this.isLocaleLiteral(node)) {
            const catalogs = this.getCatalogs(node, rootDir, domain, locale);
            let value = message;
            if (catalogs && catalogs[locale] && catalogs[locale][domain]) {
                value = getCatalogValue(catalogs[locale][domain], message);
            }
            const catalog = { [locale]: value };
            return { catalog, replacements, locale };
        }

        const catalogs = this.getCatalogs(node, rootDir, domain);
        const catalog = Object.keys(catalogs).reduce((accu, locale) => ({ ...accu, [locale]: getCatalogValue(catalogs[locale][domain], message) }), {});
        return { catalog, replacements, locale };
    }

    getArgumentMessage(node: Babel.NodePath<BabelTypes.CallExpression>): string {
        return (node.node.arguments[0] as BabelTypes.StringLiteral).value;
    }

    getArgumentReplacements(node: Babel.NodePath<BabelTypes.CallExpression>) {
        if (node.node.arguments.length <= 1) return {};
        if (this.types.isNullLiteral(node.node.arguments[1])) return {};

        if (!this.types.isObjectExpression(node.node.arguments[1])) {
            throw node.parentPath.buildCodeFrameError(
                `Replacement argument is not an object`,
                MacroError
            );
        }

        return (node.node.arguments[1] as BabelTypes.ObjectExpression).properties.reduce((accu: ReplacementType, property: any) => {
            if (!this.types.isObjectProperty(property)) return accu;
            property = property as BabelTypes.ObjectProperty;
            if (!property) return accu;

            if (!this.types.isIdentifier(property.key) && !this.types.isStringLiteral(property.key)) {
                throw node.parentPath.buildCodeFrameError(
                    `Replacements option parameter has an invalid key`,
                    MacroError
                );
            }

            const key = this.types.isIdentifier(property.key) ? (property.key as BabelTypes.Identifier).name : (property.key as BabelTypes.StringLiteral).value;
            if (this.types.isStringLiteral(property.value)) {
                return { ...accu, [key]: (property.value as BabelTypes.StringLiteral).value };
            } else if (this.types.isNumericLiteral(property.value)) {
                return { ...accu, [key]: (property.value as BabelTypes.NumericLiteral).value };
            }

            throw node.parentPath.buildCodeFrameError(
                `Replacements option parameter must be an object of string or number`,
                MacroError
            );
        }, {});
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
            throw node.parentPath.buildCodeFrameError(
                `Message argument must be a string.\nIf you want to use variable for domain, please use createTranslator instead.\n Signature: ${SIGNATURE}`,
                MacroError
            );
        }

        if (node.node.arguments[2] && !this.types.isObjectExpression(node.node.arguments[2])) {
            throw node.parentPath.buildCodeFrameError(
                `Options argument is not a object.\n Signature: ${SIGNATURE}`,
                MacroError
            );
        }

        const options = ((node.node.arguments[2]? node.node.arguments[2].properties : []) || []).reduce((accu: InputType, property: any) => {
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

    isLocaleLiteral(node: Babel.NodePath<BabelTypes.CallExpression>) {
        if (!node.node.arguments[2]) return true;
        if (!this.types.isObjectExpression(node.node.arguments[2])) return false;
        for (let idx = 0; idx < node.node.arguments[2].properties.length; idx++) {
            const property = node.node.arguments[2].properties[idx];
            if (!this.types.isObjectProperty(property)) continue;
            if (!this.types.isIdentifier(property.key) && !this.types.isStringLiteral(property.key)) continue;
            const key = this.types.isIdentifier(property.key) ? (property.key as BabelTypes.Identifier).name : (property.key as BabelTypes.StringLiteral).value;
            if (key === 'locale') return this.types.isStringLiteral(property.value);
        }
        // For options without locale
        return true;
    }
}
