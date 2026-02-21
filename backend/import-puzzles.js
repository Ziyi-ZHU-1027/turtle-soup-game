#!/usr/bin/env node

/**
 * 海龟汤谜题批量导入脚本
 *
 * 使用方法：
 * 1. 配置下面的环境变量或直接修改脚本中的配置
 * 2. 准备谜题数据（修改下面的puzzles数组）
 * 3. 运行：node import-puzzles.js
 *
 * 注意事项：
 * - 需要管理员JWT令牌
 * - 确保后端服务正在运行
 * - 建议先导入少量数据测试
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ==================== 配置区域 ====================
const CONFIG = {
  // API基础URL（开发环境通常是 http://localhost:3001）
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',

  // 管理员JWT令牌（通过Supabase Auth或登录API获取）
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || 'YOUR_ADMIN_JWT_TOKEN_HERE',

  // 请求间隔（毫秒），避免过快请求
  REQUEST_DELAY: 500,

  // 日志级别：'verbose'（详细）或 'simple'（简单）
  LOG_LEVEL: 'verbose',

  // 失败时重试次数
  MAX_RETRIES: 3,

  // 重试延迟（毫秒）
  RETRY_DELAY: 1000,
};

// ==================== 示例谜题数据 ====================
// 修改下面的数组添加您自己的谜题
const SAMPLE_PUZZLES = [
  {
    title: "电梯里的男人",
    description: "一个男人每天上班都要坐电梯到10楼，但下班时只坐到7楼就走楼梯。为什么？",
    solution: "男人是个侏儒，上班时按10楼按钮可以够到，下班时7楼以上的按钮都够不到，只能从7楼走楼梯下去。",
    difficulty: 3,
    tags: ["经典", "职场"]
  },
  {
    title: "房间里的灯",
    description: "一个房间里有三盏灯，房间外有三个开关分别控制这三盏灯。你只能进入房间一次，如何确定哪个开关控制哪盏灯？",
    solution: "先打开第一个开关，等5分钟后关闭。然后打开第二个开关，立即进入房间。摸一下灯泡：热的但没亮的是第一个开关，亮的是第二个开关，凉的是第三个开关。",
    difficulty: 4,
    tags: ["逻辑", "脑筋急转弯"]
  },
  {
    title: "沙漠中的瓶子",
    description: "一个人在沙漠中发现一个瓶子，他打开瓶子后突然变得非常富有。为什么？",
    solution: "瓶子里装的是藏宝图，根据藏宝图他找到了宝藏。",
    difficulty: 2,
    tags: ["冒险", "财富"]
  },
  {
    title: "无声的对话",
    description: "两个聋哑人在餐厅里，服务员过来后，其中一人突然大叫一声。为什么？",
    solution: "他的同伴突发疾病，他无法说话，只能通过大叫引起服务员注意。",
    difficulty: 3,
    tags: ["医疗", "日常"]
  },
  {
    title: "书店的谜题",
    description: "一个人走进书店，买了一套百科全书的第一卷，但拒绝购买其他卷。为什么？",
    solution: "他只需要第一卷的封面来参加化装舞会，扮演'百科全书推销员'。",
    difficulty: 4,
    tags: ["幽默", "职业"]
  }
];

// ==================== 辅助函数 ====================
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `[${timestamp}]`;

  switch(type) {
    case 'success':
      console.log(`\x1b[32m${prefix} ✓ ${message}\x1b[0m`);
      break;
    case 'error':
      console.error(`\x1b[31m${prefix} ✗ ${message}\x1b[0m`);
      break;
    case 'warning':
      console.log(`\x1b[33m${prefix} ⚠ ${message}\x1b[0m`);
      break;
    case 'verbose':
      if (CONFIG.LOG_LEVEL === 'verbose') {
        console.log(`\x1b[90m${prefix} ℹ ${message}\x1b[0m`);
      }
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryRequest(fn, maxRetries = CONFIG.MAX_RETRIES) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        log(`请求失败，第 ${attempt} 次重试... (${error.message})`, 'warning');
        await sleep(CONFIG.RETRY_DELAY * attempt);
      }
    }
  }

  throw lastError;
}

function validatePuzzle(puzzle, index) {
  const errors = [];

  if (!puzzle.title || typeof puzzle.title !== 'string') {
    errors.push('title 字段必须是非空字符串');
  }

  if (!puzzle.description || typeof puzzle.description !== 'string') {
    errors.push('description 字段必须是非空字符串');
  }

  if (!puzzle.solution || typeof puzzle.solution !== 'string') {
    errors.push('solution 字段必须是非空字符串');
  }

  if (puzzle.difficulty !== undefined) {
    const difficulty = parseInt(puzzle.difficulty);
    if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
      errors.push('difficulty 字段必须是1-5的整数');
    }
  }

  if (puzzle.tags !== undefined) {
    if (!Array.isArray(puzzle.tags)) {
      errors.push('tags 字段必须是数组');
    } else if (puzzle.tags.some(tag => typeof tag !== 'string')) {
      errors.push('tags 数组中的所有元素必须是字符串');
    }
  }

  if (errors.length > 0) {
    throw new Error(`谜题 #${index + 1} "${puzzle.title}" 验证失败:\n  - ${errors.join('\n  - ')}`);
  }

  return true;
}

// ==================== 主导入函数 ====================
async function importPuzzles(puzzles) {
  log(`开始导入 ${puzzles.length} 个谜题...`);
  log(`API地址: ${CONFIG.API_BASE_URL}`, 'verbose');

  // 验证所有谜题数据
  log('验证谜题数据格式...', 'verbose');
  try {
    puzzles.forEach((puzzle, index) => validatePuzzle(puzzle, index));
    log('数据验证通过', 'success');
  } catch (error) {
    log(error.message, 'error');
    return { success: false, error: error.message };
  }

  // 检查API连接
  log('检查API连接...', 'verbose');
  try {
    const healthCheck = await axios.get(`${CONFIG.API_BASE_URL}/api/puzzles`, {
      params: { limit: 1 },
      timeout: 5000
    });
    log(`API连接正常，当前已有 ${healthCheck.data?.pagination?.total || 0} 个谜题`, 'verbose');
  } catch (error) {
    log(`API连接失败: ${error.message}`, 'warning');
    log('请确保后端服务正在运行，或检查 API_BASE_URL 配置', 'warning');
  }

  // 开始导入
  let successCount = 0;
  let failCount = 0;
  const results = [];

  for (let i = 0; i < puzzles.length; i++) {
    const puzzle = puzzles[i];
    const puzzleNum = i + 1;

    log(`[${puzzleNum}/${puzzles.length}] 导入: "${puzzle.title}"`, 'verbose');

    try {
      const result = await retryRequest(async () => {
        const response = await axios.post(
          `${CONFIG.API_BASE_URL}/api/puzzles`,
          puzzle,
          {
            headers: {
              'Authorization': `Bearer ${CONFIG.ADMIN_TOKEN}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        return response.data;
      });

      successCount++;
      results.push({
        puzzle: puzzle.title,
        status: 'success',
        data: result.data,
        id: result.data?.id
      });

      log(`[${puzzleNum}/${puzzles.length}] ✓ 成功: "${puzzle.title}"`, 'success');

    } catch (error) {
      failCount++;
      results.push({
        puzzle: puzzle.title,
        status: 'failed',
        error: error.response?.data || error.message
      });

      const errorMsg = error.response?.data?.error || error.message;
      log(`[${puzzleNum}/${puzzles.length}] ✗ 失败: "${puzzle.title}" - ${errorMsg}`, 'error');
    }

    // 请求间隔，避免过快
    if (i < puzzles.length - 1) {
      await sleep(CONFIG.REQUEST_DELAY);
    }
  }

  // 输出统计
  log('\n' + '='.repeat(50));
  log('导入完成！', 'success');
  log(`成功: ${successCount}, 失败: ${failCount}, 总计: ${puzzles.length}`);

  if (failCount > 0) {
    const failedPuzzles = results.filter(r => r.status === 'failed');
    log(`\n失败的谜题:`, 'warning');
    failedPuzzles.forEach((fp, i) => {
      log(`  ${i + 1}. ${fp.puzzle}: ${fp.error}`, 'warning');
    });
  }

  // 验证导入结果
  if (successCount > 0) {
    log('\n验证导入结果...', 'verbose');
    try {
      const verifyResponse = await axios.get(`${CONFIG.API_BASE_URL}/api/puzzles`, {
        params: { limit: 10, page: 1 },
        timeout: 5000
      });

      const totalPuzzles = verifyResponse.data?.pagination?.total || 0;
      const latestPuzzles = verifyResponse.data?.data || [];

      log(`数据库现有谜题总数: ${totalPuzzles}`, 'verbose');
      log('最新添加的谜题:', 'verbose');

      latestPuzzles.slice(0, 3).forEach((p, i) => {
        log(`  ${i + 1}. ${p.title} (难度: ${'⭐'.repeat(p.difficulty)})`, 'verbose');
      });

    } catch (error) {
      log(`验证失败: ${error.message}`, 'warning');
    }
  }

  return {
    success: failCount === 0,
    statistics: { successCount, failCount, total: puzzles.length },
    results
  };
}

// ==================== 从文件加载数据 ====================
function loadPuzzlesFromFile(filePath) {
  try {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`文件不存在: ${absolutePath}`);
    }

    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    const extension = path.extname(filePath).toLowerCase();

    let puzzles;
    if (extension === '.json') {
      puzzles = JSON.parse(fileContent);
    } else if (extension === '.js') {
      // 如果是JS文件，需要动态导入
      delete require.cache[require.resolve(absolutePath)];
      puzzles = require(absolutePath);

      // 如果导出的是函数，调用它
      if (typeof puzzles === 'function') {
        puzzles = puzzles();
      }
    } else {
      throw new Error(`不支持的文件格式: ${extension}，支持 .json 或 .js 文件`);
    }

    if (!Array.isArray(puzzles)) {
      throw new Error('文件内容必须是一个谜题数组');
    }

    log(`从文件加载了 ${puzzles.length} 个谜题: ${filePath}`, 'success');
    return puzzles;

  } catch (error) {
    log(`加载文件失败: ${error.message}`, 'error');
    throw error;
  }
}

// ==================== 命令行参数解析 ====================
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const options = {
    file: null,
    token: null,
    url: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--token' || arg === '-t') {
      options.token = args[++i];
    } else if (arg === '--url' || arg === '-u') {
      options.url = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--')) {
      log(`未知选项: ${arg}`, 'warning');
    } else if (!options.file && !arg.startsWith('-')) {
      // 第一个非选项参数作为文件
      options.file = arg;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
海龟汤谜题批量导入工具

使用方法:
  node import-puzzles.js [选项] [数据文件]

选项:
  -f, --file <文件>     包含谜题数据的JSON或JS文件
  -t, --token <令牌>    管理员JWT令牌（覆盖配置）
  -u, --url <URL>       API基础URL（覆盖配置）
  -h, --help           显示此帮助信息

示例:
  1. 使用示例数据导入:
     node import-puzzles.js

  2. 从JSON文件导入:
     node import-puzzles.js --file puzzles.json

  3. 指定令牌和URL:
     node import-puzzles.js --token eyJhbG... --url http://localhost:3001

  4. 使用环境变量:
     export ADMIN_TOKEN="your-token"
     export API_BASE_URL="http://localhost:3001"
     node import-puzzles.js

数据文件格式:
  支持JSON或JS文件，内容应为谜题数组，例如:
  [
    {
      "title": "谜题标题",
      "description": "汤面描述",
      "solution": "汤底答案",
      "difficulty": 3,
      "tags": ["标签1", "标签2"]
    }
  ]

配置文件:
  可以直接修改脚本中的 CONFIG 对象和 SAMPLE_PUZZLES 数组
  `);
}

// ==================== 主程序 ====================
async function main() {
  const options = parseCommandLineArgs();

  if (options.help) {
    printHelp();
    return;
  }

  // 覆盖配置
  if (options.token) {
    CONFIG.ADMIN_TOKEN = options.token;
    log('使用命令行指定的令牌', 'verbose');
  }

  if (options.url) {
    CONFIG.API_BASE_URL = options.url;
    log(`使用命令行指定的API URL: ${options.url}`, 'verbose');
  }

  // 检查令牌
  if (!CONFIG.ADMIN_TOKEN || CONFIG.ADMIN_TOKEN === 'YOUR_ADMIN_JWT_TOKEN_HERE') {
    log('错误：未设置管理员令牌', 'error');
    log('请通过以下方式设置令牌:', 'error');
    log('  1. 修改脚本中的 ADMIN_TOKEN 配置', 'error');
    log('  2. 使用 --token 参数指定', 'error');
    log('  3. 设置环境变量 ADMIN_TOKEN', 'error');
    log('\n如何获取令牌:', 'error');
    log('  - 通过 Supabase Auth 登录获取', 'error');
    log('  - 或使用后端登录API获取', 'error');
    process.exit(1);
  }

  // 加载谜题数据
  let puzzlesToImport;

  if (options.file) {
    try {
      puzzlesToImport = loadPuzzlesFromFile(options.file);
    } catch (error) {
      process.exit(1);
    }
  } else {
    puzzlesToImport = SAMPLE_PUZZLES;
    log(`使用内置示例数据 (${SAMPLE_PUZZLES.length} 个谜题)`, 'verbose');
    log('如需导入自定义数据，请使用 --file 参数指定数据文件', 'verbose');
  }

  // 执行导入
  try {
    const result = await importPuzzles(puzzlesToImport);

    if (!result.success) {
      log('导入过程中有失败的项目，请检查以上错误信息', 'warning');
    }

    // 保存结果到文件
    const resultFile = `import-result-${Date.now()}.json`;
    fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
    log(`详细结果已保存到: ${resultFile}`, 'success');

    process.exit(result.success ? 0 : 1);

  } catch (error) {
    log(`导入过程中发生未预期的错误: ${error.message}`, 'error');
    log(error.stack, 'verbose');
    process.exit(1);
  }
}

// ==================== 执行入口 ====================
if (require.main === module) {
  main().catch(error => {
    log(`程序执行失败: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  importPuzzles,
  loadPuzzlesFromFile,
  validatePuzzle,
  CONFIG,
  SAMPLE_PUZZLES
};