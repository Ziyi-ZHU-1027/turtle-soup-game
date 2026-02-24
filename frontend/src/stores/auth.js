import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!user.value || isGuest.value)
  const userName = computed(() => user.value?.user_metadata?.name || user.value?.email?.split('@')[0] || '侦探')
  const userEmail = computed(() => user.value?.email || '')
  const isAdmin = computed(() => {
    if (!user.value?.email) return false
    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || []
    return adminEmails.includes(user.value.email)
  })

  // 初始化：检查本地存储的会话
  const initialize = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user || null
    } catch (err) {
      console.error('初始化认证失败:', err)
      user.value = null
    }
  }

  // 登录
  const login = async (email, password) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      user.value = data.user
      return { success: true, user: data.user }
    } catch (err) {
      error.value = err.message
      console.error('登录失败:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (email, password, name) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          }
        }
      })

      if (authError) throw authError

      // 注册后自动登录？
      if (data.user) {
        user.value = data.user
      }

      return { success: true, user: data.user, needsConfirmation: !data.session }
    } catch (err) {
      error.value = err.message
      console.error('注册失败:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 游客模式
  const isGuest = ref(false)

  const loginAsGuest = () => {
    isGuest.value = true
  }

  // 登出
  const logout = async () => {
    loading.value = true
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      user.value = null
      isGuest.value = false
    } catch (err) {
      error.value = err.message
      console.error('登出失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 监听认证状态变化
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('认证状态变化:', event)
    user.value = session?.user || null
  })

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isGuest,
    userName,
    userEmail,
    initialize,
    login,
    loginAsGuest,
    register,
    logout
  }
})