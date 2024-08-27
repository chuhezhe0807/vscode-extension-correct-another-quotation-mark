import { HandlerResult } from "vscode-languageserver";
import {parse} from "@babel/parser"
import traverse, { Node } from "@babel/traverse"

import RequestHandler, { QuotationMark, Result } from '../RequestHandler';

/**
 * 处理javascript的请求处理器
 */
export default class JavaScriptRequestHandler implements RequestHandler {
	constructor() {}

	/**
	 * 根据传入的 QuotationMark[] 同步更正另一个引号
	 */
	correctAnotherQuoteMark(param: QuotationMark[]): HandlerResult<Result[], any> {
		const result: Result[] = [];

		for(const quoteMarkParam of param) {
			const {offset, lineText, lineIndex, quoteMark} = quoteMarkParam;
			let ast;
			
			try {
				ast = parse(lineText);
			}
			catch(e) {
				console.log(e);
				return [];
			}

			traverse(ast, {
				Literal: (path) => {
					this.parseLiteral(path.node, offset, lineText, quoteMark, lineIndex, result);
				},
				TemplateLiteral: (path) => {
					this.parseLiteral(path.node, offset, lineText, quoteMark, lineIndex, result);
				}
			})
		}

		return result;
	}

	/**
	 * 根据传入的 QuotationMark[] 同步删除另一个引号，需要删除的引号应该是一对空引号
	 */
	deleteAnotherQuoteMark(param: QuotationMark[]): HandlerResult<Result[], any> {
		throw new Error('Method not implemented.');
	}
	
	/**
	 * 解析 Literal
	 * 
	 * @param node 			Literal 或 TemplateLiteral node
	 * @param offset 		修改的 quoteMark 在 lineText 的索引
	 * @param lineText 		修改所在的整行内容 lineText
	 * @param quoteMark 	修改的 quoteMark
	 * @param lineIndex 	修改所在的整行的行的索引
	 * @param result 		结果数组
	 */
	private parseLiteral(node: Node, offset: number, lineText: string, quoteMark: string, 
	   lineIndex: number, result: Result[]) {
		// 没有添加过才进来，防止同时命中 Literal 和 TemplateLiteral
		if(result.findIndex(res => res.lineIndex === lineIndex) !== -1) {
			return;
		}

		const {start, end} = node || {};

		if((start != null && end != null) && 
		   (start === offset || (end - 1) === offset)) {
			const newLineText = lineText.slice(0, start) + 
				quoteMark + 
				lineText.slice(start + 1, end - 1) + 
				quoteMark + 
				lineText.slice(end);

			result.push({lineIndex, lineText: newLineText});
		}
	}
}