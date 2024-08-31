import { HandlerResult } from "vscode-languageserver";
import {parse, ParserOptions} from "@babel/parser"
import traverse, { Node } from "@babel/traverse"

import RequestHandler, { QuotationMark, Result } from '../RequestHandler';

const JAVA_SCRIPT_PARSER_OPTIONS: ParserOptions = {
	allowImportExportEverywhere: true,
	allowReturnOutsideFunction: true
};

const TYPE_SCRIPT_PARSER_OPTIONS: ParserOptions = {
	allowImportExportEverywhere: true,
	allowReturnOutsideFunction: true,
	plugins: ["typescript"]
};

/**
 * 处理javascript和typescript的请求处理器
 */
export default class JavaScriptHandler implements RequestHandler {
	constructor(readonly parseTypeScript = false) {}

	/**
	 * 根据传入的 QuotationMark[] 同步更正另一个引号
	 */
	correctAnotherQuoteMark(param: QuotationMark[]): HandlerResult<Result[], any> {
		const result: Result[] = [];
		this.traverse(param, result);

		return result;
	}

	/**
	 * 根据传入的 QuotationMark[] 同步删除另一个引号，需要删除的引号应该是一对空引号
	 */
	deleteAnotherQuoteMark(param: QuotationMark[]): HandlerResult<Result[], any> {
		const result: Result[] = [];
		this.traverse(param, result, true);

		return result;
	}
	
	/**
	 * 解析 Literal
	 * 
	 * @param node 			Literal 或 TemplateLiteral node
	 * @param offset 		修改的 quoteMark 在 lineText 的索引
	 * @param lineText 		修改所在的整行内容 lineText
	 * @param quoteMark 	修改的 quoteMark
	 * @param lineIndex 	修改所在的整行的行的索引
	 * @param isDeleteOperation		是否是删除操作 
	 * @param result 		结果数组
	 */
	private parseLiteral(node: Node, offset: number, lineText: string, quoteMark: string, 
	   lineIndex: number, isDeleteOperation: boolean, result: Result[]) {
		// 没有添加过才进来，防止同时命中 Literal 和 TemplateLiteral
		if(result.findIndex(res => res.lineIndex === lineIndex) !== -1) {
			return;
		}

		const {start, end} = node || {};

		if(start != null && end != null) {
			let newLineText;

			if(isDeleteOperation && start === offset) {
				newLineText = lineText.slice(0, start) + lineText.slice(end);
			}
			else if(start === offset || ((end - 1) === offset)) {
				newLineText = lineText.slice(0, start) + 
					quoteMark + 
					lineText.slice(start + 1, end - 1) + 
					quoteMark + 
					lineText.slice(end);
			}

			newLineText && result.push({lineIndex, lineText: newLineText, oldLineText: lineText});
		}
	}

	/**
	 * 遍历方法
	 * 
	 * @param param 
	 * @param result 
	 * @param isDeleteOperation			是否是删除操作 
	 * @returns 
	 */
	private traverse(param: QuotationMark[], result: Result[], isDeleteOperation = false) {
		for(const quoteMarkParam of param) {
			const {offset, lineText, lineIndex, quoteMark} = quoteMarkParam;
			let ast;
			
			try {
				ast = parse(
					lineText, 
					this.parseTypeScript ? TYPE_SCRIPT_PARSER_OPTIONS : JAVA_SCRIPT_PARSER_OPTIONS
				);
			}
			catch(e) {
				console.log(e);
				return [];
			}

			traverse(ast, {
				Literal: (path) => {
					this.parseLiteral(path.node, offset, lineText, quoteMark, lineIndex, isDeleteOperation, result);
				}, 
				TemplateLiteral: (path) => { 
					this.parseLiteral(path.node, offset, lineText, quoteMark, lineIndex, isDeleteOperation, result);
				}
			})
		}
	}
}