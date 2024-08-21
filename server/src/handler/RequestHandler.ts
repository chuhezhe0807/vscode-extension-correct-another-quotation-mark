import { HandlerResult } from "vscode-languageserver";

import { RequestType, VersionedTextDocumentIdentifier } from "vscode-languageserver";

type QuotationMark = {
	offset: number;
	quoteMark: QuoteMarkEnum;
}

export type Params = {
	readonly textDocument: VersionedTextDocumentIdentifier;
	readonly quotationMarks: QuotationMark[];
}

export type Result = QuotationMark[];

export const enum QuoteMarkEnum {
	SINGLE,
	DOUBLE,
	BACK_QUOTE
}

export const correctRequestType = new RequestType<Params, Result, any>("$/correct-another-quotation");

// TODO 删除空引号的后面一个时，同时删除另一个
export const deleteRequestType = new RequestType<Params, Result, any>("$/delete-another-quotation");

/**
 * 
 * 
 * @returns 
 */
export const correctRequestHandler: (param: Params) => HandlerResult<Result, any> = () => {
	return [];
}