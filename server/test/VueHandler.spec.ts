import {expect, test, beforeAll} from "vitest";

import VueHandler from '../src/handler/impl/VueHandler';
import { QuoteMarkEnum, type QuotationMark } from '../src/handler/RequestHandler';

let handler: VueHandler;
const VUE_NOT_NEED_LINE_TEXT = "";

beforeAll(() => {
	handler = new VueHandler();
});

test("修改 <template> 第一个子元素", () => {
	const param: QuotationMark[] = [{
		offset: 38,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.SINGLE,
		lineText: VUE_NOT_NEED_LINE_TEXT,
		languageId: "vue",
		wholeText: `<template>
  <div>
    <input v-model="username" placeholder='用户名'/>
    <input v-model="password" type="password" placeholder="密码"/>
    <button @click='login'>登录</button>
  </div>
</template>`
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{
		wholeText: `<template>
  <div>
    <input v-model='username' placeholder='用户名'/>
    <input v-model="password" type="password" placeholder="密码"/>
    <button @click='login'>登录</button>
  </div>
</template>`, 
		oldWholeText: `<template>
  <div>
    <input v-model="username" placeholder='用户名'/>
    <input v-model="password" type="password" placeholder="密码"/>
    <button @click='login'>登录</button>
  </div>
</template>`
	}]);
})

test("修改 <template> 第二个子元素", () => {
	const param: QuotationMark[] = [{
		offset: 88,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.SINGLE,
		lineText: VUE_NOT_NEED_LINE_TEXT,
		languageId: "vue",
		wholeText: `<template>
  <div>
    <input v-model="username" placeholder='用户名'/>
    <input v-model="password" type="password" placeholder="密码"/>
    <button @click='login'>登录</button>
  </div>
</template>`
	}]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{
		wholeText: `<template>
  <div>
    <input v-model="username" placeholder='用户名'/>
    <input v-model='password' type="password" placeholder="密码"/>
    <button @click='login'>登录</button>
  </div>
</template>`, 
		oldWholeText: `<template>
  <div>
    <input v-model="username" placeholder='用户名'/>
    <input v-model="password" type="password" placeholder="密码"/>
    <button @click='login'>登录</button>
  </div>
</template>`
	}]);
})

test("修改 <script> 多个引号", () => {
	const param: QuotationMark[] = [{
		offset: 88,
		lineIndex: 0,
		quoteMark: QuoteMarkEnum.SINGLE,
		lineText: VUE_NOT_NEED_LINE_TEXT,
		languageId: "vue",
		wholeText: `<template>
  <div>
    <input v-model="username" placeholder='用户名'/>
    <input v-model="password" type="password" placeholder="密码"/>
    <button @click="login">登录</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: \`\`,
      password: ''
    }
  },
  methods: {
    login() {
      if (this.username && this.password) {
        // 执行登录操作，‌如API调用或页面跳转
        alert('登录成功！‌');
      } else {
        alert(\`用户名或密码不能为空！‌\`);
      }
    }
  }
}
</script>

<style>
input, button {
  margin: 10px;
  padding: 8px;
}
</style>
`
		},
		{
			offset: 261,
			lineIndex: 0,
			quoteMark: QuoteMarkEnum.SINGLE,
			lineText: VUE_NOT_NEED_LINE_TEXT,
			languageId: "vue",
			wholeText: `<template>
	  <div>
		<input v-model="username" placeholder='用户名'/>
		<input v-model="password" type="password" placeholder="密码"/>
		<button @click="login">登录</button>
	  </div>
	</template>
	
	<script>
	export default {
	  data() {
		return {
		  username: \`\`,
		  password: ''
		}
	  },
	  methods: {
		login() {
		  if (this.username && this.password) {
			// 执行登录操作，‌如API调用或页面跳转
			alert("登录成功！‌");
		  } else {
			alert(\`用户名或密码不能为空！‌\`);
		  }
		}
	  }
	}
	</script>
	
	<style>
	input, button {
	  margin: 10px;
	  padding: 8px;
	}
	</style>
	`
			},
			{
				offset: 418,
				lineIndex: 0,
				quoteMark: QuoteMarkEnum.SINGLE,
				lineText: VUE_NOT_NEED_LINE_TEXT,
				languageId: "vue",
				wholeText: `<template>
		  <div>
			<input v-model="username" placeholder='用户名'/>
			<input v-model="password" type="password" placeholder="密码"/>
			<button @click="login">登录</button>
		  </div>
		</template>
		
		<script>
		export default {
		  data() {
			return {
			  username: \`\`,
			  password: ''
			}
		  },
		  methods: {
			login() {
			  if (this.username && this.password) {
				// 执行登录操作，‌如API调用或页面跳转
				alert("登录成功！‌");
			  } else {
				alert(\`用户名或密码不能为空！‌\`);
			  }
			}
		  }
		}
		</script>
		
		<style>
		input, button {
		  margin: 10px;
		  padding: 8px;
		}
		</style>
		`
				}
	]
	
	const result = handler.correctAnotherQuoteMark(param);

	expect(result).toStrictEqual([{
		oldWholeText: '<template>\n  <div>\n    <input v-model="username" placeholder=\'用户名\'/>\n    <input v-model="password" type="password" placeholder="密码"/>\n    <button @click="login">登录</button>\n  </div>\n</template>\n\n<script>\nexport default {\n  data() {\n    return {\n      username: ``,\n      password: \'\'\n    }\n  },\n  methods: {\n    login() {\n      if (this.username && this.password) {\n        // 执行登录操作，‌如API调用或页面跳转\n        alert(\'登录成功！‌\');\n      } else {\n        alert(`用户名或密码不能为空！‌`);\n      }\n    }\n  }\n}\n</script>\n\n<style>\ninput, button {\n  margin: 10px;\n  padding: 8px;\n}\n</style>\n',
		wholeText: '<template>\n  <div>\n    <input v-model="username" placeholder=\'用户名\'/>\n    <input v-model=\'password\' type="password" placeholder="密码"/>\n    <button @click="login">登录</button>\n  </div>\n</template>\n\n<script>\nexport default {\n  data() {\n    return {\n      username: \'\',\n      password: \'\'\n    }\n  },\n  methods: {\n    login() {\n      if (this.username && this.password) {\n        // 执行登录操作，‌如API调用或页面跳转\n        alert(\'登录成功！‌\');\n      } else {\n        alert(`用户名或密码不能为空！‌`);\n      }\n    }\n  }\n}\n</script>\n\n<style>\ninput, button {\n  margin: 10px;\n  padding: 8px;\n}\n</style>\n'
	}]);
})