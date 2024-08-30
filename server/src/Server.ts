import {
	createConnection,
	TextDocuments,
	ProposedFeatures
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { handleRequest, correctRequestHandler, CORRECT_REQUEST_TYPE, DELETE_REQUEST_TYPE, deleteRequestHandler } from './handler/RequestHandler';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialized(() => {
});

// 监听请求
connection.onRequest(CORRECT_REQUEST_TYPE, handleRequest(correctRequestHandler));
connection.onRequest(DELETE_REQUEST_TYPE, handleRequest(deleteRequestHandler));

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
