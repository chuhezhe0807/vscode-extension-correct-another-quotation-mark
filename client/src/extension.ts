import * as path from 'path';
import { workspace, ExtensionContext, window, TextEditor, TextDocument, WorkspaceConfiguration, Range } from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';
import { 
	CORRECT_REQUEST_TYPE, 
	filterWantedChanges, 
	isEnabled, 
	QuoteMarkEnum, 
	SupportedLanguageIDEnum, 
	type QuotationMark, 
	type Result 
} from './Helper';

let client: LanguageClient;
let changeListener;
let activeTextEditor: TextEditor = window.activeTextEditor;
let activeTextEditorChangeListener;
let workspaceConfiguration: WorkspaceConfiguration;
const documentContentMap: Map<TextDocument, string> = new Map(); // 存储workspace中的每一个文档对象，用于onDidChangeTextDocument时获取改动之前的text

export function activate(context: ExtensionContext) {
	const doc = activeTextEditor?.document;
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

		workspaceConfiguration = workspace.getConfiguration("correct-another-quotation-mark", activeTextEditor?.document.uri);
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
 * 
 * TODO 监听 undo redo 事件，并对此作出处理
 * TODO 多个修改同时需要替换时还有问题
 */
function setupChangeListener() {
    if (changeListener) {
      return;
    }

    changeListener = workspace.onDidChangeTextDocument(async event => {
      if (event.document !== activeTextEditor?.document) {
        return;
      }

      if (!isEnabled(workspaceConfiguration, event.document.languageId)) {
        changeListener?.dispose();
        changeListener = undefined;
        return;
      }

      const document = event.document;
      const quotationMarks: QuotationMark[] = [];
	  const contentChanges = filterWantedChanges(event.contentChanges);

      for (const change of contentChanges) {
		const {range, text, rangeOffset} = change;
		const lineIndex = range.start.line;
		const newLineText = document.lineAt(lineIndex).text;
		const oldDocContentText = documentContentMap.get(document);
		const oldQuoteMark = oldDocContentText.at(rangeOffset);
		const offset = range.start.character;
		const oldLineText = newLineText.slice(0, offset) + oldQuoteMark + newLineText.slice(offset + 1);

		if(oldLineText !== newLineText) {
			quotationMarks.push({
				offset,
				lineIndex,
				quoteMark: text as QuoteMarkEnum,
				lineText: oldLineText,
				languageId: document.languageId as SupportedLanguageIDEnum
			});
		}
      }

	  setDocContentsMap(document, document.getText());
	  const result = await client.sendRequest(CORRECT_REQUEST_TYPE, quotationMarks);
	  applyResult(result, document);
    });
  };

/**
 * 应用更正完成另一个引号的结果
 * 
 * @param result 
 */
function applyResult(result: Result[], textDocument: TextDocument) {
    if(!activeTextEditor || activeTextEditor.document !== textDocument) {
        return;
    }

	for(const res of result) {
		const {lineIndex, lineText} = res;
		const lineRange = new Range(lineIndex, 0, lineIndex, lineText.length);

		activeTextEditor.edit(editBuilder => {
			editBuilder.replace(lineRange, lineText);
		});
	}
}