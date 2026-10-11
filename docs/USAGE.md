# 使用与维护指南

[返回中文 README](../README.md) · [English README](../README.en.md)

本页保留首次上手之后需要的运行参数、数据口径、升级与 DSH 安装细节。浏览器配对步骤见[连接器指南](../extension/README.md)。

## 运行参数

在项目根目录使用 `npm start`，启动会先构建界面和连接器。默认监听 `127.0.0.1:43120`；不要通过反向代理暴露到公网。首次打开终端提供的完整授权链接，此后同一浏览器可直接访问本机地址。

更换端口或使用专用数据目录：

```sh
npm start -- --port 43121
npm start -- --root /你选择的独立数据目录
```

独立版与 DSH 版不自动共享数据或授权。不要将独立版 `--root` 指向 DSH 数据目录。升级源码后重新安装依赖并启动；启动失败不会清空账号数据。

## 数据目录与备份

独立版的默认目录：

| 系统 | 目录 |
| --- | --- |
| macOS | `~/Library/Application Support/cross-platform-account-dashboard/standalone` |
| Linux | `$XDG_DATA_HOME/cross-platform-account-dashboard/standalone`；未设置时为 `~/.local/share/cross-platform-account-dashboard/standalone` |
| Windows | `%LOCALAPPDATA%/cross-platform-account-dashboard/standalone` |

DSH 版使用插件配置的本机数据目录。主要文件：

- `accounts.json`：账号、每日记录、计划及恢复状态。
- `browser-connection.json`：本机浏览器授权，权限 `0600`。
- `standalone-session.json`：独立版本机会话，权限 `0600`。
- `accounts.v1.backup.json`：首次从旧数据格式迁移前的逐字节备份。

这些文件包含个人数据或本机授权，不要分享。备份或删除前先停止对应服务；卸载不会删除用户资料。异常断电后若提示目录占用，先确认旧实例已停止，再删除错误提示中指定的遗留 `.standalone.lock`；运行中不能删除它。

## 每日记录与自动同步

每个平台可独立选择每日指定时间，或每 1 / 3 / 6 / 12 小时同步，支持时区设置，默认关闭。

- 每个自然日保留最后一次成功观测。缺测不补零，折线不跨缺口；只有相邻自然日且时区一致才计算净变化。
- 万 / 亿 / k 等约数保留标记，相关净变化标注估算。未知指标不显示为零。
- 修改时区保留原记录的时区，不重写历史日期。旧版最近 90 次快照迁入每日记录，首次迁移前备份原文件。
- 本机服务或 DSH Desktop 与浏览器需保持运行。休眠或关闭期间不采集；恢复后合并执行一次到期任务，不补造历史。
- 各平台任务串行执行。网络失败短暂重试；登录、验证、解析或身份问题暂停受影响平台，处理后回看板继续。失败保留最后成功数据。
- 扩展自动任务使用不激活的专用标签，成功后关闭；可选本机适配器执行计划时可能打开任务窗口，设置中会提示。
- 隐藏平台只影响展示，计划继续运行。解绑会停止计划并保留本地归档；重新绑定同一账号可恢复。修改计划或解绑后，旧任务结果不会覆盖新状态。

## 各平台读取范围

只读取可见 DOM；作品最多保存 200 条，代表当前页面已加载范围，不能视为全部历史。

| 平台 | 统计与内容边界 |
| --- | --- |
| 小红书 | 作品总量未知时保持未知 |
| 抖音 | 读取本人作品，不混入喜欢或收藏 |
| 哔哩哔哩 | 读取本人投稿页的视频、图文与音频；分别展示平台总数、已读取数量与未读取状态，不混入收藏或推荐，不保证全部历史投稿 |
| X | 只保存本人已加载帖子，排除他人转帖与推荐；主页帖子总数可能包含回复和转帖，不等于列表长度；无可靠累计获赞值，因此保持未知 |

各平台页面结构变化可能导致读取失败。连接器的「已提交」仅表示原始结果已送达；看板完成身份核验和落盘后才算同步成功。

