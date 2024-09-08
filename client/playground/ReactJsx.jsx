import React, {useEffect} from 'react';

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
          <input type="text" name="username" opt={{a: "zzz"}} />
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