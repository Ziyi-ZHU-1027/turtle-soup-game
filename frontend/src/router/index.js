import { createRouter, createWebHistory } from 'vue-router'

// 路由组件（懒加载）
const HomeView = () => import('@/views/HomeView.vue')
const GameView = () => import('@/views/GameView.vue')
const AdminView = () => import('@/views/AdminView.vue')
const LoginView = () => import('@/views/LoginView.vue')

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: '海龟汤 - 首页' }
  },
  {
    path: '/game',
    name: 'game',
    component: GameView,
    meta: { title: '游戏', requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: { title: '管理后台', requiresAdmin: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: '登录' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫 - 认证检查
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || '海龟汤'

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    // 这里需要检查用户是否登录
    // 暂时跳过，后续实现
    next()
  } else if (to.meta.requiresAdmin) {
    // 检查管理员权限
    // 暂时跳过，后续实现
    next()
  } else {
    next()
  }
})

export default router