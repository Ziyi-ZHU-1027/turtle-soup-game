<template>
  <div id="app">
    <header class="app-header">
      <div class="container">
        <router-link to="/" class="logo">
          <span class="logo-icon">🐢</span>
          <span class="logo-text">海龟汤 <span class="logo-subtitle">AI侦探局</span></span>
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
        <p>海龟汤 AI侦探局 &copy; {{ new Date().getFullYear() }}</p>
        <p class="footer-links">
          <a href="https://github.com/Ziyi-ZHU-1027/turtle-soup-game/" target="_blank">GitHub</a>
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
  background: rgba(13, 15, 18, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--glass-border);
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
  color: var(--accent-gold);
}

.logo-icon {
  font-size: 1.8rem;
}

.logo-subtitle {
  font-size: 0.7em;
  color: var(--text-muted);
  font-weight: 400;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-links a {
  color: var(--text-secondary);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.nav-links a:hover {
  background-color: rgba(212, 175, 55, 0.08);
}

.nav-links a.router-link-active {
  color: var(--accent-gold);
  background-color: rgba(212, 175, 55, 0.08);
}

.user-email {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-right: 0.5rem;
}

.btn-logout, .btn-login {
  padding: 0.5rem 1rem;
  border: 1px solid rgba(212, 175, 55, 0.3);
  background: transparent;
  color: var(--accent-gold);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-logout:hover, .btn-login:hover {
  background-color: rgba(212, 175, 55, 0.08);
}

.app-main {
  min-height: calc(100vh - 140px);
  background-color: var(--bg-primary);
}

.app-footer {
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--glass-border);
  padding: 1.5rem 0;
  text-align: center;
}

.app-footer p {
  color: var(--text-muted);
  margin: 0.5rem 0;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
}

.footer-links a {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: var(--accent-gold);
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
