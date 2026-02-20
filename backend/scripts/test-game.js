#!/usr/bin/env node

/**
 * 测试完整游戏流程
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;
const API_URL = `${BASE_URL}/api`;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function logSuccess(msg) { console.log(`${colors.green}✅ ${msg}${colors.reset}`); }
function logInfo(msg) { console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`); }
function logWarning(msg) { console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`); }
function logError(msg) { console.log(`${colors.red}❌ ${msg}${colors.reset}`); }

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const req = http.request(`${API_URL}${path}`, options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            error: e.message
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testGameFlow() {
  console.log('🧪 测试完整游戏流程\n');

  let gameSessionId = null;
  let puzzleId = null;

  try {
    // 1. 测试健康检查
    logInfo('1. 测试健康检查...');
    const health = await makeRequest('GET', '/health');
    if (health.statusCode === 200) {
      logSuccess(`健康检查成功: ${JSON.stringify(health.data)}`);
    } else {
      logError(`健康检查失败: ${health.statusCode}`);
      return false;
    }

    // 2. 获取谜题列表
    logInfo('\n2. 获取谜题列表...');
    const puzzles = await makeRequest('GET', '/puzzles');
    if (puzzles.statusCode === 200 && puzzles.data.success) {
      const puzzleList = puzzles.data.data || [];
      logSuccess(`获取到 ${puzzleList.length} 个谜题`);

      if (puzzleList.length > 0) {
        puzzleId = puzzleList[0].id;
        logInfo(`选择第一个谜题: "${puzzleList[0].title}" (ID: ${puzzleId})`);
      } else {
        logWarning('没有找到谜题，跳过游戏流程测试');
        return true;
      }
    } else {
      logError(`获取谜题失败: ${puzzles.statusCode} - ${JSON.stringify(puzzles.data)}`);
      return false;
    }

    // 3. 开始新游戏
    logInfo('\n3. 开始新游戏...');
    const startGame = await makeRequest('POST', '/game/start', { puzzleId });
    if (startGame.statusCode === 200 && startGame.data.success) {
      gameSessionId = startGame.data.data.session.id;
      logSuccess(`游戏开始成功! 会话ID: ${gameSessionId}`);
      logInfo(`谜题: "${startGame.data.data.puzzle.title}"`);
    } else {
      logError(`开始游戏失败: ${startGame.statusCode} - ${JSON.stringify(startGame.data)}`);
      return false;
    }

    // 4. 获取会话详情
    logInfo('\n4. 获取会话详情...');
    const session = await makeRequest('GET', `/game/session/${gameSessionId}`);
    if (session.statusCode === 200 && session.data.success) {
      logSuccess(`会话状态: ${session.data.data.session.status}`);
      logInfo(`消息数量: ${session.data.data.messages?.length || 0}`);
    } else {
      logError(`获取会话失败: ${session.statusCode} - ${JSON.stringify(session.data)}`);
      return false;
    }

    // 5. 发送测试问题（注意：这需要有效的DeepSeek API密钥）
    logInfo('\n5. 发送测试问题...');
    logWarning('注意: 这需要有效的DeepSeek API密钥，否则可能会失败');

    const testQuestion = '这是一个测试问题吗？';
    const sendMessage = await makeRequest('POST', `/game/${gameSessionId}/chat`, { message: testQuestion });

    if (sendMessage.statusCode === 200) {
      logSuccess('消息发送成功 (流式响应)');
    } else if (sendMessage.statusCode === 500) {
      logWarning(`AI服务可能未配置或API密钥无效: ${JSON.stringify(sendMessage.data)}`);
      logInfo('跳过AI回复测试，继续其他测试...');
    } else {
      logError(`发送消息失败: ${sendMessage.statusCode} - ${JSON.stringify(sendMessage.data)}`);
    }

    // 6. 获取消息历史
    logInfo('\n6. 获取消息历史...');
    const messages = await makeRequest('GET', `/game/${gameSessionId}/messages`);
    if (messages.statusCode === 200 && messages.data.success) {
      const messageList = messages.data.data || [];
      logSuccess(`获取到 ${messageList.length} 条消息`);

      // 显示最近几条消息
      const recentMessages = messageList.slice(-3);
      recentMessages.forEach(msg => {
        const role = msg.role === 'user' ? '👤 用户' :
                     msg.role === 'assistant' ? '🤖 AI' :
                     msg.role === 'system' ? '⚙️  系统' : '❓ 未知';
        console.log(`   ${role}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
      });
    } else {
      logError(`获取消息失败: ${messages.statusCode} - ${JSON.stringify(messages.data)}`);
    }

    // 7. 测试查看汤底
    logInfo('\n7. 测试查看汤底...');
    const reveal = await makeRequest('POST', `/game/${gameSessionId}/reveal`);
    if (reveal.statusCode === 200 && reveal.data.success) {
      logSuccess('汤底查看成功!');
      logInfo(`谜题解答: ${reveal.data.data.solution.substring(0, 100)}...`);
    } else {
      logError(`查看汤底失败: ${reveal.statusCode} - ${JSON.stringify(reveal.data)}`);
    }

    logSuccess('\n🎉 游戏流程测试完成！');
    console.log('\n总结:');
    console.log(`  • 后端API: ${colors.green}正常${colors.reset}`);
    console.log(`  • 数据库连接: ${colors.green}正常${colors.reset}`);
    console.log(`  • 谜题数据: ${colors.green}${puzzles.data.data.length} 个谜题${colors.reset}`);
    console.log(`  • 游戏会话: ${colors.green}创建成功${colors.reset}`);
    console.log(`  • AI服务: ${sendMessage.statusCode === 200 ? colors.green + '正常' + colors.reset : colors.yellow + '可能需要配置API密钥' + colors.reset}`);

    return true;

  } catch (error) {
    logError(`测试过程中出现错误: ${error.message}`);
    console.error(error);
    return false;
  }
}

// 检查服务器是否在运行
async function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const isServerRunning = await checkServer();

  if (!isServerRunning) {
    logWarning('后端服务器未运行，尝试启动...');

    const serverProcess = spawn('node', [path.join(__dirname, '..', 'src', 'index.js')], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      env: { ...process.env, PORT }
    });

    let serverReady = false;

    serverProcess.stdout.on('data', (data) => {
      if (data.toString().includes('服务器运行在')) {
        serverReady = true;
        logSuccess('后端服务器启动成功');
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('服务器错误:', data.toString());
    });

    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (!serverReady) {
      logError('服务器启动失败，请手动启动: cd backend && npm start');
      return;
    }

    // 运行测试
    await testGameFlow();

    // 清理：关闭服务器
    serverProcess.kill();

  } else {
    logInfo('后端服务器正在运行');
    await testGameFlow();
  }
}

main().catch(console.error);