import React, {useEffect} from 'react';

type t1 = "" | "zzz";

type t2 = {
	aa: "zzz"
}

type t3 = t2["aa"];

// type t4<T extends string> = T extends `a${infer R}` ? R : "a";

const dep = {show: true};

function LoginPage() {
  useEffect(() => {
	console.log("zzz");
  }, [dep['show']])	

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const username = data.get('username');
    const password = data.get('password');
    console.log('Username:', username, 'Password:', password);
    // 在这里添加登录逻辑
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          用户名:
          <input type="text" name="username" />
        </label>
      </div>
      <div>
        <label>
          密码:
          <input type="password" name="password" />
        </label>
      </div>
      <div>
        <button type="submit">登录</button>
      </div>
    </form>
  );
}

export default LoginPage;