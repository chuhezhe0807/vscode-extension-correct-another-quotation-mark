import { HandlerResult } from 'vscode-languageserver';
import {parse, TemplateCompiler, compileTemplate, SFCDescriptor} from "@vue/compiler-sfc";
// esbuild 打包时需要使用下面的路径引入
// import {parse, TemplateCompiler, compileTemplate, SFCDescriptor} from "@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js";
import {parse as babelParse, ParserOptions} from "@babel/parser";
import traverse, { Node } from "@babel/traverse";

import RequestHandler, { QuotationMark, QuoteMarkEnum, Result } from '../RequestHandler';

const JAVA_SCRIPT_PARSER_OPTIONS: ParserOptions = {
	allowImportExportEverywhere: true,
	allowReturnOutsideFunction: true
};

// 编译结果类型
type CompileResult<T extends boolean> = {
	codeAST: unknown;
	isTemplateAST: T;
	astStartOffset: number;
	astEndOffset: number;
	astOffsetRelateToWholeText: number;
}

// 所有部分编译结果的类型
type AllPartCompileResult = {
	template?: CompileResult<true>, 
	script?: CompileResult<false>, 
	scriptSetup?: CompileResult<false>
}

// <template> 解析完成的ast中修改了的prop对象
type TemplateChangedProp = {
	value: {loc: {start: {offset: number}, end: {offset: number}}}
}

// <template> 解析出来的节点类型
enum NodeTypes {
    ROOT = 0,
    ELEMENT = 1,
    TEXT = 2,
    COMMENT = 3,
    SIMPLE_EXPRESSION = 4,
    INTERPOLATION = 5,
    ATTRIBUTE = 6,
    DIRECTIVE = 7
}

/**
 * vue文件的请求处理器
 */
export default class VueHandler implements RequestHandler {
	/**
	 * 根据传入的 QuotationMark[] 同步更正另一个引号
	 */
	correctAnotherQuoteMark(param: QuotationMark[]): HandlerResult<Result[], any> {
		const result: Result[] = [];
		this.parse(param, result);

		return result;
	}

	/**
	 * 根据传入的 QuotationMark[] 同步删除另一个引号，需要删除的引号应该是一对空引号
	 */
	deleteAnotherQuoteMark(param: QuotationMark[]): HandlerResult<Result[], any> {
		const result: Result[] = [];
		this.parse(param, result, true);

		return result;
	}

	/**
	 * 遍历方法
	 * 
	 * @param param 
	 * @param result 
	 * @param isDeleteOperation			是否是删除操作 
	 * @returns 
	 */
	private parse(param: QuotationMark[], result: Result[], isDeleteOperation = false) {
		if(param.some(p => p.wholeText === undefined)) {
			return;
		}

		let parseResult;
		const {wholeText, quoteMark} = param[0];
			
		try {
			parseResult = parse(wholeText!, {ignoreEmpty: false});
		}
		catch(e) {
			console.log(e);
			return [];
		}

		const {descriptor, descriptor: {template, script, scriptSetup}} = parseResult;

		if(!template && !script && !scriptSetup) {
			return [];
		}

		// 由于返回的结果是整个文档对象，所以解析的结果只会有一个对象，初始值就是原始的未修改的，后面的所有修改都以此为基础
		result.push({wholeText, oldWholeText: wholeText});
		const allPartCompileResult = this.compile(descriptor);
		this.traverse(allPartCompileResult, param.map(i => i.offset), quoteMark, result);
	}

	/**
	 * compile
	 * 
	 * @param descriptor 
	 */
	private compile(descriptor: SFCDescriptor): AllPartCompileResult {
		const {template, script, scriptSetup} = descriptor;
		const result = {};

		if(template) {
			const templateStart = template.loc.start.offset;
			const {ast} = compileTemplate({
				id: "vue handler",
				filename: 'vueHandler.vue',
				source: template.content
			});

			if(ast) {
				const {loc: {start: {offset: startOffset}, end: {offset: endOffset}}} = ast;
				const template = {
					codeAST: ast,
					isTemplateAST: true,
					astStartOffset: templateStart + startOffset,
					astEndOffset: templateStart + endOffset,
					astOffsetRelateToWholeText: templateStart
				}
				Object.assign(result, {template});
			}
		}

		if(script) {
			const {content, loc: {start, end}} = script;
			const scriptAst = this.parseJavaScript(content);
		
			if(scriptAst) {
				const script = {
					codeAST: scriptAst,
					isTemplateAST: false,
					astStartOffset: start.offset,
					astEndOffset: end.offset,
					astOffsetRelateToWholeText: start.offset
				}
				Object.assign(result, {script});
			}
		}

		if(scriptSetup) {
			const {content, loc: {start, end}} = scriptSetup;
			const setupScriptAst = this.parseJavaScript(content);
		
			if(setupScriptAst) {
				const setupScript = {
					codeAST: setupScriptAst,
					isTemplateAST: false,
					astStartOffset: start.offset,
					astEndOffset: end.offset,
					astOffsetRelateToWholeText: start.offset
				}
				Object.assign(result, {setupScript});
			}
		}

		return result;
	}

