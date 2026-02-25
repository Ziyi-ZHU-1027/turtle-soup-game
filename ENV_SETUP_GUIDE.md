# 海龟汤游戏 - 环境配置指南

本文档将指导您完成海龟汤游戏项目的本地开发环境配置。

## 📋 配置概览

需要配置以下服务：
1. **Supabase** - 数据库和认证服务
2. **DeepSeek AI** - AI对话服务（必需）
3. **Claude API** - AI架构分析服务（可选，推荐）
4. **本地环境变量** - 前后端配置文件

## 🔧 步骤一：配置 Supabase

### 1.1 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 点击 "Start your project" 或 "Sign Up" 注册账号
3. 点击 "New Project" 创建新项目
4. 选择组织，输入项目名称（如：turtle-soup-game）
5. 设置数据库密码（请妥善保存）
6. 选择地区（建议选择 East Asia 或 Singapore）
7. 点击 "Create new project"

### 1.2 获取 Supabase 配置信息

项目创建后：

1. 进入项目仪表盘
2. 点击左侧菜单 **Settings** → **API**
3. 您会看到以下信息：
   - **Project URL**：`https://xxx.supabase.co`
   - **anon public**：`eyJ...`
   - **service_role**：`eyJ...`

### 1.3 初始化数据库表

1. 在项目仪表盘，点击左侧菜单 **SQL Editor**
2. 点击 "New query"
3. 复制并运行以下 SQL 文件内容：
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_add_updated_at_to_game_sessions.sql`
   - `supabase/migrations/003_add_logic_profile.sql`

## 🔧 步骤二：配置 DeepSeek AI

### 2.1 获取 DeepSeek API Key

1. 访问 [DeepSeek Platform](https://platform.deepseek.com/)
2. 注册并登录账号
3. 点击左侧菜单 **API Keys**
4. 点击 "Create new key"
5. 输入密钥名称（如：turtle-soup-game）
6. 复制生成的 API Key（格式：`sk-xxx`）

### 2.2 充值（可选）

新账号通常有免费额度，如需更多：
1. 点击左侧菜单 **Balance**
2. 点击 "Recharge" 进行充值
3. 建议先充值少量金额测试

## 🔧 步骤三：配置 Claude API（可选）

### 3.1 获取 Claude API Key

1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 注册并登录账号
3. 点击左侧菜单 **API Keys**
4. 点击 "Create Key"
5. 输入密钥名称（如：turtle-soup-architect）
6. 复制生成的 API Key

### 3.2 Claude API 的作用

- **功能**：作为 Architect 层，深度分析谜题生成结构化逻辑档案
- **优势**：提升 AI 主持人的一致性和准确性
- **成本**：使用量较少，成本可控
- **必要性**：可选，没有则自动降级到基础模式

## 🔧 步骤四：配置本地环境变量

### 4.1 配置后端环境变量

编辑 `backend/.env` 文件：

```bash
# 服务器配置（保持默认）
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase 配置（替换为您自己的）
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJ...（从 Supabase 复制）
SUPABASE_SERVICE_ROLE_KEY=eyJ...（从 Supabase 复制）
JWT_SECRET=your-secure-jwt-secret-here

# DeepSeek AI 配置（替换为您自己的）
DEEPSEEK_API_KEY=sk-xxx（从 DeepSeek 复制）

# Claude API 配置（可选，替换为您自己的）
ANTHROPIC_API_KEY=sk-ant-xxx（从 Claude 复制）

# 管理员配置（替换为您的邮箱）
ADMIN_EMAILS=your-email@example.com
```

### 4.2 配置前端环境变量

编辑 `frontend/.env` 文件：

```bash
# API 配置（保持默认）
VITE_API_URL=http://localhost:3001/api

# Supabase 配置（与后端保持一致）
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...（与后端相同）

