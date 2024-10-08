import { HandlerResult } from "vscode-languageserver";
import { RequestType } from "vscode-languageserver";

import { handleError } from './ErrorHandler';
import JavaScriptHandler from './impl/JavaScriptHandler';
import VueHandler from './impl/VueHandler';
import ReactHandler from './impl/ReactHandler';

export const enum QuoteMarkEnum {
	SINGLE = `'`,
	DOUBLE = `"`,
	BACK_QUOTE = `\``,
	DELETE_OPERATION = ``
}

export enum SupportedLanguageIDEnum {
	JAVA_SCRIPT = "javascript",
	TYPE_SCRIPT = "typescript",
	VUE = "vue",
	JSX = "javascriptreact",
	TSX = "typescriptreact"
}

// 只需要考虑一行的就可以了，只有模板字符串可以换行，但是选中它的
// 其中一个修改为单/双引号在换行情况下都是不可行的
export type QuotationMark = {
	offset: number;			// 修改位于lineText或者wholeText的索引
	lineIndex: number;
	quoteMark: QuoteMarkEnum;
  	lineText: string;
	languageId: string;
	wholeText?: string;		// 整个文档的内容
}

export type Result = {
	lineIndex?: number;  
	lineText?: string;  		// 更正完另一个引号后，需要替换的整行内容
	oldLineText?: string; 		// 更正之前的整行内容
	wholeText?: string;			// 修改后整个文档的内容，多个修改会同步到这属性中，即多个修改最终只会返回这一个属性
	oldWholeText?: string;		// 未修改前的整个文档的内容
}
  
// 修改成对的引号为单引号、双引号和反引号时更正另一个引号
// 请求的参数类型为 QuotationMark[]，返回值的类型为 string，就是更正另一个引号后的整行文本对应请求参数中的 lineText
export const CORRECT_REQUEST_TYPE = new RequestType<QuotationMark[], Result[], any>("$/correct-another-quotation");

// 删除空引号的后面一个时，同时删除另一个
export const DELETE_REQUEST_TYPE = new RequestType<QuotationMark[], Result[], any>("$/delete-another-quotation");

/**
 * 统一处理请求(错误处理)
 * 
 * @param fn 
 * @returns 
 */
export const handleRequest: <Params, Result>(fn: (params: Params) => Result) => (params: Params) => Result 
  	= fn => params => {
	try {
		return fn(params);
	} 
	catch (error) {
		handleError(error as Error);

		return [] as any;
	}
};

/**
 * 更正另一个引号的请求
 */
export const correctRequestHandler = (param: QuotationMark[]) => {
	if(param.length <= 0) {
		return [];
	}

	const {languageId} = param[0];

	switch(languageId) {
		case SupportedLanguageIDEnum.JAVA_SCRIPT:
		case SupportedLanguageIDEnum.TYPE_SCRIPT:
			return (new JavaScriptHandler(languageId === SupportedLanguageIDEnum.TYPE_SCRIPT))
				.correctAnotherQuoteMark(param);
		case SupportedLanguageIDEnum.VUE:
			return (new VueHandler()).correctAnotherQuoteMark(param);
		case SupportedLanguageIDEnum.JSX:
		case SupportedLanguageIDEnum.TSX:
			return (new ReactHandler()).correctAnotherQuoteMark(param);
		default:
			return [];
	}
}

/**
 * 删除另一个引号的请求
 */
export const deleteRequestHandler = (param: QuotationMark[]) => {
	if(param.length <= 0) {
		return [];
	}

	const {languageId} = param[0];

	switch(languageId) {
		case SupportedLanguageIDEnum.JAVA_SCRIPT:
		case SupportedLanguageIDEnum.TYPE_SCRIPT:
			return (new JavaScriptHandler(languageId === SupportedLanguageIDEnum.TYPE_SCRIPT))
			.deleteAnotherQuoteMark(param);
		case SupportedLanguageIDEnum.VUE:
			return (new VueHandler()).deleteAnotherQuoteMark(param);
		case SupportedLanguageIDEnum.JSX:
		case SupportedLanguageIDEnum.TSX:
			return (new ReactHandler()).deleteAnotherQuoteMark(param);
		default:
			return [];
	}
}

/**
 * 各实现类主要是ast解析器用的不一样
 */
export default interface RequestHandler {
	/**
	 * 根据传入的 QuotationMark[] 同步更正另一个引号
	 */
	correctAnotherQuoteMark(param: QuotationMark[]): HandlerResult<Result[], any>;

	/**
	 * 根据传入的 QuotationMark[] 同步删除另一个引号，需要删除的引号应该是一对空引号
	 */
	deleteAnotherQuoteMark(param: QuotationMark[]): HandlerResult<Result[], any>;
}