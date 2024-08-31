import {TextDocument, TextDocumentContentChangeEvent, workspace, WorkspaceConfiguration} from "vscode";
import { RequestType } from 'vscode-languageclient';

export enum QuoteMarkEnum {
	SINGLE = `'`,
	DOUBLE = `"`,
	BACK_QUOTE = `\``
}

export enum SupportedLanguageIDEnum {
  JAVA_SCRIPT = "javascript",
  TYPE_SCRIPT = "typescript",
  JAVA = "java"
}

// 只需要考虑一行的就可以了，只有模板字符串可以换行，但是选中它的
// 其中一个修改为单/双引号在换行情况下都是不可行的
export type QuotationMark = {
	offset: number;
  lineIndex: number;
	quoteMark: QuoteMarkEnum;
  lineText: string;
  languageId: SupportedLanguageIDEnum,
  isWantedQuoteMarkDelete: boolean;
}

export type Result = {
  lineIndex: number; // 需要替换的整行内容的行所在行索引
  lineText: string;  // 更正完另一个引号后，需要替换的整行内容
  oldLineText: string; // 更正之前的整行内容
  isDeleteOperation?: boolean; // 此次发送请求的更正是否是删除了引号操作
}

// 期望的、命中本插件工作范围的修改的类型
type WantedContentChanges = {
  isWantedQuoteMarkDelete: boolean;
} & TextDocumentContentChangeEvent;

// 修改成对的引号为单引号、双引号和反引号时更正另一个引号
// 请求的参数类型为 QuotationMark[]，返回值的类型为 string，就是更正另一个引号后的整行文本对应请求参数中的 lineText
export const CORRECT_REQUEST_TYPE = new RequestType<QuotationMark[], Result[], any>("$/correct-another-quotation");

// 删除空引号的后面一个时，同时删除另一个
export const DELETE_REQUEST_TYPE = new RequestType<QuotationMark[], Result[], any>("$/delete-another-quotation");

/**
 * 传入的 configuration 和 languageID 是否满足 correct-another-quotation-mark 插件启用条件
 * 启用条件：文件类型是否符合配置的类型
 * 
 * @returns 
 */
export const isEnabled = (configuration: WorkspaceConfiguration, languageId: string) => {
    if (!configuration || !languageId) {
      return false;
    }

    return configuration.get<string[]>("activationOnLanguage", Object.values(SupportedLanguageIDEnum))
      .includes(languageId);
};

/**
 * 过滤出期望的修改
 * 判断条件为此次修改是不是单引号、双引号或者反引号
 * 
 * @param contentChanges 
 * @param oldDocContentText   修改生效前的文档内容 
 */
export const filterWantedChanges = (contentChanges: readonly TextDocumentContentChangeEvent[], oldDocContentText: string): WantedContentChanges[] => {
  if(contentChanges && contentChanges.length === 0) {
    return [];
  }

  let wantedChanges: WantedContentChanges[] = [];
  const wantedChangeLineValues = [];
  for(const contentChange of contentChanges) {
    const {range, text} = contentChange;

    if(!range.isEmpty && range.isSingleLine) {
      const currentLine = range.start.line;
      // 改动为删除，在成对的空的单引号、双引号或者反引号中间删除时应该删除整对引号，初步判断
      const isWantedQuoteMarkDelete = isDeleteOccursBetweenQuote(contentChange, oldDocContentText);
      // 改动为单引号、双引号或者反引号
      const isWantedQuoteMarkChange = Object.values(QuoteMarkEnum).includes(text as QuoteMarkEnum);

      if(isWantedQuoteMarkDelete || isWantedQuoteMarkChange) {
        if(wantedChangeLineValues.includes(currentLine)) { // 多个改动在一行中也应该排除
          wantedChanges = [];
          break;
        }
        
        wantedChanges.push({...contentChange, isWantedQuoteMarkDelete});
        wantedChangeLineValues.push(currentLine);
      }
    }
  }

  return wantedChanges;
}

/**
 * 判断删除操作是否发生在成对的空的单引号、双引号或者反引号中间
 * 
 * @param contentChange 
 * @param oldDocContentText 
 */
function isDeleteOccursBetweenQuote(contentChange: TextDocumentContentChangeEvent, oldDocContentText: string) {
  const {text, rangeOffset} = contentChange;
  const isDeleteOperation = text === "";
  const oldContentAtOffset = oldDocContentText.at(rangeOffset);
  const oldContentAtOffsetRight = oldDocContentText.at(rangeOffset + 1);

  return isDeleteOperation && (oldContentAtOffset === oldContentAtOffsetRight) && 
    Object.values(QuoteMarkEnum).includes(oldContentAtOffset as QuoteMarkEnum);
}