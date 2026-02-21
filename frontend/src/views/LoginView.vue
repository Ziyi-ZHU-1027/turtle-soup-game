<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-header">
        <h1>登录 / 注册</h1>
        <p>开始你的海龟汤推理之旅</p>
      </div>

      <div class="login-tabs">
        <button
          :class="['tab-button', { active: activeTab === 'login' }]"
          @click="activeTab = 'login'"
        >
          登录
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'register' }]"
          @click="activeTab = 'register'"
        >
          注册
        </button>
      </div>

      <div class="login-form">
        <form @submit.prevent="handleSubmit">
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          <div v-if="activeTab === 'register'" class="form-group">
            <label for="name">用户名</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="输入用户名"
              required
            />
          </div>

          <div class="form-group">
            <label for="email">邮箱</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="输入邮箱"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">密码</label>
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="输入密码"
              required
              minlength="6"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '👁️‍🗨️' : '👁️' }}
            </button>
          </div>

          <div v-if="activeTab === 'register'" class="form-group">
            <label for="confirmPassword">确认密码</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              placeholder="再次输入密码"
              required
              minlength="6"
            />
          </div>

          <div class="form-options">
            <label class="checkbox">
              <input type="checkbox" v-model="form.remember" />
              <span>记住我</span>
            </label>
            <router-link to="/forgot-password" v-if="activeTab === 'login'">
              忘记密码？
            </router-link>
          </div>

          <button type="submit" class="btn-submit" :disabled="loading">
            <span v-if="loading">处理中...</span>
            <span v-else>{{ activeTab === 'login' ? '登录' : '注册' }}</span>
          </button>

          <div class="login-divider">
            <span>或</span>
          </div>

          <button type="button" class="btn-guest" @click="continueAsGuest">
            游客继续
          </button>

          <div class="form-footer">
            <p v-if="activeTab === 'login'">
              还没有账号？
              <a href="#" @click.prevent="activeTab = 'register'">立即注册</a>
            </p>
            <p v-else>
              已有账号？
              <a href="#" @click.prevent="activeTab = 'login'">立即登录</a>
            </p>
          </div>
        </form>
      </div>

      <div class="login-info">
        <div class="info-card">
          <h3>为什么需要账号？</h3>
          <ul>
            <li>保存游戏进度和历史对话</li>
            <li>记录推理能力和统计数据</li>
            <li>参与社区讨论和谜题创作</li>
            <li>获取个性化推荐和提示</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('login')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  remember: false
})

const handleSubmit = async () => {
  if (loading.value) return

  // 重置错误信息
  error.value = ''

  // 表单验证
  if (activeTab.value === 'register') {
    if (form.password !== form.confirmPassword) {
      error.value = '两次输入的密码不一致'
      return
    }
    if (form.password.length < 6) {
      error.value = '密码至少需要6个字符'
      return
    }
    if (!form.name.trim()) {
      error.value = '请输入用户名'
      return
    }
  }

  if (!form.email.trim()) {
    error.value = '请输入邮箱'
    return
  }

  if (!form.password.trim()) {
    error.value = '请输入密码'
    return
  }

  loading.value = true

  try {
    if (activeTab.value === 'login') {
      // 调用真实登录API
      const result = await authStore.login(form.email, form.password)

      if (result.success) {
        console.log('登录成功:', result.user)

        // 检查是否为管理员
        if (authStore.isAdmin) {
          console.log('管理员登录成功，跳转到管理后台')
          router.push('/admin')
        } else {
          console.log('普通用户登录成功，跳转到首页')
          router.push('/')
        }
      } else {
        error.value = result.error || '登录失败，请检查邮箱和密码'
      }
    } else {
      // 调用真实注册API
      const result = await authStore.register(form.email, form.password, form.name)

      if (result.success) {
        console.log('注册成功:', result.user)

        if (result.needsConfirmation) {
          error.value = '注册成功！请检查邮箱验证邮件'
        } else {
          // 自动登录成功
          if (authStore.isAdmin) {
            router.push('/admin')
          } else {
            router.push('/')
          }
        }

        // 切换到登录标签
        activeTab.value = 'login'
        // 清空表单
        form.name = ''
        form.email = ''
        form.password = ''
        form.confirmPassword = ''
      } else {
        error.value = result.error || '注册失败，请重试'
      }
    }
  } catch (err) {
    console.error('认证错误:', err)
    error.value = err.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}

const continueAsGuest = () => {
  authStore.loginAsGuest()
  router.push('/game')
}
</script>

<style scoped>
.login-view {
  min-height: calc(100vh - 140px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.login-container {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: 3rem;
  max-width: 500px;
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  color: var(--accent-gold);
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: var(--text-muted);
}

.login-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.tab-button {
  flex: 1;
  padding: 1rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  transition: all 0.3s;
  font-size: 1rem;
  font-weight: 500;
}

.tab-button:hover {
  background-color: rgba(212, 175, 55, 0.05);
  color: var(--text-secondary);
}

.tab-button.active {
  background-color: rgba(212, 175, 55, 0.08);
  color: var(--accent-gold);
  border-bottom: 2px solid var(--accent-gold);
}

.login-form {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.form-group label {
  display: block;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 1rem;
  transition: all 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-gold);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.1);
}

.form-group input::placeholder {
  color: var(--text-muted);
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  top: 2.4rem;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
}

.toggle-password:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
}

.checkbox input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.form-options a {
  color: var(--accent-gold);
  text-decoration: none;
  font-size: 0.9rem;
}

.form-options a:hover {
  text-decoration: underline;
}

.btn-submit {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, var(--accent-gold), #8a7535);
  color: var(--bg-primary);
  border: none;
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 1.5rem;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-divider {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: var(--border-color);
}

.login-divider span {
  padding: 0 1rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.btn-guest {
  width: 100%;
  padding: 1rem;
  background: transparent;
  color: var(--accent-gold);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 1.5rem;
}

.btn-guest:hover {
  background-color: rgba(212, 175, 55, 0.08);
}

.form-footer {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.form-footer a {
  color: var(--accent-gold);
  text-decoration: none;
  font-weight: 500;
}

.form-footer a:hover {
  text-decoration: underline;
}

.login-info {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.info-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 1.5rem;
}

.info-card h3 {
  color: var(--text-secondary);
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.info-card ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.info-card li {
  color: var(--text-muted);
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
}

.info-card li::before {
  content: '✓';
  color: var(--accent-green);
  position: absolute;
  left: 0;
}

.error-message {
  background-color: rgba(231, 76, 60, 0.1);
  border: 1px solid #e74c3c;
  border-radius: 6px;
  padding: 1rem;
  color: #e74c3c;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .login-container {
    padding: 2rem 1.5rem;
  }

  .login-view {
    padding: 1rem;
  }
}
</style>
