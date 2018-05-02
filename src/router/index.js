import Vue from 'vue'
import Router from 'vue-router'
import login from '../pages/login.vue'
import layout from '../pages/layout'

Vue.use(Router);
console.log(login);
export default new Router({
  routes: [
    {
      path: '/',
      redirect: 'login'
    },
    {
      path: '/login',
      name: 'login',
      component: login
    },
    {
      path: '/app',
      component: layout,
      children: [
        {
          path: 'basic'
        }
      ]
    }
  ]
})
