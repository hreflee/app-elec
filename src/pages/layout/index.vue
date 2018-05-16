<template>
  <el-container class="container">
    <el-aside width="180px" class="left-side">
      <el-menu class="menu"
               :default-active="$route.path"
               :default-openeds="allPath"
               :router="true"
               background-color="#1d2438"
               text-color="#fff"
               active-text-color="#ffd04b">
        <template v-for="routeItem in routes">
          <el-menu-item v-if="!routeItem.meta.hasChildren" :index="routeItem.path">
            <template slot="title">{{routeItem.meta.title}}</template>
          </el-menu-item>
          <el-submenu v-if="routeItem.meta.hasChildren" :index="routeItem.path">
            <template slot="title">{{routeItem.meta.title}}</template>
            <el-menu-item v-for="subRouteItem in routeItem.children" :index="subRouteItem.path">
              <template slot="title">{{subRouteItem.meta.title}}</template>
            </el-menu-item>
          </el-submenu>
        </template>
      </el-menu>
    </el-aside>

    <el-container class="right-side">
      <el-header class="header">
        <h1>{{$route.meta.title}} <span class="el-icon-loading" v-show="loading"></span></h1>
        <el-dropdown @command="logout">
          <span class="el-dropdown-link">
            {{username}}<i class="el-icon-arrow-down el-icon--right"></i>
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item>登出</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </el-header>

      <el-main class="content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script type="text/ecmascript-6">
  import bus from '../../store/bus'
  import fetch from '../../util/fetch'
  export default {
    name: 'layout',
    data () {
      return {

      }
    },
    computed: {
      routes () {
        return this.$router.options.routes.filter(item => {
          return ['/', '/login'].indexOf(item.path) <= -1;
        });
      },
      allPath () {
        return this.$router.options.routes.map(item => item.path);
      },
      username () {
        return bus.user.username;
      },
      loading () {
        return bus.loading
      }
    },
    methods: {
      logout () {
        fetch('/api/user/logout').then(res => {
          this.$router.replace('/login')
        });
      }
    }
  }
</script>

<style lang="scss" scoped>
  .container {
    height: 100vh;
  }
  .left-side {
    .menu {
      min-height: 100vh;
      overflow-x: hidden;
    }
  }
  .right-side {
    background: #fafafb;
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      background: white;
    }
    .content {
      display: flex;
      flex-direction: column;
      background: white;
      /deep/ > div {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        & > .el-container {
          flex: 1 1 auto;
        }
      }
    }
  }
</style>
