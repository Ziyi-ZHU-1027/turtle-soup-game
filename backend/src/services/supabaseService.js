const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('缺少Supabase环境变量配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 辅助函数：验证JWT
const verifyToken = async (token) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error) throw error
    return user
  } catch (error) {
    console.error('Token验证失败:', error.message)
    return null
  }
}

// 谜题相关操作
const puzzleService = {
  // 获取谜题列表
  getPuzzles: async (options = {}) => {
    const { page = 1, limit = 20, difficulty, tag } = options

    let query = supabase
      .from('puzzles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // 过滤条件
    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }
    if (tag) {
      query = query.contains('tags', [tag])
    }

    // 分页
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) throw error

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    }
  },

  // 获取单个谜题
  getPuzzleById: async (id) => {
    const { data, error } = await supabase
      .from('puzzles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // 创建谜题
  createPuzzle: async (puzzleData, userId) => {
    const puzzle = {
      ...puzzleData,
      created_by: userId
    }

    const { data, error } = await supabase
      .from('puzzles')
      .insert(puzzle)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新谜题
  updatePuzzle: async (id, updates, userId) => {
    const { data, error } = await supabase
      .from('puzzles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除谜题
  deletePuzzle: async (id) => {
    const { error } = await supabase
      .from('puzzles')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }
}

// 游戏会话相关操作
const gameSessionService = {
  // 创建新游戏会话
  createSession: async (puzzleId, userId = null) => {
    const session = {
      puzzle_id: puzzleId,
      user_id: userId,
      status: 'active',
      start_time: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('game_sessions')
      .insert(session)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 获取会话
  getSession: async (sessionId, userId = null) => {
    let query = supabase
      .from('game_sessions')
      .select(`
        *,
        puzzle:puzzles (*)
      `)
      .eq('id', sessionId)

    // 如果不是管理员，检查用户权限
    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`)
    }

    const { data, error } = await query.single()

    if (error) throw error
    return data
  },

  // 更新会话
  updateSession: async (sessionId, updates) => {
    const { data, error } = await supabase
      .from('game_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 结束会话
  endSession: async (sessionId, status = 'completed') => {
    return await gameSessionService.updateSession(sessionId, {
      status,
      end_time: new Date().toISOString()
    })
  }
}

// 对话相关操作
const conversationService = {
  // 添加消息
  addMessage: async (sessionId, role, content, metadata = {}) => {
    const message = {
      session_id: sessionId,
      role,
      content,
      metadata
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert(message)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 获取会话消息
  getMessages: async (sessionId, limit = 50) => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data
  },

  // 分析对话模式（用于提示）
  analyzeConversation: async (sessionId) => {
    const messages = await conversationService.getMessages(sessionId, 20)

    // 分析连续"不是"的数量
    const assistantMessages = messages.filter(m => m.role === 'assistant')
    let consecutiveNoCount = 0
    let lastMessageWasNo = false

    for (let i = assistantMessages.length - 1; i >= 0; i--) {
      const content = assistantMessages[i].content
      if (content.includes('不是') || content.includes('不对')) {
        if (lastMessageWasNo || consecutiveNoCount === 0) {
          consecutiveNoCount++
          lastMessageWasNo = true
        }
      } else {
        break
      }
    }

    // 分析问题类型（简单分类）
    const userQuestions = messages.filter(m => m.role === 'user')
    const questionKeywords = {
      人物: ['人', '谁', '男人', '女人', '身份', '职业'],
      时间: ['时间', '时候', '何时', '天', '夜', '日'],
      地点: ['地方', '地点', '哪里', '何处', '房间', '屋'],
      物品: ['东西', '物品', '刀', '电话', '钥匙', '钱'],
      原因: ['为什么', '原因', '为何', '动机', '目的']
    }

    const questionTypes = {}
    userQuestions.forEach(q => {
      const content = q.content.toLowerCase()
      for (const [type, keywords] of Object.entries(questionKeywords)) {
        if (keywords.some(keyword => content.includes(keyword))) {
          questionTypes[type] = (questionTypes[type] || 0) + 1
        }
      }
    })

    return {
      consecutiveNoCount,
      totalQuestions: userQuestions.length,
      questionTypes,
      lastQuestionTime: messages.length > 0 ?
        new Date(messages[messages.length - 1].created_at) : null
    }
  }
}

// 生成短分享ID
const generateShareId = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

// 分享相关操作
const shareService = {
  // 创建分享链接（幂等）
  createShare: async (sessionId) => {
    // 检查是否已存在
    const { data: existing } = await supabase
      .from('shared_sessions')
      .select('share_id')
      .eq('session_id', sessionId)
      .single()

    if (existing) return existing

    const shareId = generateShareId()
    const { data, error } = await supabase
      .from('shared_sessions')
      .insert({ share_id: shareId, session_id: sessionId })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 根据 shareId 获取分享数据
  getSharedSession: async (shareId) => {
    const { data: share, error: shareErr } = await supabase
      .from('shared_sessions')
      .select('session_id')
      .eq('share_id', shareId)
      .single()

    if (shareErr || !share) throw new Error('分享链接不存在或已失效')

    const { data: session, error: sessErr } = await supabase
      .from('game_sessions')
      .select('*, puzzle:puzzles (id, title, description, solution, difficulty, tags)')
      .eq('id', share.session_id)
      .single()

    if (sessErr) throw sessErr

    const { data: messages, error: msgErr } = await supabase
      .from('conversations')
      .select('role, content, created_at, metadata')
      .eq('session_id', share.session_id)
      .order('created_at', { ascending: true })

    if (msgErr) throw msgErr

    return { session, messages }
  }
}

// 用户进度相关操作
const progressService = {
  // 获取用户聚合统计
  getUserStats: async (userId) => {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('status, puzzle_id, reveal_requested')
      .eq('user_id', userId)

    if (error) throw error

    const total = data.length
    const completed = data.filter(s => s.status === 'completed' && !s.reveal_requested).length
    const abandoned = data.filter(s => s.status === 'abandoned').length
    const active = data.filter(s => s.status === 'active').length
    const uniquePuzzles = new Set(data.map(s => s.puzzle_id)).size

    // 计算真正通过推理解决的谜题数（不包括查看汤底的）
    const uniquePuzzlesTried = new Set(data.map(s => s.puzzle_id)).size
    const puzzlesSolved = new Set(
      data
        .filter(s => s.status === 'completed' && !s.reveal_requested)
        .map(s => s.puzzle_id)
    ).size
    const solveRate = uniquePuzzlesTried > 0 ? Math.round((puzzlesSolved / uniquePuzzlesTried) * 100) : 0

    return { total, completed, abandoned, active, uniquePuzzles: uniquePuzzlesTried, solveRate }
  },

  // 获取每个谜题的最佳状态
  getUserPuzzleStatuses: async (userId) => {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('puzzle_id, status, id')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })

    if (error) throw error

    const priority = { completed: 3, active: 2, abandoned: 1 }
    const best = {}

    for (const s of data) {
      const current = best[s.puzzle_id]
      if (!current || priority[s.status] > priority[current.status]) {
        best[s.puzzle_id] = { status: s.status, session_id: s.id }
      }
    }

    return Object.entries(best).map(([puzzleId, info]) => ({
      puzzle_id: puzzleId,
      status: info.status,
      session_id: info.session_id
    }))
  },

  // 获取分页历史列表
  getUserHistory: async (userId, page = 1, limit = 10, grouped = false) => {
    const from = (page - 1) * limit
    const to = from + limit - 1

    if (grouped) {
      // 按谜题分组的历史记录
      // 1. 获取所有会话及其谜题信息
      const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('id, status, start_time, end_time, consecutive_no_count, hints_used, reveal_requested, puzzle_id, puzzle:puzzles (id, title, difficulty, tags)')
        .eq('user_id', userId)
        .order('start_time', { ascending: false })

      if (sessionsError) throw sessionsError

      // 2. 按谜题分组
      const groupedByPuzzle = {}

      for (const session of sessions) {
        const puzzleId = session.puzzle_id

        if (!groupedByPuzzle[puzzleId]) {
          groupedByPuzzle[puzzleId] = {
            puzzle: session.puzzle,
            sessions: [],
            latestSession: session,
            totalSessions: 0,
            solvedCount: 0,
            activeCount: 0
          }
        }

        groupedByPuzzle[puzzleId].sessions.push(session)
        groupedByPuzzle[puzzleId].totalSessions++

        if (session.status === 'completed' && !session.reveal_requested) {
          groupedByPuzzle[puzzleId].solvedCount++
        }
        if (session.status === 'active') {
          groupedByPuzzle[puzzleId].activeCount++
        }
      }

      // 3. 获取每个会话的最新消息（用于预览）
      for (const puzzleGroup of Object.values(groupedByPuzzle)) {
        for (const session of puzzleGroup.sessions) {
          const { data: messages } = await supabase
            .from('conversations')
            .select('role, content, created_at')
            .eq('session_id', session.id)
            .order('created_at', { ascending: true })
            .limit(10)

          session.messages = messages || []
        }
      }

      // 4. 转换为数组格式并按最新会话时间排序
      const groupedArray = Object.entries(groupedByPuzzle).map(([puzzleId, group]) => ({
        puzzleId,
        ...group
      })).sort((a, b) => new Date(b.latestSession.start_time) - new Date(a.latestSession.start_time))

      // 5. 分页处理
      const total = groupedArray.length
      const paginatedData = groupedArray.slice(from, to + 1)

      return {
        data: paginatedData,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        grouped: true
      }
    } else {
      // 原有的非分组逻辑
      const { data, error, count } = await supabase
        .from('game_sessions')
        .select('id, status, start_time, end_time, puzzle:puzzles (id, title, difficulty, tags)', { count: 'exact' })
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .range(from, to)

      if (error) throw error

      return {
        data,
        pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
        grouped: false
      }
    }
  }
}

// 用户相关操作
const userService = {
  // 获取用户信息
  getUserById: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  },

  // 检查是否为管理员
  isAdmin: async (email) => {
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    return adminEmails.includes(email)
  }
}

module.exports = {
  supabase,
  verifyToken,
  puzzleService,
  gameSessionService,
  conversationService,
  userService,
  shareService,
  progressService
}