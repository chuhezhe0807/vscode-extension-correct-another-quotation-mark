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

test("双引号 -> 反引号", () => {
	const param: QuotationMark[] = [{
		offset: 12,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.BACK_QUOTE,
		lineText: `console.log("zzzz");`,
		languageId: "javascript"
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log(\`zzzz\`);`}]);
})

test("单引号 -> 双引号", () => {
	const param: QuotationMark[] = [{
		offset: 12,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.DOUBLE,
		lineText: `console.log('zzzz');`,
		languageId: "javascript"
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log("zzzz");`}]);
})

test("单引号 -> 反引号", () => {
	const param: QuotationMark[] = [{
		offset: 12,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.BACK_QUOTE,
		lineText: `console.log('zzzz');`,
		languageId: "javascript"
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log(\`zzzz\`);`}]);
})

test("反引号 -> 双引号", () => {
	const param: QuotationMark[] = [{
		offset: 12,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.DOUBLE,
		lineText: `console.log(\`zzzz\`);`,
		languageId: "javascript"
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log("zzzz");`}]);
})

test("反引号 -> 单引号", () => {
	const param: QuotationMark[] = [{
		offset: 12,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.SINGLE,
		lineText: `console.log(\`zzzz\`);`,
		languageId: "javascript"
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log('zzzz');`}]);
})

// 多个修改
test("多个修改 -> 双引号", () => {
	const param: QuotationMark[] = [
		{
			offset: 11,
			lineIndex: 0,
			quoteMark: QuoteMarkEnum.DOUBLE,
			lineText: `const a0 = \`zzzz\`;`,
			languageId: "javascript"
		},
		{
			offset: 16,
			lineIndex: 1,
			quoteMark: QuoteMarkEnum.DOUBLE,
			lineText: `const a1 = "zzzz";`,
			languageId: "javascript"
		},
		{
			offset: 16,
			lineIndex: 2,
			quoteMark: QuoteMarkEnum.DOUBLE,
			lineText: `const a2 = 'zzzz';`,
			languageId: "javascript"
		},
		{
			offset: 11,
			lineIndex: 3,
			quoteMark: QuoteMarkEnum.DOUBLE,
			lineText: `const a3 = 'zzzz';`,
			languageId: "javascript"
		}
	]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([
		{lineIndex: 0, lineText: `const a0 = "zzzz";`},
		{lineIndex: 1, lineText: `const a1 = "zzzz";`},
		{lineIndex: 2, lineText: `const a2 = "zzzz";`},
		{lineIndex: 3, lineText: `const a3 = "zzzz";`},
	]);
})