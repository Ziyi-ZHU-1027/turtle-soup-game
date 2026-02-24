import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 路由组件（懒加载）
const HomeView = () => import('@/views/HomeView.vue')
const GameView = () => import('@/views/GameView.vue')
const AdminView = () => import('@/views/AdminView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const ShareView = () => import('@/views/ShareView.vue')
const ProfileView = () => import('@/views/ProfileView.vue')
const TutorialView = () => import('@/views/TutorialView.vue')

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
    path: '/tutorial',
    name: 'tutorial',
    component: TutorialView,
    meta: { title: '新手教程 - 海龟汤' }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: '登录' }
  },
  {
    path: '/share/:shareId',
    name: 'share',
    component: ShareView,
    meta: { title: '分享 - 海龟汤' }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { title: '我的进度', requiresAuth: true }
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

  // 获取认证store
  const authStore = useAuthStore()

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    // 检查用户是否已登录
    if (!authStore.isAuthenticated) {
      // 未登录，重定向到登录页
      console.log('需要登录，重定向到登录页')
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
    next()
  } else if (to.meta.requiresAdmin) {
    // 检查管理员权限
    if (!authStore.isAuthenticated) {
      // 未登录，重定向到登录页
      console.log('需要登录，重定向到登录页')
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }

    if (!authStore.isAdmin) {
      // 已登录但不是管理员，重定向到首页并显示提示
      console.log('需要管理员权限，重定向到首页')
      // 可以在这里添加一个提示，比如使用Toast
      next({ name: 'home' })
      return
    }
    next()
  } else {
    next()
  }
})

export default router