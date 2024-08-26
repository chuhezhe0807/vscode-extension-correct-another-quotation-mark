import {expect, test, beforeAll} from "vitest";

import JavaScriptRequestHandler from "../src/handler/impl/JavaScriptRequestHandler";
import { QuoteMarkEnum, type QuotationMark } from '../src/handler/RequestHandler';

let handler: JavaScriptRequestHandler;

beforeAll(() => {
	handler = new JavaScriptRequestHandler();
});

// init
test.skip("init", () => {
	expect(true).toBe(true);
})

test("双引号 -> 单引号", () => {
	const param: QuotationMark[] = [{
		offset: 12,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.SINGLE,
		lineText: `console.log("zzzz");`,
		languageId: "javascript"
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log('zzzz');`}]);
})

