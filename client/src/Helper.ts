import {TextDocument, workspace} from "vscode";

export const enum QuoteMarkEnum {
	SINGLE,
	DOUBLE,
	BACK_QUOTE
}

export type QuotationMark = {
	offset: number;
	quoteMark: QuoteMarkEnum;
}

export const isEnabled = (document: TextDocument | undefined) => {
    if (!document) {
      return false;
    }

    const config = workspace.getConfiguration("correct-another-quotation-mark", document.uri);
    const languages = config.get<string[]>("activationOnLanguage", ["*"]);
	
    return languages.includes('*') || languages.includes( document.languageId);
  };