# 管理员配置（与后端保持一致）
VITE_ADMIN_EMAILS=your-email@example.com
```

## 🔧 步骤五：安装依赖并启动

### 5.1 安装后端依赖

```bash
cd backend
npm install
```

### 5.2 安装前端依赖

```bash
cd frontend
npm install
```

### 5.3 启动开发服务器

**启动后端**（新开一个终端）：
```bash
cd backend
npm run dev
```
后端将在 http://localhost:3001 启动

**启动前端**（新开一个终端）：
```bash
cd frontend
npm run dev
```
前端将在 http://localhost:5173 启动

## 🧪 验证配置

### 1. 检查后端健康状态

访问 http://localhost:3001/api/health
应该返回：`{"status":"ok","timestamp":"..."}`

### 2. 检查前端访问

访问 http://localhost:5173
应该能看到海龟汤游戏首页

### 3. 测试管理员功能

1. 使用配置的 `ADMIN_EMAILS` 邮箱注册账号
2. 登录后访问 `/admin`
3. 应该能看到管理后台界面

## ❌ 常见问题排查

### 问题 1：Supabase 连接失败

**症状**：后端启动报错 "Supabase connection failed"

**解决方案**：
1. 检查 `SUPABASE_URL` 是否正确（应该以 `https://` 开头）
2. 检查 `SUPABASE_ANON_KEY` 和 `SUPABASE_SERVICE_ROLE_KEY` 是否正确
3. 确认数据库表已创建（运行 SQL 迁移脚本）

### 问题 2：DeepSeek API 调用失败

**症状**：AI 回复 "服务暂时不可用"

**解决方案**：
1. 检查 `DEEPSEEK_API_KEY` 是否正确（应该以 `sk-` 开头）
2. 确认 API Key 有足够余额
3. 检查网络连接是否正常

### 问题 3：前端无法连接后端

**症状**：浏览器控制台出现 "Network Error"

**解决方案**：
1. 确认后端正在运行在 3001 端口
2. 检查前端 `VITE_API_URL` 配置是否正确
3. 重启前端开发服务器

### 问题 4：管理员权限无效

**症状**：登录后无法访问 `/admin`

**解决方案**：
1. 检查前后端 `ADMIN_EMAILS` 配置是否一致
2. 确认使用管理员邮箱注册
3. 重启后端服务器使配置生效

## 📝 环境变量清单

### 后端必需变量
- `SUPABASE_URL` - Supabase 项目 URL
- `SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase 服务密钥
- `JWT_SECRET` - JWT 签名密钥（任意字符串）
- `DEEPSEEK_API_KEY` - DeepSeek API 密钥

### 后端可选变量
- `ANTHROPIC_API_KEY` - Claude API 密钥
- `ADMIN_EMAILS` - 管理员邮箱（默认：admin@example.com）

### 前端必需变量
- `VITE_API_URL` - 后端 API 地址
- `VITE_SUPABASE_URL` - Supabase 项目 URL（与后端一致）
- `VITE_SUPABASE_ANON_KEY` - Supabase 匿名密钥（与后端一致）
- `VITE_ADMIN_EMAILS` - 管理员邮箱（与后端一致）

## 🔐 安全提醒

1. **永远不要**将包含真实密钥的 `.env` 文件提交到 Git
2. **区分**前端和后端环境变量：
   - 前端变量使用 `VITE_` 前缀，会暴露给浏览器
   - 后端变量不要加 `VITE_` 前缀，仅在服务器使用
3. **定期更换** API 密钥，特别是在生产环境
4. **使用不同的** Supabase 项目区分开发和生产环境

## 🚀 下一步

环境配置完成后，您可以：
1. 查看 [README.md](./README.md) 了解项目功能
2. 阅读 [海龟汤数据添加指南.md](./海龟汤数据添加指南.md) 添加谜题
3. 查看 [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md) 了解产品细节

## 💡 获取帮助

如果遇到问题：
1. 查看本文档的常见问题部分
2. 检查项目的 GitHub Issues
3. 创建新的 Issue 描述具体问题

---

**配置完成后，您就可以开始享受海龟汤游戏了！** 🐢