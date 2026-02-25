# API 密钥恢复指南

## ⚠️ 安全事件处理

您的 `.env` 文件包含了真实的 API 密钥，这些密钥已被 GitGuardian 检测到。我已经采取了以下措施：

1. ✅ 备份了原始 `.env` 文件到 `.env.backup`
2. ✅ 将 `.env` 文件中的密钥替换为占位符
3. ✅ 确认 `.env` 文件从未被提交到 Git 仓库

## 🔑 需要更新的密钥

为了安全起见，建议您立即更新以下 API 密钥：

### 1. Supabase 密钥
- **原密钥**: `[REDACTED]` (公开密钥)
- **原密钥**: `[REDACTED]` (服务角色密钥)
- **操作**:
  1. 登录 [Supabase Dashboard](https://app.supabase.com)
  2. 进入项目设置 → API
  3. 重新生成服务角色密钥
  4. 更新您的部署环境中的环境变量

### 2. DeepSeek API 密钥
- **原密钥**: `[REDACTED]`
- **操作**:
  1. 登录 [DeepSeek 平台](https://platform.deepseek.com/api_keys)
  2. 删除旧密钥
  3. 创建新密钥
  4. 更新您的部署环境

### 3. Anthropic Claude API 密钥
- **原密钥**: `[REDACTED]`
- **操作**:
  1. 登录 [Anthropic Console](https://console.anthropic.com/)
  2. 删除旧密钥
  3. 创建新密钥
  4. 更新您的部署环境

## 📋 恢复步骤

1. **获取新的 API 密钥**
   ```bash
   # 从各平台获取新的密钥后
   # 编辑 .env 文件
   nano backend/.env
   ```

2. **替换占位符**
   ```bash
   # 将以下占位符替换为新的密钥
   your_supabase_project_url
   your_supabase_anon_key
   your_service_role_key
   your_jwt_secret_key_here
   your_deepseek_api_key_here
   your_anthropic_api_key_here
   ```

3. **验证配置**
   ```bash
   cd backend
   npm run dev
   ```

## 🔒 安全最佳实践

1. **永远不要提交 `.env` 文件到 Git**
2. **定期轮换 API 密钥**（每3-6个月）
3. **使用不同的密钥用于开发和生产环境**
4. **监控 API 密钥的使用情况**
5. **为生产环境使用受限的 API 密钥**

## 🚨 紧急联系

如果发现任何未授权的 API 使用，请立即：
- Supabase: support@supabase.com
- DeepSeek: 通过平台支持渠道
- Anthropic: security@anthropic.com

## 📁 备份文件

原始的 `.env` 文件已备份为 `.env.backup`，请在设置好新密钥后删除此备份文件：

```bash
rm backend/.env.backup
```

---

*此文档创建于 2026-02-25，API 密钥泄露事件处理后*