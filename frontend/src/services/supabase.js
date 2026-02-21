import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('缺少Supabase环境变量配置')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'turtle-soup'
    }
  }
})

// 辅助函数：获取带认证的Headers
export const getAuthHeaders = async () => {
  // 先尝试刷新 session，确保 access_token 没有过期
  const { data: { session }, error } = await supabase.auth.refreshSession()

  const headers = {
    'Content-Type': 'application/json'
  }

  if (error) {
    // 刷新失败时回退到 getSession
    const { data: { session: cachedSession } } = await supabase.auth.getSession()
    if (cachedSession?.access_token) {
      headers['Authorization'] = `Bearer ${cachedSession.access_token}`
    }
    return headers
  }

  // 只在有token时添加Authorization头
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  return headers
}

// 辅助函数：检查错误
export const handleSupabaseError = (error) => {
  console.error('Supabase错误:', error)
  throw new Error(error.message || '数据库操作失败')
}

// 导出常用方法
export const from = supabase.from
export const auth = supabase.auth