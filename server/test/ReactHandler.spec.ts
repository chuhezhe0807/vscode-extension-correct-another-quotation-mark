import {expect, test, beforeAll} from "vitest";

import ReactHandler from "../src/handler/impl/ReactHandler";
import { QuoteMarkEnum, type QuotationMark } from '../src/handler/RequestHandler';

let handler: ReactHandler;

beforeAll(() => {
	handler = new ReactHandler();
});

test("jsx import 语句中的引号 双引号 -> 单引号", () => {
	const param: QuotationMark[] = [{
		offset: 31,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.SINGLE,
		lineText: `import React, {useEffect} from "react";`,
		languageId: "javascriptreact"
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{
		lineIndex: 0, 
		lineText: `import React, {useEffect} from 'react';`, 
		oldLineText: `import React, {useEffect} from "react";`
	}]);
})

test("jsx import 语句中的引号 单引号 -> 双引号", () => {
	const param: QuotationMark[] = [{
		offset: 31,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.DOUBLE,
		lineText: `import React, {useEffect} from 'react';`,
		languageId: "javascriptreact"
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{
		lineIndex: 0, 
		lineText: `import React, {useEffect} from "react";`, 
		oldLineText: `import React, {useEffect} from 'react';`
	}]);
})

test("jsx render 的组件属性的引号 双引号 -> 单引号", () => {
	const param: QuotationMark[] = [{
		offset: 12,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.SINGLE,
		lineText: `<input type="text" name="username" />`,
		languageId: "javascriptreact"
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{
		lineIndex: 0, 
		lineText: `<input type='text' name="username" />`, 
		oldLineText: `<input type="text" name="username" />`
	}]);
})

test("jsx render 的组件属性的引号 双引号 -> 反引号 (render组件中属性不支持反引号)", () => {
	const param: QuotationMark[] = [{
		offset: 12,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.BACK_QUOTE,
		lineText: `<input type="text" name="username" />`,
		languageId: "javascriptreact"
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([]);
})

test("jsx render 的组件属性的引号 单引号 -> 双引号", () => {
	const param: QuotationMark[] = [{
		offset: 12,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.DOUBLE,
		lineText: `<input type='text' name="username" />`,
		languageId: "javascriptreact"
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{
		lineIndex: 0, 
		lineText: `<input type="text" name="username" />`, 
		oldLineText: `<input type='text' name="username" />`
	}]);
})

test("jsx 多个修改", () => {
	const param: QuotationMark[] = [
		{
			offset: 12,
			lineIndex: 0,
			quoteMark: QuoteMarkEnum.SINGLE,
			lineText: `<input type="text" name="username" />`,
			languageId: "javascriptreact"
		},
		{
			offset: 21,
			lineIndex: 1,
			quoteMark: QuoteMarkEnum.SINGLE,
			lineText: `<input type="password" name="password" />`,
			languageId: "javascriptreact"
		},
		{
			offset: 20,
			lineIndex: 2,
			quoteMark: QuoteMarkEnum.SINGLE,
			lineText: `<button type="submit">登录</button>`,
			languageId: "javascriptreact"
		}
	]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([
		{
			lineIndex: 0, 
			lineText: `<input type='text' name="username" />`, 
			oldLineText: `<input type="text" name="username" />`
		},
		{
			lineIndex: 1, 
			lineText: `<input type='password' name="password" />`, 
			oldLineText: `<input type="password" name="password" />`
		},
		{
			lineIndex: 2, 
			lineText: `<button type='submit'>登录</button>`, 
			oldLineText: `<button type="submit">登录</button>`
		}
	]);
})

//***************************** tsx 部分 *******************

test("tsx 类型声明 单引号 -> 双引号", () => {
	const param: QuotationMark[] = [{
		offset: 15,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.DOUBLE,
		lineText: `type t1 = "" | 'zzz';`,
		languageId: "typescriptreact"
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{
		lineIndex: 0, 
		lineText: `type t1 = "" | "zzz";`, 
		oldLineText: `type t1 = "" | 'zzz';`
	}]);
})

test("tsx 类型声明 双引号 -> 单引号", () => {
	const param: QuotationMark[] = [{
		offset: 15,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.SINGLE,
		lineText: `type t1 = "" | "zzz";`,
		languageId: "typescriptreact"
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{
		lineIndex: 0, 
		lineText: `type t1 = "" | 'zzz';`, 
		oldLineText: `type t1 = "" | "zzz";`
	}]);
})

test("tsx 类型声明 对象访问方式取得类型 双引号 -> 单引号", () => {
	const param: QuotationMark[] = [{
		offset: 13,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.SINGLE,
		lineText: `type t3 = t2["aa"];`,
		languageId: "typescriptreact"
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{
		lineIndex: 0, 
		lineText: `type t3 = t2['aa'];`, 
		oldLineText: `type t3 = t2["aa"];`
	}]);
})