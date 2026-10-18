# 0.7.0 独立版多浏览器访问授权验收

## 范围与工作区

- 从当时最新本地 main `da788d3` 新建分支 `codex/browser-access-pairing`。
- 隔离工作目录：`/Users/zhou/.codex/worktrees/browser-access-pairing/personal-social-workbench`。
- 未提交、未合并、未推送。原工作区、真实数据及已运行的 43120 服务未修改。
- 本轮使用独立测试目录 `/tmp/psw-browser-access-20261017`、端口 43130，无真实账号。
- 官方规范：读取日期 2026-10-17，文档版本 2026-10-09；本轮新增授权只用于独立版，DSH 仍使用宿主认证。

## 自动验证：通过

- `pnpm test`：236/236 通过；追加真实重启后的旧 CSRF 拒绝断言后，相关 4 项接口测试再次通过。
- `pnpm build`：DSH 客户端、连接器、独立客户端构建成功。
- `pnpm check`：包声明、patch、服务端 Config、客户端注册和生命周期检查通过。
- `git diff --check`：通过。
- 新增覆盖：两个独立会话、重启保留、分别撤销、并发兑换仅一次成功、旧码替换与过期、限流及恢复、90 天闲置失效、持久化失败不消费代码、旧版凭据拒绝和业务文件不变、损坏授权显式恢复、终端控制来源隔离、CSRF 与前端不重放写操作、已有锁保护。

## Ego Lite 界面自查：通过

使用独立验收空间 30，完成后已关闭；未使用或清理其他空间。

- 直接访问无凭据固定地址看到配对页；错误码保留表单并明确提示。
- 小写/空格配对码输入和 Enter 提交成功；刷新保留授权。
- 设置生成新码、复制、展示失效状态和浏览器列表。
- 第二个独立 HTTP 客户端兑换后列表为两条；撤销它后其请求为 401，而当前页面仍可访问。
- 撤销确认自动聚焦；Tab 到取消、Enter 取消后焦点回原按钮。确认撤销当前浏览器后回配对页，可用 CLI 新码恢复。
- 实际停止测试服务，已有页面显示服务离线；重启同一测试目录后点击重连，保留浏览器授权。
- 复制成功；模拟剪贴板拒绝后自动选中配对码并显示手动复制提示。此项故障为页面内测试注入，重新加载后已恢复。
- 宽屏浅色和 390×844 深浅色自查，业务滚动区域无横向溢出；主题从配对页延续到看板；减少动态效果偏好下无新增动画。
- 页面截图已查看，不仅以 DOM 或尺寸断言代替视觉检查。

本机证据（忽略目录，不包含真实个人数据）：

- [配对页](../../.install/browser-access/authorization-page.png)
- [390 像素深色设置](../../.install/browser-access/access-settings-dark-390.png)
- [服务离线](../../.install/browser-access/service-offline.png)

## 包与实际加载状态

- 包：`.install/browser-access/dsh-workbench-personal-social-local-0.7.0.tgz`。
- 大小：1,069,765 字节，73 个归档条目。
- SHA-256：`a33ac15b1b328af5a0e0ef183a1fdaf296035152076901ed94ff4717d105ea3f`。
- 新增授权源码、入口、页面、DSH 客户端、服务入口、patch 和使用说明与归档逐字节一致。package.json 语义一致，pnpm 正常移除了 packageManager 字段并调整字段顺序。
- 归档不含账号、连接凭据、访问会话、控制文件、锁或恢复副本。独立版仍按原包流程在 npm start 前构建，不把 lib/standalone.js 当作 DSH 客户端安装。
- 独立预览：已加载 0.7.0 构建，当前地址 `http://127.0.0.1:43130/`。使用脱离当前终端的专用测试进程，日志 `/tmp/psw-browser-access-20261017-preview.log` 含短期测试配对码，未纳入版本库。
- Desktop 安装：未执行。本轮不替换原工作台，避免干扰主线程与用户 review。
- Desktop 宿主加载、已安装列表、左侧切换入口与原生业务界面：未验证，不能用本轮独立预览代替。

预览重新取码：

```sh
npm --prefix /Users/zhou/.codex/worktrees/browser-access-pairing/personal-social-workbench run auth:code -- --root /tmp/psw-browser-access-20261017
```

## 未覆盖项

- Chrome / Edge / Firefox / Safari 原生界面未逐个运行。本轮真实交互在 Ego Lite；第二客户端为 HTTP 自动化，使用 Edge User-Agent 仅验证名称与独立会话，不代表打开过 Edge。
- frontend-ui-ux 的独立体验评审未完成：本侧对话禁止使用子代理，因此仅记录实现者自查，不签发独立评分或宣称完整体验评审通过。
- 没有操作真实平台账号、同步真实数据或验证远程访问；本功能不提供远程访问。
