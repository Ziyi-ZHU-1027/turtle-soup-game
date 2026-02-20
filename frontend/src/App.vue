<template>
  <div id="app">
    <header class="app-header">
      <div class="container">
        <router-link to="/" class="logo">
          <span class="logo-icon">🐢</span>
          <span class="logo-text">海龟汤</span>
        </router-link>
        <nav class="nav-links">
          <router-link to="/">首页</router-link>
          <router-link to="/game" v-if="authStore.user">游戏</router-link>
          <router-link to="/admin" v-if="authStore.isAdmin">管理</router-link>
          <template v-if="authStore.user">
            <span class="user-email">{{ authStore.user.email }}</span>
            <button @click="authStore.logout" class="btn-logout">退出</button>
          </template>
          <router-link v-else to="/login" class="btn-login">登录</router-link>
        </nav>
      </div>
    </header>

    <main class="app-main">
      <div class="container">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>

    <footer class="app-footer">
      <div class="container">
        <p>海龟汤 - 情境猜谜游戏 &copy; {{ new Date().getFullYear() }}</p>
        <p class="footer-links">
          <a href="https://github.com/yourusername/turtle-soup" target="_blank">GitHub</a>
          <a href="/privacy">隐私政策</a>
          <a href="/terms">使用条款</a>
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth'
import { onMounted } from 'vue'

const authStore = useAuthStore()

onMounted(() => {
  console.log('App mounted')
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
})
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #1a1a3e, #0a0a1a);
  border-bottom: 1px solid #2a2a5a;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
  color: #c9a84c;
}

.logo-icon {
  font-size: 1.8rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-links a {
  color: #e0e0e0;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.nav-links a:hover {
  background-color: rgba(201, 168, 76, 0.1);
}

.nav-links a.router-link-active {
  color: #c9a84c;
  background-color: rgba(201, 168, 76, 0.1);
}

.user-email {
  color: #9999bb;
  font-size: 0.9rem;
  margin-right: 0.5rem;
}

.btn-logout, .btn-login {
  padding: 0.5rem 1rem;
  border: 1px solid #c9a84c;
  background: transparent;
  color: #c9a84c;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-logout:hover, .btn-login:hover {
  background-color: rgba(201, 168, 76, 0.1);
}

.app-main {
  min-height: calc(100vh - 140px);
  background-color: #0a0a1a;
}

.app-footer {
  background-color: #111128;
  border-top: 1px solid #2a2a5a;
  padding: 1.5rem 0;
  text-align: center;
}

.app-footer p {
  color: #666688;
  margin: 0.5rem 0;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.footer-links a {
  color: #9999bb;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: #c9a84c;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>