	/**
	 * 遍历方法
	 * 
	 * @param allPartCompileResult		编译出来的结果
	 * @param offsets			修改位置的索引(相对于整个文档)，修改不会在同一行(Extension.ts中处理过了)
	 * @param quoteMark 		要修改到的引号
	 * @param result 			结果数组，会有wholeText做为初始值。 vue文件是传入整个文档内容解析的，所以返回的值也是直接将整个文档替换（应该分成 <template> 和 <script> 分别替换？）
	 */
	private traverse(allPartCompileResult: AllPartCompileResult, offsets: number[], quoteMark: QuoteMarkEnum, result: Result[]) {
		for(const offset of offsets) {
			const wholeText = result[0].wholeText!;
			const compiledPart = this.findChangePart(allPartCompileResult, offset);
			const {codeAST, isTemplateAST, astOffsetRelateToWholeText} = compiledPart!;

			if(isTemplateAST) {
				// Vue <template> 中不支持反引号
				if(quoteMark !== QuoteMarkEnum.BACK_QUOTE) {
					const templateAST = codeAST as ReturnType<TemplateCompiler["parse"]>;
					const changedProp = this.findTemplateProp(templateAST, astOffsetRelateToWholeText, offset) as TemplateChangedProp;
					const {value: {loc: {start, end}}} = changedProp;
					const text = wholeText.slice(0, start.offset + astOffsetRelateToWholeText) + 
						quoteMark + 
						wholeText.slice(start.offset + astOffsetRelateToWholeText + 1, end.offset + astOffsetRelateToWholeText - 1) + 
						quoteMark + 
						wholeText.slice(end.offset + astOffsetRelateToWholeText);
	
					result[0].wholeText = text;
				}
			}
			else if(codeAST) { // 解析完的javascript代码抽象语法树
				traverse(codeAST as Node, {
					Literal: (path) => {
						this.parseJavaScriptLiteral(path.node, offset, quoteMark, wholeText, astOffsetRelateToWholeText, result);
					}, 
					TemplateLiteral: (path) => { 
						this.parseJavaScriptLiteral(path.node, offset, quoteMark, wholeText, astOffsetRelateToWholeText, result);
					}
				});
			}
		}
	}

	/**
	 * 根据传入的修改发生的索引判断修改所在的部分
	 * 
	 * @param allPartCompileResult 
	 * @param offset 
	 * @returns 
	 */
	private findChangePart(allPartCompileResult: AllPartCompileResult, offset: number): CompileResult<any> | undefined {
		let part: CompileResult<any> | undefined;

		Object.values(allPartCompileResult).forEach(res => {
			const {astStartOffset, astEndOffset} = res;

			if(offset >= astStartOffset && offset <= astEndOffset) {
				part = res;
			}
		});

		return part;
	}

	/**
	 * 从传入的templateAST中找到修改offset所在的prop对象
	 * 
	 * @param templateAST 
	 * @param astOffsetRelateToWholeText 
	 * @param offset 
	 */
	private findTemplateProp(templateAST: any, astOffsetRelateToWholeText: number, offset: number): any {
		let stack = [templateAST];

		while(stack.length > 0) {
			const node = stack.pop();

			for(let i = 0; Array.isArray(node.props) && i < node.props.length ; i++) {
				const prop = node.props[i] || {};
				// 指令
				if(prop.type === NodeTypes.DIRECTIVE) {
					const {loc: {start, end}} = prop.exp;
					// 解析出来的prop字段内容不包含引号，所以左边匹配对比的时候要减一
					// start.offset和end.offset是左闭右开的，右边对比的时候不用减一
					if((offset === (astOffsetRelateToWholeText + start.offset - 1)) || 
						(offset === (astOffsetRelateToWholeText + end.offset))) {
						start.offset -= 1;
						end.offset += 1;
						return {value: prop.exp};
					}
				}
	
				// 属性
				if(prop.type === NodeTypes.ATTRIBUTE) {
					const {loc: {start, end}} = prop.value;
	
					// 属性包含引号
					if((offset === (astOffsetRelateToWholeText + start.offset)) || 
						(offset === (astOffsetRelateToWholeText + end.offset - 1))) {
						return {value: prop.value};
					}
				}
			}

			if(node.children?.length > 0) {
				stack = stack.concat(node.children);
			}
		}
	}

	/**
	 * 解析vue文件中的<script>中的内容，使用解析javascript的解析器
	 * 
	 * @param code 
	 * @param offset 
	 * @param quoteMark 
	 * @param wholeText 
	 * @returns 
	 */
	private parseJavaScript(code: string) {
		let ast;
			
		try {
			ast = babelParse(code, JAVA_SCRIPT_PARSER_OPTIONS);
		}
		catch(e) {
			console.log(e);
			return null;
		}

		return ast;
	}

	/**
	 * 解析 Literal
	 * 
	 * @param node 
	 * @param offset 
	 * @param quoteMark 
	 * @param wholeText 
	 * @param astOffsetRelateToWholeText 
	 * @param result 
	 * @param isDeleteOperation 
	 * @returns 
	 */
	private parseJavaScriptLiteral(node: Node, offset: number, quoteMark: string, wholeText: string, 
		astOffsetRelateToWholeText: number, result: Result[], isDeleteOperation = false) {
		const {start, end} = node || {};

		if(start != null && end != null) {
			const validStart = start + astOffsetRelateToWholeText;
			const validEnd = end + astOffsetRelateToWholeText;

			if(isDeleteOperation && validStart === offset) {
				result[0].wholeText = wholeText.slice(0, validStart) + wholeText.slice(validEnd);
			}
			else if(validStart === offset || ((validEnd - 1) === offset)) {
				result[0].wholeText = wholeText.slice(0, validStart) + 
					quoteMark + 
					wholeText.slice(validStart + 1, validEnd - 1) + 
					quoteMark + 
					wholeText.slice(validEnd);
			}
		}
	}
}