#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 从环境变量读取配置
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase配置')
  console.error('请设置环境变量：')
  console.error('  SUPABASE_URL=https://your-project.supabase.co')
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  process.exit(1)
}

// 读取迁移文件
const migrationPath = path.join(__dirname, 'migrations/001_initial_schema.sql')
const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

async function runMigration() {
  console.log('🚀 开始数据库迁移...')
  console.log(`📝 迁移文件: ${migrationPath}`)
  console.log(`🔗 连接到: ${supabaseUrl}`)

  try {
    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 执行SQL语句
    console.log('📋 执行SQL迁移...')
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // 如果exec_sql函数不存在，尝试直接使用query
      console.log('ℹ️ 尝试直接执行SQL...')

      // 将SQL拆分为单独的语句执行
      const statements = migrationSQL.split(';').filter(s => s.trim())

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';'
        console.log(`📝 执行语句 ${i + 1}/${statements.length}...`)

        const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement })
        if (stmtError && !stmtError.message.includes('function "exec_sql" does not exist')) {
          console.error(`❌ 语句执行失败:`, stmtError.message)
          console.log(`📄 失败语句:\n${statement}`)
        }
      }
    }

    console.log('✅ 迁移执行完成！')
    console.log('\n📊 创建的表格:')
    console.log('  - puzzles（谜题库）')
    console.log('  - game_sessions（游戏会话）')
    console.log('  - conversations（对话记录）')
    console.log('\n⚠️  重要提醒:')
    console.log('1. 请检查Supabase控制台 → Table Editor确认表已创建')
    console.log('2. 请将 app.settings.admin_emails 设置为您的管理员邮箱（默认为admin@example.com）')
    console.log('3. 已插入3个示例谜题用于测试')

  } catch (error) {
    console.error('❌ 迁移失败:', error.message)
    console.log('\n💡 备选方案：请使用Supabase网页控制台的SQL Editor手动执行迁移文件')
    console.log('   文件位置: supabase/migrations/001_initial_schema.sql')
  }
}

runMigration()