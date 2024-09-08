import { QuotationMark, QuoteMarkEnum, Result } from '../RequestHandler';
import {parse, ParserOptions } from '@babel/parser';
import traverse from "@babel/traverse";
import JavaScriptHandler from './JavaScriptHandler';

const REACT_PARSER_OPTIONS: ParserOptions = {
	allowImportExportEverywhere: true,
	allowReturnOutsideFunction: true,
	plugins: [
		"doExpressions",
		"dynamicImport",
		"functionBind",
		"jsx",
		"placeholders",
		"throwExpressions",
		"typescript",
	  ],
};

export default class ReactHandler extends JavaScriptHandler {
	/**
	 * 遍历方法
	 * 
	 * @param param 
	 * @param result 
	 * @param isDeleteOperation			是否是删除操作 
	 * @returns 
	 */
	protected traverse(param: QuotationMark[], result: Result[], isDeleteOperation = false) {
		for(const quoteMarkParam of param) {
			const {offset, lineText, lineIndex, quoteMark} = quoteMarkParam;
			let ast;
			
			try {
				ast = parse(lineText, REACT_PARSER_OPTIONS);
			}
			catch(e) {
				console.log(e);
				return [];
			}

			traverse(ast, {
				StringLiteral: (path) => {
					// render 中的jsx代码，组件中的属性不支持反引号
					if(quoteMark !== QuoteMarkEnum.BACK_QUOTE || path.parent?.type !== "JSXAttribute") {
						this.parseLiteral(path.node, offset, lineText, quoteMark, lineIndex, isDeleteOperation, result);
					}
				}, 
				TemplateLiteral: (path) => { 
					this.parseLiteral(path.node, offset, lineText, quoteMark, lineIndex, isDeleteOperation, result);
				},
				StringLiteralTypeAnnotation: (path) => {
					this.parseLiteral(path.node, offset, lineText, quoteMark, lineIndex, isDeleteOperation, result);
				}
			})
		}
	}
}