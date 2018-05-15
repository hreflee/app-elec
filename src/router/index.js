import Vue from 'vue'
import Router from 'vue-router'
import fetch from '../util/fetch'
import login from '../pages/login.vue'
import layout from '../pages/layout'

import basic from '../pages/basic.vue'

import dailyUsage from '../pages/load/daily-usage.vue'
import maxRequriement from '../pages/load/max-requirement.vue'

import query from '../pages/power-cut/query.vue'
import distribute from '../pages/power-cut/distribute.vue'

import predict from '../pages/predict'

import bus from '../store/bus'

const publicPathes = ['/', '/login'];

Vue.use(Router);
let router = new Router({
  routes: [
    {
      path: '/',
      redirect: 'login'
    },
    {
      path: '/login',
      component: login
    },
    {
      path: '/basic',
      component: layout,
      meta: {title: '基础数据', hasChildren: false},
      children: [
        {
          path: '',
          component: basic,
          meta: {title: '基础数据'}
        }
      ]
    },
    {
      path: '/load',
      component: layout,
      meta: {title: '负荷数据', hasChildren: true},
      children: [
        {
          path: '/load/maxRequirement',
          component: maxRequriement,
          meta: {title: '需求峰值'}
        },
        {
          path: '/load/dailyUsage',
          component: dailyUsage,
          meta: {title: '日用电量'}
        }
      ]
    },
    {
      path: '/powerCut',
      component: layout,
      meta: {title: '停电数据', hasChildren: true},
      redirect: '/powerCut/query',
      children: [
        {
          path: '/powerCut/query',
          component: query,
          meta: {title: '停电查询'}
        },
        {
          path: '/powerCut/distribute',
          component: distribute,
          meta: {title: '停电分布'}
        }
      ]
    },
    {
      path: '/predict',
      component: layout,
      meta: {title: '用电预测/停电验证', hasChildren: false},
      children: [
        {
          path: '',
          component: predict,
          meta: {title: '用电预测/停电验证'}
        }
      ]
    }
  ]
});

router.beforeEach((to, from, next) => {
  if (publicPathes.indexOf(to.path) <= -1) {
    fetch('/api/user/checkLogin').then(res => {
      if (res.status === 1) {
        bus.user.username = res.data.username;
        next();
      } else {
        next('/login');
      }
    })
  } else {
    next();
  }
});

export default router;
