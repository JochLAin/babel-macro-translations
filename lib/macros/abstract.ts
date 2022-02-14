import * as Babel from "@babel/core";
import { addNamed } from "@babel/helper-module-imports";
import * as BabelTypes from "@babel/types";
import { CatalogType, TranslationType } from "@jochlain/translations/lib/types";
import { mergeCatalogs } from "@jochlain/translations";
import { MacroError } from "babel-plugin-macros";
import fs from "fs";
import path from "path";
import * as cache from "../cache";
import { LoaderType, OptionsType } from "../types";

let counter = -1;

export default class Abstract {
    types: typeof BabelTypes;
    loader: LoaderType;
    options: OptionsType;

    constructor(types: typeof BabelTypes, loader: LoaderType, options: OptionsType) {
        this.types = types;
        this.loader = loader;
        this.options = options;
    }

    createIntlFormatter(node: Babel.NodePath) {
        const nodeIntl = addNamed(node.parentPath, 'IntlMessageFormat', 'intl-messageformat', { hintedName: `IntlMessageFormat_$${++counter}` });
        const nodeFormatter = this.types.identifier(`jochlain_translation_intl_formatter`);
        const nodeLocale = this.types.identifier('locale');
        const nodeMessage = this.types.identifier('message');
        const nodeReplacements = this.types.identifier('replacements');

        const nodeDeclaration = this.types.variableDeclaration('const', [
            this.types.variableDeclarator(
                nodeFormatter,
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
        ]);

        const programPath = node.parentPath?.find((nodePath) => nodePath.isProgram());
        if (programPath) {
            const body = programPath.get('body') as Babel.NodePath<Babel.Node>[];
            for (let idx = body.length - 1; idx >= 0; idx--) {
                if (body[idx].isImportDeclaration()) {
                    body[idx].insertAfter(nodeDeclaration);
                    break;
                }
            }
        }

        return nodeFormatter;
    }

    getCatalogs(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain?: string, locale?: string): TranslationType {
        const files = this.getFiles(node, rootDir, domain, locale);
        const catalogs = {};
        for (let idx = 0; idx < files.length; idx++) {
            Object.assign(catalogs, mergeCatalogs(catalogs, this.load(rootDir, files[idx])));
        }
        return catalogs;
    }

    getCatalog(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain: string, locale: string): { [locale: string]: CatalogType } {
        const file = this.getFile(node, rootDir, domain, locale);
        if (!file) return {};
        const translations = this.load(rootDir, file);
        return { [locale]: translations[locale][domain] };
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

    getFile(node: Babel.NodePath<BabelTypes.CallExpression>, rootDir: string, domain: string, locale: string): string|undefined {
        return fs.readdirSync(rootDir).find((file) => this.testFile(file, domain, locale));
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
