# 部署指南

## Vercel 环境变量配置

### 必需环境变量清单

在 Vercel 控制台中设置以下环境变量：

#### 1. Supabase 配置（必需）
| 变量名 | 示例值 | 获取方法 |
|--------|--------|----------|
| `SUPABASE_URL` | `https://your-project.supabase.co` | Supabase 项目设置 → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `your_service_role_key_here` | Supabase 项目设置 → API → service_role 密钥 |
| `JWT_SECRET` | `your_jwt_secret_here` | 任意长随机字符串 |

#### 2. DeepSeek AI 配置（必需）
| 变量名 | 示例值 | 获取方法 |
|--------|--------|----------|
| `DEEPSEEK_API_KEY` | `your_deepseek_api_key_here` | [DeepSeek 平台](https://platform.deepseek.com/) → API 密钥 |
| `DEEPSEEK_API_URL` | `https://api.deepseek.com/chat/completions` | 保持默认值 |
| `DEEPSEEK_MODEL` | `deepseek-chat` | 保持默认值 |

#### 3. 服务器配置（必需）
| 变量名 | 值 | 说明 |
|--------|------|------|
| `NODE_ENV` | `production` | 生产环境必须设置为 production |
| `FRONTEND_URL` | `https://your-app.vercel.app` | 您的 Vercel 应用 URL |
| `PORT` | `3001` | Vercel 会自动设置，但保留此值 |

#### 4. 管理员配置（可选）
| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `ADMIN_EMAILS` | `admin@example.com` | 管理员邮箱，逗号分隔 |

#### 5. 游戏配置（可选）
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `MAX_CONSECUTIVE_NO` | `5` | 连续"不是"次数阈值 |
| `MAX_HISTORY_TURNS` | `20` | 最大历史对话轮数 |
| `HINT_TRIGGER_THRESHOLD` | `10` | 提示触发阈值 |

### 在 Vercel 中设置环境变量

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 点击 **Settings** → **Environment Variables**
4. 添加上述所有必需的环境变量
5. 点击 **Save** 保存
6. **重要**：重新部署项目以使环境变量生效

### 本地开发环境配置

1. 复制 `.env.example` 为 `.env`：
   ```bash
   cp backend/.env.example backend/.env
   ```

2. 编辑 `.env` 文件，填入真实的 API 密钥

3. 确保 `.env` 文件在 `.gitignore` 中（默认已配置）

### 安全注意事项

⚠️ **重要**：
- 永远不要在代码、文档或提交中包含真实的 API 密钥
- 使用占位符或环境变量引用
- 定期轮换 API 密钥
- 为不同环境使用不同的密钥

### 故障排除

#### 500 错误
通常是缺少环境变量或密钥错误：
1. 检查 Vercel 控制台中的环境变量设置
2. 确认所有必需变量都已添加
3. 重新部署项目

#### 数据库连接错误
检查 Supabase 配置：
1. 确认 `SUPABASE_URL` 正确
2. 确认 `SUPABASE_SERVICE_ROLE_KEY` 有效
3. 检查 Supabase 项目是否正常运行

#### AI 服务无响应
检查 DeepSeek 配置：
1. 确认 `DEEPSEEK_API_KEY` 有效
2. 检查 API 配额是否用完
3. 确认模型名称正确

---

*如需更多帮助，请参考项目 README 或提交 Issue*