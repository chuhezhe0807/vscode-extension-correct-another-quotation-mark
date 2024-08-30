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

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log('zzzz');`, oldLineText: `console.log("zzzz");`}]);
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

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log(\`zzzz\`);`, oldLineText: `console.log("zzzz");`}]);
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

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log("zzzz");`, oldLineText: `console.log('zzzz');`}]);
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

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log(\`zzzz\`);`, oldLineText: `console.log('zzzz');`}]);
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

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log("zzzz");`, oldLineText: `console.log(\`zzzz\`);`}]);
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

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log('zzzz');`, oldLineText: `console.log(\`zzzz\`);`}]);
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
		{lineIndex: 0, lineText: `const a0 = "zzzz";`, oldLineText: `const a0 = \`zzzz\`;`},
		{lineIndex: 1, lineText: `const a1 = "zzzz";`, oldLineText: `const a1 = "zzzz";`},
		{lineIndex: 2, lineText: `const a2 = "zzzz";`, oldLineText: `const a2 = 'zzzz';`},
		{lineIndex: 3, lineText: `const a3 = "zzzz";`, oldLineText: `const a3 = 'zzzz';`},
	]);
})

// 删除操作
test("删除单引号", () => {
	const param: QuotationMark[] = [{
		offset: 12,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.DELETE_OPERATION,
		lineText: `console.log('');`,
		languageId: "javascript"
	}]
	
	const result = handler.deleteAnotherQuoteMark(param);

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log();`, oldLineText: `console.log('');`}]);
})

test("删除双引号", () => {
	const param: QuotationMark[] = [{
		offset: 12,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.DELETE_OPERATION,
		lineText: `console.log("");`,
		languageId: "javascript"
	}]
	
	const result = handler.deleteAnotherQuoteMark(param);

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log();`, oldLineText: `console.log("");`}]);
})

test("删除反引号", () => {
	const param: QuotationMark[] = [{
		offset: 12,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.DELETE_OPERATION,
		lineText: `console.log(\`\`);`,
		languageId: "javascript"
	}]
	
	const result = handler.deleteAnotherQuoteMark(param);

	expect(result).toStrictEqual([{lineIndex: 0, lineText: `console.log();`, oldLineText: `console.log(\`\`);`}]);
})

test("删除多个引号", () => {
	const param: QuotationMark[] = [
		{
			offset: 11,
			lineIndex: 0,
			quoteMark: QuoteMarkEnum.DELETE_OPERATION,
			lineText: `const a0 = \`\`;`,
			languageId: "javascript"
		},
		{
			offset: 11,
			lineIndex: 2,
			quoteMark: QuoteMarkEnum.DELETE_OPERATION,
			lineText: `const a2 = '';`,
			languageId: "javascript"
		},
		{
			offset: 11,
			lineIndex: 3,
			quoteMark: QuoteMarkEnum.DELETE_OPERATION,
			lineText: `const a3 = "";`,
			languageId: "javascript"
		}
	]
	
	const result = handler.deleteAnotherQuoteMark(param);

	expect(result).toStrictEqual([
		{lineIndex: 0, lineText: `const a0 = ;`, oldLineText: `const a0 = \`\`;`},
		{lineIndex: 2, lineText: `const a2 = ;`, oldLineText: `const a2 = '';`},
		{lineIndex: 3, lineText: `const a3 = ;`, oldLineText: `const a3 = "";`},
	]);
})