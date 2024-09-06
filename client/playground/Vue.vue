<template>
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
      username: '',
      password: ``
    }
  },
  methods: {
    login() {
      if (this.username && this.password) {
        // 执行登录操作，‌如API调用或页面跳转
        alert('登录成功！‌');
      } else {
        alert(`用户名或密码不能为空！‌`);
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
