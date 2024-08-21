import * as path from 'path';
import { workspace, ExtensionContext, window, TextEditor } from 'vscode';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';
import { isEnabled, QuotationMark } from './Helper';

let client: LanguageClient;
let changeListener;
let activeTextEditor: TextEditor | undefined = window.activeTextEditor;

export function activate(context: ExtensionContext) {
	startClient(context);
  setupChangeListener();
}

export function deactivate(): Thenable<void> | undefined {
  changeListener?.dispose();

	if (!client) {
		return undefined;
	}

	return client.stop();
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
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'plaintext' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

/**
 * 设置 onDidChangeTextDocument 监听事件
 * 
 * @returns 
 */
function setupChangeListener() {
    if (changeListener) {
      return;
    }

    changeListener = workspace.onDidChangeTextDocument(async event => {
      if (event.document !== activeTextEditor?.document) {
        return;
      }

      if (!isEnabled(event.document)) {
        changeListener?.dispose();
        changeListener = undefined;
        return;
      }

      if (event.contentChanges.length === 0) {
        return;
      }

      const currentText = event.document.getText();
      const quotationMarks: QuotationMark[] = [];
        
      for (const change of event.contentChanges) {
        const line = event.document.lineAt(change.range.start.line);
        const lineStart = event.document.offsetAt(line.range.start);
      }


      doAutoCorrectAnotherQuotationMark();
    });
  };

function doAutoCorrectAnotherQuotationMark() {

}