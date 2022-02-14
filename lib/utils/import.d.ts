import * as Babel from "@babel/core";
import * as BabelTypes from "@babel/types";
declare const _default: (node: Babel.NodePath<BabelTypes.Node>, moduleName: string, name: string, isDefault?: boolean) => any;
export default _default;
export declare const getProgramPath: (node: Babel.NodePath<BabelTypes.Node>) => Babel.NodePath<BabelTypes.Program>;
export declare const getProgramBody: (node: Babel.NodePath<BabelTypes.Node>) => Babel.NodePath<BabelTypes.Node>[];
export declare const insertImport: (node: Babel.NodePath<BabelTypes.Node>, statements: any) => void;
