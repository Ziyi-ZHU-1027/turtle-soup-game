#!/usr/bin/env node

/**
 * 数据库迁移脚本
 * 使用Supabase服务角色密钥通过REST API执行SQL
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少Supabase环境变量配置');
  console.error('请确保在.env文件中设置了SUPABASE_URL和SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 从URL中提取项目ref
const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!refMatch) {
  console.error('错误: 无法从Supabase URL中提取项目ref');
  process.exit(1);
}
const projectRef = refMatch[1];

// 创建Supabase客户端（使用服务角色密钥）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('开始数据库迁移...');
    console.log(`项目: ${projectRef}`);

    // 读取迁移文件
    const migrationPath = path.join(__dirname, '..', '..', 'supabase', 'migrations', '001_initial_schema.sql');
    if (!fs.existsSync(migrationPath)) {
      console.error(`错误: 迁移文件不存在: ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(`读取迁移文件: ${migrationPath}`);
    console.log(`SQL大小: ${sql.length} 字符`);

    // 使用Supabase的REST API执行SQL
    // 注意: Supabase JS客户端不直接提供执行原始SQL的方法
    // 我们将使用fetch调用Supabase的SQL API
    const sqlApiUrl = `${supabaseUrl}/rest/v1/`;

    console.log('正在执行SQL...');

    // 由于Supabase REST API不支持任意SQL执行，
    // 我们可以尝试使用Supabase的数据库函数，但更简单的方法是：
    // 1. 分割SQL语句
    // 2. 使用Supabase客户端执行简单查询（对于复杂DDL可能有限制）

    // 这里我们提供一个替代方案：输出SQL供用户手动执行
    console.log('\n--- 迁移SQL ---');
    console.log(sql);
    console.log('--- 结束 ---\n');

    console.log('注意: 由于Supabase API限制，无法通过脚本直接执行DDL语句。');
    console.log('请通过以下方式之一执行上述SQL:');
    console.log('1. Supabase Dashboard: 登录Supabase，进入SQL编辑器，粘贴并执行');
    console.log('2. 使用psql命令行: psql "postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres" -f migration.sql');
    console.log('3. 使用Supabase CLI: supabase db reset (如果已安装)');

    // 尝试检查当前数据库状态
    console.log('\n检查现有表...');
    try {
      const { data: tables, error } = await supabase
        .from('puzzles')
        .select('*')
        .limit(1);

      if (error && error.code === '42P01') {
        console.log('表 "puzzles" 不存在，需要运行迁移。');
      } else if (error) {
        console.log('检查表时出错:', error.message);
      } else {
        console.log('表 "puzzles" 已存在，可能已经迁移过了。');
      }
    } catch (checkError) {
      console.log('无法检查表状态:', checkError.message);
    }

  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

runMigration();