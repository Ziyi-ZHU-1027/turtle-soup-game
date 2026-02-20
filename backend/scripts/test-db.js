#!/usr/bin/env node

/**
 * 测试数据库连接和表结构
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDatabase() {
  console.log('测试数据库连接和表结构...\n');

  try {
    // 1. 测试连接
    console.log('1. 测试Supabase连接...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('  连接失败:', authError.message);
    } else {
      console.log('  连接成功');
    }

    // 2. 检查puzzles表
    console.log('\n2. 检查puzzles表...');
    try {
      const { data, error, count } = await supabase
        .from('puzzles')
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          console.log('  puzzles表不存在，需要运行迁移');
        } else {
          console.error('  查询错误:', error.message);
        }
      } else {
        console.log(`  puzzles表存在，共有${count}条记录`);
      }
    } catch (tableError) {
      console.error('  检查puzzles表时异常:', tableError.message);
    }

    // 3. 检查game_sessions表
    console.log('\n3. 检查game_sessions表...');
    try {
      const { data, error, count } = await supabase
        .from('game_sessions')
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          console.log('  game_sessions表不存在');
        } else {
          console.error('  查询错误:', error.message);
        }
      } else {
        console.log(`  game_sessions表存在，共有${count}条记录`);
      }
    } catch (tableError) {
      console.error('  检查game_sessions表时异常:', tableError.message);
    }

    // 4. 检查conversations表
    console.log('\n4. 检查conversations表...');
    try {
      const { data, error, count } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          console.log('  conversations表不存在');
        } else {
          console.error('  查询错误:', error.message);
        }
      } else {
        console.log(`  conversations表存在，共有${count}条记录`);
      }
    } catch (tableError) {
      console.error('  检查conversations表时异常:', tableError.message);
    }

    // 5. 列出所有表（通过查询information_schema）
    console.log('\n5. 列出数据库中的表...');
    try {
      // 使用Raw SQL查询（如果允许）
      const { data, error } = await supabase
        .from('puzzles')
        .select('*')
        .limit(0); // 只获取元数据

      if (!error) {
        // 尝试获取表列表（通过查询系统表）
        console.log('  无法直接查询表列表，但连接正常');
      }
    } catch (metaError) {
      console.log('  无法获取表列表:', metaError.message);
    }

    console.log('\n测试完成！');
    console.log('\n下一步:');
    console.log('如果表不存在，请运行迁移SQL。');
    console.log('迁移文件位置: supabase/migrations/001_initial_schema.sql');
    console.log('可以通过Supabase Dashboard的SQL编辑器执行。');

  } catch (error) {
    console.error('测试过程中出现错误:', error);
    process.exit(1);
  }
}

testDatabase();