# 2026-10-17 DSH Desktop 本地更新记录

本轮补齐界面迭代遗漏的打包与本机安装，并沉淀开发更新流程。**包已安装，重启后原生加载与界面验收仍待验证。**

## 环境与产物

- 操作系统与架构：macOS / arm64。
- Desktop：应用 `Info.plist` 为 0.12.0；本轮未能操作「关于」页面。
- 包：`dsh-workbench-personal-social-local@0.6.2`，同版本本地迭代；不是公开 Release。
- 分支：`codex/dsh-local-update-guide`。本轮未提交、合并或推送。
- 产物：`.install/2026-10-17-ux-feedback/dsh-workbench-personal-social-local-0.6.2.tgz`。
- 体积：1,047,799 字节；69 个归档条目。
- SHA-256：`b208378e5c79f701e26991a0012c2a5aa9c047794589cb433099ff9340e79205`。

## 已执行检查

| 项目 | 结果与证据 |
| --- | --- |
| 旧安装诊断 | 安装目录原有包为 0.6.2，客户端不含本轮飞书反馈链接；源码构建未自动更新该安装。 |
| 构建与包检查 | 本轮 `pnpm build`、`pnpm check` 通过。业务代码未在本轮修改；206 项测试通过的记录见此前交互验收。 |
| tarball | `pnpm pack --pack-destination .install/2026-10-17-ux-feedback` 成功。核对 manifest 语义、patch、服务端、客户端和新增开发指南；入口与本轮文件一致。pnpm 正常移除了打包 manifest 的 packageManager 字段。 |
| 分发范围 | 不含 `lib/standalone.js`；按归档路径检查无账号、授权、会话、环境文件、依赖目录、测试数据和备份目录。 |
| 当前 CLI 能力 | Desktop 随附 CLI 的 `plugin --profile web add --help` 明确支持 tarball。使用随附 Node/pnpm、Desktop 的 DSH_HOME 与 web profile。 |
| 实际安装 | 使用该 tgz 执行 `plugin --profile web add ... --offline --ignore-scripts --config.auto-install-peers=false`，退出码 0，输出 Packages +1；未运行依赖安装脚本。 |
| 安装文件 | `cmp` 确认安装目录中的 `lib/client.js`、`dsh/index.js` 与本轮构建逐字节一致。 |
| 插件配置 | `--profile web --dump-config` 成功，找到本包名和插件 id；完整输出未入库。 |

安装后客户端 SHA-256：`723ca1ee68b7ac5c6b17fec46aa169bfb646a59af4fbbe952e30162e402e32b1`。

安装输出有宿主 peer dependency 缺失警告，涉及 Cordis 与客户端连接包；命令成功不代表运行时依赖验证完成。本轮没有为消除警告往 profile 额外安装第二份宿主代码，是否影响加载须在重启后核验。

## 未完成的宿主验收

原生 UI 工具两次返回 `Sky Computer Use service startup request failed`。本轮未重启 Desktop，未操作已有账号、会话、授权或宿主私有记录。

| 项目 | 状态 |
| --- | --- |
| 重启后插件实际加载 | 待验证 |
| 「已安装的工作台」条目、版本与运行状态 | 待验证 |
| 左侧工作台切换入口 | 待验证 |
| 新反馈入口、浮动提示、返回和回顶的原生界面证据 | 待验证 |
| 原生无会话/已有会话、侧栏展开/收起、窄窗口 | 待验证 |
| 官方第 8 节其他适用项，包括模式归属及卸载保留 | 本轮未重测；不能用历史结果替代 |

用户可完整退出并重新打开 Desktop，自行从侧栏切换区选择「跨平台账号看板」；若未显示，到工作台市场「已安装」查看运行状态。也可以回来告知「重启好了」，待原生 UI 控制恢复后继续验收。

相关资料：[开发更新流程](../DSH-LOCAL-DEVELOPMENT.md)、[本轮浏览器交互与反馈表单验收](2026-10-17-ux-feedback.md)。