## 连接器、授权与升级

默认自动选择优先使用已配对扩展，否则尝试本机可用适配器；也可在设置中指定。主流程不要求改变系统默认浏览器，单纯打开浏览器不能代替授权。

Chrome 最低 120，Edge 建议当前稳定版；Firefox 115+ 使用临时附加组件，重启后需重新加载。Ego Lite 为可选适配器，默认命令位置 `~/.local/bin/ego-browser`，DSH 插件可用 `browserExecutable` 配置；独立版可传 `--browser-executable`。

- 连接器约每 30 秒检查待办，休眠时可能更久；可以从扩展主动检查任务。
- 一次仅授权一个扩展连接；重新配对替换旧凭据，不复制不同浏览器的登录状态。连接码 2 分钟过期且仅一次有效。
- 工作台升级不会替换浏览器里已加载的扩展。下载新连接器，替换原加载目录文件，在扩展管理页重新加载；保留原目录与扩展身份可保留授权。Firefox 重新载入新包。
- 扩展只申请 `storage`、`scripting`、`alarms`、本机地址及平台必要域名权限；不申请 Cookie、历史、调试或全站访问权限。本机桥接校验 Host、扩展 Origin 与随机凭据。DSH 接口受宿主认证保护，独立版使用本地会话、同源与请求校验。

详细恢复步骤及权限说明见[连接器指南](../extension/README.md)和[安全说明](../SECURITY.md)。

## 安装到 DSH Desktop

先按[贡献指南](../CONTRIBUTING.md)准备 Node.js 22+ 和 pnpm 10.34.5，在项目根目录构建并打包：

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm check
pnpm pack
```

产物包含构建后的客户端、服务端、两套本地连接器和说明，无运行期远端脚本。使用当前 Desktop 明确支持的本地包安装入口；不要将构建成功或配置存在当成已在宿主加载。

<details>
<summary>macOS 上已使用的 DSH CLI 安装方式</summary>

以下路径对应本机 DSH Desktop 布局；其他安装位置请先确认 CLI 路径与本地包支持。包名中的 `0.5.0` 应与当前 `pnpm pack` 产物一致。

```sh
PATH="$HOME/Library/Application Support/dsh-desktop/harness/.desktop-bin:$PATH" \
DSH_HOME="$HOME/Library/Application Support/dsh-desktop/harness" \
"$HOME/Library/Application Support/dsh-desktop/harness/.desktop-bin/node" \
'/Applications/DSH Desktop.app/Contents/Resources/app.asar/node_modules/@deepseek-ai/dsh/lib/bin.js' \
plugin --profile web add "$PWD/dsh-workbench-personal-social-local-0.5.0.tgz" \
--offline --ignore-scripts --config.auto-install-peers=false
```

`--offline` 依赖本机已有缓存；缺少缓存时不能认为安装通过，应先查明缺失依赖再处理。

</details>

安装后按宿主提示重启，从已安装列表和侧栏实际打开看板。当前已有的 0.5.0 本机记录确认了包安装与配置；DSH 原生界面加载仍有未实测项。独立版的验证结果不能代替宿主验收。

## 开发与发布身份

「添加平台 → 自定义平台」会收集官方域名、主页、指标和登录要求，生成针对项目的开发提示词。它不会执行任意脚本或直接启用新平台；实现与测试方法见[平台开发指南](PLATFORM-DEVELOPMENT.md)。

`package.json` 的 `repository` 是保留 DSH 安装身份的本地占位标识，不代表公开仓库。准备公开时先确定真实地址，并同时迁移工作台身份与已有会话归属，不能只改这个字段。本项目尚未配置 Git remote，也未发布 npm 或市场。

账号数据、授权、备份和构建产物不进入版本历史。测试使用合成数据与临时目录，不操作真实账号。贡献前参阅[贡献指南](../CONTRIBUTING.md)、[安全说明](../SECURITY.md)及 [MIT 许可](../LICENSE)。
