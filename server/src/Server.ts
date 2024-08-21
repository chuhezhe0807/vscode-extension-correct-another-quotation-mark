import {
	createConnection,
	TextDocuments,
	ProposedFeatures
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { correctRequestHandler, correctRequestType } from './handler/RequestHandler';
import { handleError } from './handler/ErrorHandler';

const handleRequest: <Params, Result>(fn: (params: Params) => Result) => (params: Params) => Result 
  	= fn => params => {
		try {
			return fn(params);
		} 
		catch (error) {
			handleError(error as Error);

			throw error;
		}
	};

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

connection.onInitialized(() => {
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {

});

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	// console.log("change", change);
});

connection.onRequest(correctRequestType, handleRequest(correctRequestHandler));

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
