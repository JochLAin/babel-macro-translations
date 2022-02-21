import * as Babel from "@babel/core";
import * as BabelTypes from "@babel/types";
import { TranslationType } from "@jochlain/translations/lib";
import { mergeCatalogs } from "@jochlain/translations";
import { MacroError } from "babel-plugin-macros";
import fs from "fs";
import path from "path";
import * as cache from "../cache";
import { LoaderType, OptionsType } from "../types";
import getModule, { getProgramBody, insertImport } from "../utils/import";

const INTL_IDENTIFIER = 'jochlain_translation_intl_formatter';

export default class Abstract {
    types: typeof BabelTypes;
    loader: LoaderType;
    options: OptionsType;

    constructor(types: typeof BabelTypes, loader: LoaderType, options: OptionsType) {
        this.types = types;
        this.loader = loader;
        this.options = options;
    }

    createIntlFormatter(node: Babel.NodePath<BabelTypes.CallExpression>) {
        const body = getProgramBody(node);
        for (let idx = 0; idx < body.length; idx++) {
            if (!this.types.isVariableDeclaration(body[idx].node)) continue;
            const child = body[idx].node as BabelTypes.VariableDeclaration;
            for (let decl_idx = 0; decl_idx < child.declarations.length; decl_idx++) {
                const declarator = child.declarations[decl_idx];
                if (this.types.isIdentifier(declarator.id) && declarator.id.name === INTL_IDENTIFIER) {
                    return declarator.id;
                }
            }
        }

        const nodeIntl = getModule(node, 'intl-messageformat', 'IntlMessageFormat');
        const nodeIdentifier = this.types.identifier(INTL_IDENTIFIER);
        const nodeLocale = this.types.identifier('locale');
        const nodeMessage = this.types.identifier('message');
        const nodeReplacements = this.types.identifier('replacements');

        insertImport(node, this.types.variableDeclaration('const', [
            this.types.variableDeclarator(
                nodeIdentifier,
                this.types.objectExpression([
                    this.types.objectProperty(
                        this.types.identifier('format'),
                        this.types.arrowFunctionExpression(
                            [nodeMessage, nodeReplacements, nodeLocale],
                            this.types.blockStatement([
                                this.types.returnStatement(
                                    this.types.callExpression(
                                        this.types.memberExpression(
                                            this.types.parenthesizedExpression(this.types.newExpression(nodeIntl, [nodeMessage, nodeLocale])),
                                            this.types.identifier('format')
                                        ),
                                        [nodeReplacements]
                                    )
                                )
                            ])
                        )
                    )
                ])
            )
        ]));

        return nodeIdentifier;
    }

    getCatalogs(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain?: string, locale?: string): TranslationType {
        const key = `${path.relative(process.cwd(), rootDir)}/${domain || ''}/${locale || ''}`;
        if (!cache.get(key)) {
            const files = this.getFiles(node, rootDir, domain, locale);
            const catalogs = {};
            for (let idx = 0; idx < files.length; idx++) {
                Object.assign(catalogs, mergeCatalogs(catalogs, this.load(rootDir, files[idx])));
            }
            cache.set(key, catalogs);
        }
        return cache.get(key);
    }

    getFiles(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain?: string, locale?: string): string[] {
        try {
            const stat = fs.lstatSync(rootDir);
            if (stat.isDirectory()) {
                return fs.readdirSync(rootDir).filter((file) => this.testFile(file, domain, locale));
            }
        } catch (error) {
        }

        throw node.parentPath.buildCodeFrameError(
            `Host parameter must refer to a directory`,
            MacroError
        );
    }

    load(rootDir: string, file: string): TranslationType {
        const [domain, locale] = this.matchFile(file);
        const key = path.relative(process.cwd(), path.join(rootDir, file));
        if (!cache.get(key)) {
            const filename = path.join(rootDir, file);
            const content = fs.readFileSync(filename).toString();
            cache.set(key, this.loader.load(content));
        }
        return { [locale]: { [domain]: cache.get(key) } };
    }

    matchFile(file: string): string[] {
        const [extension, locale, ...parts] = file.split('.').reverse();
        return [parts.join('.'), locale, extension];
    }

    testFile(file: string, domain?: string, locale?: string) {
        const [_domain, _locale, extension] = this.matchFile(file);
        if (domain && _domain !== domain) return false;
        if (locale && _locale !== locale) return false;
        return this.loader.extension.test(`.${extension}`);
    }
}
