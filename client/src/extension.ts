import * as path from 'path';
import { workspace, ExtensionContext, window, TextEditor, TextDocument, WorkspaceConfiguration, Range, TextDocumentChangeReason } from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';
import { 
	CORRECT_REQUEST_TYPE, 
	DELETE_REQUEST_TYPE, 
	filterWantedChanges, 
	isEnabled, 
	QuoteMarkEnum, 
	SupportedLanguageIDEnum, 
	type QuotationMark, 
	type Result 
} from './Helper';

let client: LanguageClient;
let changeListener;
let activeTextEditorChangeListener;
let workspaceConfiguration: WorkspaceConfiguration;
let prevLineInfoBeforeCorrect: Result[]; // 上一个更正操作所在行的更正之前的信息(行号，行内容)
const documentContentMap: Map<TextDocument, string> = new Map(); // 存储workspace中的每一个文档对象，用于onDidChangeTextDocument时获取改动之前的text

export function activate(context: ExtensionContext) {
	const doc = window.activeTextEditor?.document;
	workspaceConfiguration = workspace.getConfiguration("correct-another-quotation-mark", doc?.uri);

	if(isEnabled(workspaceConfiguration, doc?.languageId)) {
		setDocContentsMap(doc, doc.getText());
	}

	startClient(context);
	setupChangeListener();
	setupChangeConfigurationListener();
	setupActiveTextEditorChangeListener();
}

export function deactivate(): Thenable<void> | undefined {
  changeListener?.dispose();
  activeTextEditorChangeListener?.dispose();

	if (!client) {
		return undefined;
	}

	return client.stop();
}

/**
 * 设置 prevLineInfoBeforeCorrect 的值
 */
function setPrevLineInfoBeforeCorrect(lineInfo: Result[]) {
	prevLineInfoBeforeCorrect = lineInfo;
}

/**
 * 设置 documentContentMap 的值
 */
function setDocContentsMap(doc: TextDocument, text: string) {
	documentContentMap.set(doc, text);
}

/**
 * 启动客户端
 * client.start() 后也同时会启动服务端
 * 
 * @param context 
 */
function startClient(context: ExtensionContext) {
	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc }
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {};

	// Create the language client and start the client.
	client = new LanguageClient(
		'quotationMark',
		'Quotation Mark',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

/**
 * 设置 changeConfiguration 监听事件 
 */
function setupChangeConfigurationListener() {
	workspace.onDidChangeConfiguration(event => {
		// purges cache for `vscode.workspace.getConfiguration`
		if (!event.affectsConfiguration("correct-another-quotation-mark")) {
		  return;
		}

		workspaceConfiguration = workspace.getConfiguration("correct-another-quotation-mark", window.activeTextEditor?.document.uri);
	})
}

/**
 * 设置 activeTextEditorChange 监听事件
 */
function setupActiveTextEditorChangeListener() {
	if(activeTextEditorChangeListener) {
		return;
	}

	activeTextEditorChangeListener = window.onDidChangeActiveTextEditor((editor) => {
		if(editor) {
			setDocContentsMap(editor.document, editor.document.getText());
		}
	})
}

/**
 * 设置 onDidChangeTextDocument 监听事件
 */
function setupChangeListener() {
    if (changeListener) {
      return;
    }

    changeListener = workspace.onDidChangeTextDocument(async event => {
      if (event.document !== window.activeTextEditor?.document) {
        return;
      }

      if (!isEnabled(workspaceConfiguration, event.document.languageId)) {
        changeListener?.dispose();
        changeListener = undefined;
        return;
      }

	  // 撤回操作导致的修改
	  if(event.reason === TextDocumentChangeReason.Undo) {
		if(prevLineInfoBeforeCorrect && prevLineInfoBeforeCorrect.length > 0) {
			applyResult(prevLineInfoBeforeCorrect, event.document, prevLineInfoBeforeCorrect[0].isDeleteOperation, true);
			setPrevLineInfoBeforeCorrect(undefined);
		}

		setDocContentsMap(event.document, event.document.getText());

		return;
	  }

      const document = event.document;
      const quotationMarks: QuotationMark[] = [];
	  const oldDocContentText = documentContentMap.get(document);
	  const contentChanges = filterWantedChanges(event.contentChanges, oldDocContentText);

      for (const change of contentChanges) {
		const {range, text, rangeOffset, isWantedQuoteMarkDelete} = change;
		const lineIndex = range.start.line;
		const newLineText = document.lineAt(lineIndex).text;
		const oldQuoteMark = oldDocContentText.at(rangeOffset);
		const offset = range.start.character;
		const oldLineText = newLineText.slice(0, offset) + 
			oldQuoteMark + 
			(isWantedQuoteMarkDelete ? oldQuoteMark : "") +
			newLineText.slice(offset + 1);

		if(isWantedQuoteMarkDelete || oldLineText !== newLineText) {
			quotationMarks.push({
				offset,
				lineIndex,
				quoteMark: text as QuoteMarkEnum,
				lineText: oldLineText,
				languageId: document.languageId as SupportedLanguageIDEnum,
				isWantedQuoteMarkDelete
			});
		}
      }

	  if(quotationMarks.length > 0) {
		const isDeleteOperation = quotationMarks[0].isWantedQuoteMarkDelete;
		const sortedQuotationMarks = quotationMarks.sort((a, b) => a.lineIndex - b.lineIndex);
		const result = await client.sendRequest(isDeleteOperation ? DELETE_REQUEST_TYPE : CORRECT_REQUEST_TYPE, sortedQuotationMarks);
		result.forEach(res => res.isDeleteOperation = isDeleteOperation);

		applyResult(result, document, isDeleteOperation);
		setPrevLineInfoBeforeCorrect(result);
	  }

	  setDocContentsMap(document, document.getText());
    });
  };

/**
 * 应用更正完成另一个引号的结果
 * 
 * @param result 
 * @param textDocument 
 * @param isDeleteOperation 是否是删除操作(从中间删除成对引号) 
 * @param useOldLineText  	是否使用 result 中的 oldLineText 进行应用结果，undo时使用
 */
function applyResult(result: Result[], textDocument: TextDocument, isDeleteOperation: boolean, useOldLineText = false) {
    if(!window.activeTextEditor || window.activeTextEditor.document !== textDocument) {
        return;
    }

	window.activeTextEditor.edit(editBuilder => {
		for(const res of result) {
			const {lineIndex, lineText, oldLineText} = res;
			const usedLineText = useOldLineText ? oldLineText : lineText;
			// 如果是删除操作，相比于替换之前的文本少了一个字符，所以范围需要加1
			const lineRange = new Range(lineIndex, 0, lineIndex, usedLineText.length + (isDeleteOperation ? 1 : 0));
	
			editBuilder.replace(lineRange, usedLineText);
		}
	});
}