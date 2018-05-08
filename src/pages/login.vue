<template>
  <div class="page-wrapper">
    <div class="form-wrapper">
      <h1 class="title">电力数据分析系统</h1>
      <el-form class="form" :model="loginFormData">
        <el-form-item>
          <el-input v-model="loginFormData.username">
            <template slot="prefix">
              <i class="iconfont icon-my_light"></i>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-input v-model="loginFormData.password" type="password">
            <template slot="prefix">
              <i class="iconfont icon-lock"></i>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button class="submit-btn" type="success" @click="submit">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script type="text/ecmascript-6">
  import fetch from '../util/fetch'
  import bus from '../store/bus'
  export default {
    name: 'login',
    data () {
      return {
        loginFormData: {
          username: '',
          password: ''
        }
      }
    },
    methods: {
      submit () {
        fetch('/api/user/login', {
          method: 'POST',
          body: {
            username: this.loginFormData.username,
            password: this.loginFormData.password
          }
        }).then(res => {
          if (res.status === 1) {
            bus.user.username = this.loginFormData.username;
            this.$router.push('/basic');
          } else {
            this.$message.error(res.data);
          }
        });
      }
    }
  }
</script>

<style lang="scss" scoped>
  .page-wrapper {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: url("../assets/login-bg.jpg") no-repeat fixed;
    background-size: cover;
    background-position: bottom;
  }
  .form-wrapper {
    position: relative;
    width: 25%;
    margin: 120px auto;
    padding: 30px;
    background: inherit;
    &:after {
      content: "";
      display: block;
      width:100%;
      height:100%;
      position: absolute;
      left:0;
      top:0;
      z-index: 2;
      background: inherit;
      filter: blur(20px);
    }
    .title {
      position: relative;
      z-index:5;
      margin-bottom: 30px;
      text-align: center;
      font-size: 28px;
      font-weight: normal;
      color: #eee;
    }
    .form {
      position: relative;
      z-index: 5;
    }
    .iconfont {
      display: inline-block;
      width: 42px;
      font-size: 20px;
      line-height:47px;
    }
    /deep/ .el-input {
      input {
        height: 47px;
        padding-left: 45px;
        background: rgba(255, 255, 255, 0.9);
      }
    }
    .submit-btn {
      width: 100%;
    }
  }
</style>
