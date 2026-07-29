# 灵犀 AI 助手 — 产品需求文档

## 产品概述
灵犀是一款面向大众的 AI 助手 Web 应用。它内置多位「专家角色」，支持流式对话、对话历史本地保存、明暗主题切换，开箱即用、无需登录。后端以 OpenAI 兼容接口对接主流大模型，未配置密钥时自动进入「演示模式」，便于体验与二次开发。

## 核心功能
1. **多专家角色**：写作大师、翻译官、程序员、情感树洞、简历优化师、旅行规划师，一键切换，自动注入对应系统提示词。
2. **流式对话**：打字机式实时输出，支持中途停止。
3. **对话历史**：本地保存（localStorage），可新建、切换、删除、重命名对话，刷新不丢失。
4. **消息操作**：复制、重新生成、Markdown 与代码块高亮、代码一键复制。
5. **明暗主题**：内置浅色 / 深色两套配色，跟随系统并记忆偏好。
6. **响应式布局**：桌面端左侧对话列表，移动端抽屉式侧边栏，手机电脑皆可用。

## 用户故事
- 作为普通用户，我希望打开即用、不用注册，就能和不同领域的 AI 专家聊天。
- 作为内容创作者，我希望有「写作大师」帮我起草与润色文案。
- 作为开发者，我希望有「程序员」帮我写代码、看报错。
- 作为求职者，我希望有「简历优化师」帮我打磨简历并模拟面试。
- 作为旅行者，我希望有「旅行规划师」给我排好行程。

## 页面结构
- 单页应用（SPA），唯一路由 `/`：
  - 左侧边栏：品牌、新建对话、对话列表（选中 / 删除）。
  - 顶栏：当前专家、主题切换、新建对话、移动端菜单。
  - 主区域：空状态（欢迎语 + 专家卡片 + 示例问题）/ 消息列表。
  - 底部：输入框（Enter 发送，Shift+Enter 换行，流式时显示停止）。

## 数据模型（前端本地）
```
Conversation { id, title, personaId, messages[], createdAt, updatedAt }
ChatMessage  { id, role('system'|'user'|'assistant'), content, createdAt, streaming?, error? }
Persona     { id, name, emoji, description, systemPrompt, greeting, icon, accent }
```
持久化：localStorage（`lingxi.conversations.v1`、`lingxi.activeId.v1`、`lingxi.theme`）。

## API 端点（后端）
- `POST /api/chat`
  - 请求体：`{ messages: {role, content}[], model?, temperature? }`
  - 响应：分块 NDJSON 流，每行一个 JSON：`{type:'delta', content}` / `{type:'done'}` / `{type:'error', message}`。
  - 行为：有 `AI_API_KEY` 时调用上游 OpenAI 兼容接口并转发流式结果；无密钥时返回演示文本流。

## 配置（环境变量，后端）
- `AI_API_KEY`：大模型密钥（留空进入演示模式）
- `AI_BASE_URL`：接口地址，默认 `https://api.openai.com/v1`（DeepSeek 为 `https://api.deepseek.com/v1`）
- `AI_MODEL`：模型名，默认 `gpt-4o-mini`
