# Vercel环境变量配置指南

## 问题诊断
您遇到的500错误很可能是由于缺少环境变量造成的。在Vercel上，`.env`文件不会被自动加载，必须在Vercel控制台中手动设置所有环境变量。

## 必需环境变量清单

根据您的`backend/.env`文件，需要在Vercel中设置以下环境变量：

### 1. Supabase配置（必需）
| 变量名 | 当前值 | 获取方法 |
|--------|--------|----------|
| `SUPABASE_URL` | `https://wtvuohafjgdkffxnriyq.supabase.co` | Supabase项目设置 → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_3i4icKleYlEptizaOODyaw_s1DRS2GU` | Supabase项目设置 → API → service_role密钥 |
| `JWT_SECRET` | `0534579ccb5ec32a3dd3f854a2747c4ec549157981795e7d21ff864e999dcaa5` | 任意长随机字符串，建议重新生成 |

**注意**：`SUPABASE_ANON_KEY`在前端使用，后端不需要。

### 2. DeepSeek AI配置（必需）
| 变量名 | 当前值 | 获取方法 |
|--------|--------|----------|
| `DEEPSEEK_API_KEY` | `sk-8ea58a87e0e24ac0bf54bdcf9781a4ab` | [DeepSeek平台](https://platform.deepseek.com/) → API密钥 |
| `DEEPSEEK_API_URL` | `https://api.deepseek.com/chat/completions` | 保持默认值 |
| `DEEPSEEK_MODEL` | `deepseek-chat` | 保持默认值 |

### 3. 服务器配置（必需）
| 变量名 | 当前值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | `production` | **必须改为`production`** |
| `FRONTEND_URL` | 您的Vercel应用URL | 例如：`https://your-app.vercel.app` |
| `PORT` | `3001` | Vercel会自动设置，但保留此值 |

### 4. 管理员配置（可选）
| 变量名 | 当前值 | 说明 |
|--------|--------|------|
| `ADMIN_EMAILS` | `ziyi.zhu1027@gmail.com` | 管理员邮箱，逗号分隔 |

### 5. 游戏配置（可选）
| 变量名 | 当前值 | 说明 |
|--------|--------|------|
| `MAX_CONSECUTIVE_NO` | `5` | 连续"不是"次数阈值 |
| `MAX_HISTORY_TURNS` | `20` | 最大历史对话轮数 |
| `HINT_TRIGGER_THRESHOLD` | `10` | 提示触发阈值 |

## 在Vercel中设置环境变量的步骤

### 方法1：通过Vercel控制台
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的海龟汤项目
3. 点击 **Settings** → **Environment Variables**
4. 添加上述所有环境变量
5. 点击 **Save**
6. 重新部署应用

### 方法2：通过Vercel CLI
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 添加环境变量
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DEEPSEEK_API_KEY
vercel env add JWT_SECRET
vercel env add NODE_ENV production
vercel env add FRONTEND_URL https://your-app.vercel.app

# 重新部署
vercel --prod
```

## 重要注意事项

### 1. 安全警告
您的`.env`文件中包含敏感信息（API密钥、JWT密钥）。**请勿将`.env`文件提交到Git仓库**（它已在`.gitignore`中）。

### 2. 生产环境配置
- **必须**将`NODE_ENV`设置为`production`
- **必须**将`FRONTEND_URL`设置为您的实际部署URL
- 建议为生产环境生成新的`JWT_SECRET`

### 3. 验证配置
部署后，访问以下端点验证配置：
- `https://your-app.vercel.app/api/health` - 应该返回`{"status":"ok"}`
- `https://your-app.vercel.app/api` - 应该返回API信息

### 4. 查看日志
如果仍有500错误，查看Vercel日志：
1. Vercel控制台 → 项目 → **Deployments**
2. 点击最新的部署
3. 查看 **Functions** 日志

## 故障排除

### 常见问题1：Supabase连接失败
**症状**：500错误，日志显示"缺少Supabase环境变量配置"
**解决方案**：确保`SUPABASE_URL`和`SUPABASE_SERVICE_ROLE_KEY`正确设置

### 常见问题2：CORS错误
**症状**：前端请求被阻止
**解决方案**：确保`FRONTEND_URL`正确设置为前端部署URL

### 常见问题3：AI服务不可用
**症状**：游戏无法生成AI响应
**解决方案**：检查`DEEPSEEK_API_KEY`是否有效

## 更新代码以更好地处理环境变量

我们已经更新了代码以更好地处理环境变量：

1. **`api/index.js`**：现在会检查.env文件是否存在，只在文件存在时加载
2. **`backend/src/index.js`**：支持从多个路径加载.env文件
3. **`backend/src/services/supabaseService.js`**：提供更清晰的错误信息

## 后续步骤

1. 在Vercel控制台中设置所有环境变量
2. 重新部署应用
3. 测试API端点是否正常工作
4. 如果仍有问题，检查Vercel日志并提供错误信息

## 联系支持

如果问题仍然存在，请提供：
1. Vercel部署日志
2. 访问`/api/health`端点的响应
3. 浏览器控制台错误信息