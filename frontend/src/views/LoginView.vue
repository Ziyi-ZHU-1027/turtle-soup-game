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

const router = useRouter()
const activeTab = ref('login')
const showPassword = ref(false)
const loading = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  remember: false
})

const handleSubmit = async () => {
  if (loading.value) return

  // 表单验证
  if (activeTab.value === 'register') {
    if (form.password !== form.confirmPassword) {
      alert('两次输入的密码不一致')
      return
    }
    if (form.password.length < 6) {
      alert('密码至少需要6个字符')
      return
    }
  }

  loading.value = true

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (activeTab.value === 'login') {
      console.log('登录:', { email: form.email, remember: form.remember })
      // 这里应该调用实际的登录API
      alert('登录成功！')
      router.push('/')
    } else {
      console.log('注册:', { name: form.name, email: form.email })
      // 这里应该调用实际的注册API
      alert('注册成功！请检查邮箱验证')
      activeTab.value = 'login'
    }
  } catch (error) {
    console.error('认证错误:', error)
    alert('操作失败，请重试')
  } finally {
    loading.value = false
  }
}

const continueAsGuest = () => {
  alert('以游客身份继续，部分功能将受限')
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
  background-color: #1a1a3e;
  border: 1px solid #2a2a5a;
  border-radius: 16px;
  padding: 3rem;
  max-width: 500px;
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  color: #c9a84c;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #9999bb;
}

.login-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #2a2a5a;
}

.tab-button {
  flex: 1;
  padding: 1rem;
  background: transparent;
  border: none;
  color: #9999bb;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  transition: all 0.3s;
  font-size: 1rem;
  font-weight: 500;
}

.tab-button:hover {
  background-color: rgba(201, 168, 76, 0.05);
  color: #e0e0e0;
}

.tab-button.active {
  background-color: rgba(201, 168, 76, 0.1);
  color: #c9a84c;
  border-bottom: 2px solid #c9a84c;
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
  color: #e0e0e0;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #111128;
  border: 1px solid #2a2a5a;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 1rem;
  transition: all 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #c9a84c;
  box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.1);
}

.form-group input::placeholder {
  color: #666688;
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  top: 2.4rem;
  background: none;
  border: none;
  color: #9999bb;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
}

.toggle-password:hover {
  background-color: rgba(255, 255, 255, 0.1);
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
  color: #e0e0e0;
  font-size: 0.9rem;
  cursor: pointer;
}

.checkbox input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.form-options a {
  color: #c9a84c;
  text-decoration: none;
  font-size: 0.9rem;
}

.form-options a:hover {
  text-decoration: underline;
}

.btn-submit {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #c9a84c, #8a7535);
  color: #0a0a1a;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 1.5rem;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(201, 168, 76, 0.3);
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
  background-color: #2a2a5a;
}

.login-divider span {
  padding: 0 1rem;
  color: #666688;
  font-size: 0.9rem;
}

.btn-guest {
  width: 100%;
  padding: 1rem;
  background: transparent;
  color: #c9a84c;
  border: 1px solid #c9a84c;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 1.5rem;
}

.btn-guest:hover {
  background-color: rgba(201, 168, 76, 0.1);
}

.form-footer {
  text-align: center;
  color: #9999bb;
  font-size: 0.9rem;
}

.form-footer a {
  color: #c9a84c;
  text-decoration: none;
  font-weight: 500;
}

.form-footer a:hover {
  text-decoration: underline;
}

.login-info {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #2a2a5a;
}

.info-card {
  background-color: #111128;
  border: 1px solid #2a2a5a;
  border-radius: 8px;
  padding: 1.5rem;
}

.info-card h3 {
  color: #e0e0e0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.info-card ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.info-card li {
  color: #9999bb;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
}

.info-card li::before {
  content: '✓';
  color: #4caf50;
  position: absolute;
  left: 0;
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