import axios from 'axios'
import { getAuthHeaders } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
console.log('API_BASE_URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器：添加认证token
api.interceptors.request.use(
  async (config) => {
    console.log(`API请求: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config)
    // 尝试获取认证headers
    try {
      const authHeaders = await getAuthHeaders()
      config.headers = {
        ...config.headers,
        ...authHeaders
      }
      console.log('请求头:', config.headers)
    } catch (error) {
      console.warn('无法获取认证token:', error)
    }
    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (response) => {
    console.log(`API响应成功: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`)
    return response.data
  },
  (error) => {
    console.error('API请求失败:', error)

    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response

      switch (status) {
        case 401:
          console.error('认证失败，请重新登录')
          // 可以在这里触发登出
          break
        case 403:
          console.error('权限不足')
          break
        case 404:
          console.error('资源不存在')
          break
        case 429:
          console.error('请求过于频繁，请稍后再试')
          break
        case 500:
          console.error('服务器内部错误')
          break
        default:
          console.error(`服务器错误: ${status}`)
      }

      return Promise.reject(data?.error || data?.message || `请求失败: ${status}`)
    } else if (error.request) {
      // 请求已发送但无响应
      console.error('网络连接失败，请检查网络')
      return Promise.reject('网络连接失败')
    } else {
      // 请求配置错误
      console.error('请求配置错误:', error.message)
      return Promise.reject(error.message)
    }
  }
)

// API方法定义
export const apiClient = {
  // 健康检查
  health: () => api.get('/health'),

  // 谜题相关
  puzzles: {
    list: (params) => api.get('/puzzles', { params }),
    get: (id) => api.get(`/puzzles/${id}`),
    create: (data) => api.post('/puzzles', data),
    update: (id, data) => api.put(`/puzzles/${id}`, data),
    delete: (id) => api.delete(`/puzzles/${id}`)
  },

  // 游戏相关
  game: {
    start: (puzzleId) => api.post('/game/start', { puzzleId }),
    getSession: (sessionId) => api.get(`/game/session/${sessionId}`),
    sendMessage: (sessionId, message) => api.post(`/game/${sessionId}/chat`, { message }),
    sendMessageStream: async (sessionId, message, onChunk, onComplete, onError) => {
      try {
        // 获取认证headers
        let authHeaders = {}
        try {
          authHeaders = await getAuthHeaders()
        } catch (error) {
          console.warn('无法获取认证token:', error)
        }

        const response = await fetch(`${API_BASE_URL}/game/${sessionId}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders
          },
          body: JSON.stringify({ message })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let currentEvent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // 保存不完整的行

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim()
            if (line.startsWith('event: ')) {
              currentEvent = line.substring(7).trim()
            } else if (line.startsWith('data: ')) {
              const dataStr = line.substring(6).trim()
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr)
                  // 处理不同事件类型
                  if (currentEvent === 'chunk' && onChunk) {
                    onChunk(data.chunk)
                  } else if (currentEvent === 'complete' && onComplete) {
                    onComplete(data.response, data.type)
                  } else if (currentEvent === 'error' && onError) {
                    onError(data.error)
                  } else if (currentEvent === 'hint' && onChunk) {
                    // 提示事件可以视为特殊消息
                    onChunk(`💡 提示: ${data.type === 'close_to_solution' ? '你已接近答案！' : '需要帮助吗？'}`)
                  }
                } catch (e) {
                  console.error('解析SSE数据失败:', e, dataStr)
                }
              }
            } else if (line === '') {
              // 空行表示事件结束
              currentEvent = ''
            }
          }
        }
      } catch (error) {
        if (onError) {
          onError(error.message)
        }
        throw error
      }
    },
    getMessages: (sessionId) => api.get(`/game/${sessionId}/messages`),
    reveal: (sessionId) => api.post(`/game/${sessionId}/reveal`),
    surrender: (sessionId) => api.post(`/game/${sessionId}/surrender`)
  },

  // AI相关
  ai: {
    analyze: (sessionId) => api.post(`/ai/analyze`, { sessionId })
  },

  // 管理相关
  admin: {
    stats: () => api.get('/admin/stats'),
    conversations: (params) => api.get('/admin/conversations', { params })
  }
}

export default apiClient