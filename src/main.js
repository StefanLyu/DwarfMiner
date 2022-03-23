import { createApp } from 'vue'
import './tailwind.css'
import App from './App.vue'
import { routes } from './routes.js'
import { createRouter, createWebHistory } from 'vue-router'



// Vuex
import { createStore } from 'vuex'

// import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'

// 引入带有Authorization的axios
import axios from './api/axios';

// 引入store
import store from './store'

const app = createApp(App)

const router = createRouter({
  history: createWebHistory(),
  routes,
})

app.use(router)
app.use(store)
app.mount('#app')
// app.use(Antd)


//注册全局路由守卫，在页面跳转时检查登录状态
router.beforeEach(async (to, from, next) => {
  console.log(from.path, to.path);
  if(to.path === '/login' || from.path === '/login') {
    await next();
  } else {
    // 检查vuex里是否有username
    if(!store._state.data.username) {
        next('/login');
        return;
    }
    // 检查localStorage里是否有token
    await axios.post("/api/authorization").then(res => {
      next();
    }, err => {
      console.log(err.response.data.msg);
      next('/login');
    });
  }
})