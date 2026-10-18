# 0.7.1 Desktop 启动修复复核

## 问题与修复

共享客户端访问 `ctx.accessManagement`，但该字段不是 Desktop 已声明的 Cordis 服务，导致激活报错 `cannot get property "accessManagement" without inject`。独立版入口现在通过 `apply` 的第二个参数传入授权管理组件，Desktop 默认不启用该组件。

新增回归覆盖 Desktop 严格服务访问检查和独立版授权设置渲染；包检查也使用拒绝访问未知服务的上下文，防止普通对象测试遗漏同类启动错误。业务数据和同步逻辑未修改。

## 本次独立复核

- `pnpm test`：231 项通过，0 失败。
- `pnpm build`、`pnpm check`、`git diff --check`：通过。
- 已安装的 `src/client.js`、`lib/client.js`、`standalone/client-entry.jsx`、`scripts/check-workbench-package.mjs` 与修复包及本次重新构建结果逐字节一致。
- 包版本仍为 0.7.1；修复包 `.install/desktop-activation-fix-0.7.1/dsh-workbench-personal-social-local-0.7.1.tgz`，SHA-256：`3bd5dab8f864333291e7bb82365b79db9222840d4f4dd05901e8c8f72d04d100`。
- 补充 CHANGELOG；该文档补充晚于本机安装包，不据此声称包内文档已同步更新。
- 用户授权检查后提交、合并和推送；旧版 `2026-10-12-desktop-0.6.1.md` 的无关未提交修改排除在外。

## 安装与验收边界

此前修复会话记录：安装成功、通过浏览器访问同一 Desktop 服务后看板正常加载、三个平台账号显示正常、重复卡片恢复为一张、原有账号数据哈希未变。该会话已保留备份，原始证据位于本机 `diagnostics/v071-activation-fix-2026-10-18T05-16-38Z/`（项目上级目录下）。这些属于此前证据，本次只独立复核代码、测试、构建及安装文件，不重复操作真实账号或宿主私有状态。

这份记录更新此前“安装目录不存在”的状态：修复包当前已安装。Desktop 原生窗口、左侧切换器和窄容器布局仍待确认；同一服务的浏览器界面证据不能代替原生窗口验收。
