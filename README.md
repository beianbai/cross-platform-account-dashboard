# 跨平台账号看板 · 0.5.0

小红书、抖音、哔哩哔哩、X，一个看板查看账号与作品。支持定时同步、每日趋势和本地历史记录，可扩展更多平台。

![跨平台账号看板](assets/cover.png)

默认浅色主题，可切换深色。既可安装在 DSH Desktop，也可独立运行在本机浏览器。MIT 开源许可；当前开发仅在本地，尚未推送远端或发布市场。

## 独立运行（无需 DSH）

安装 Node.js 22+，下载或克隆本仓库，在项目目录执行：

```sh
npm install
npm start
```

也可使用 pnpm 10.34.5：`pnpm install --frozen-lockfile`，然后 `pnpm start`。首次启动会构建界面与连接器。在任意现代浏览器打开终端显示的完整本机链接，连接浏览器后即可添加平台。该首次链接含本机授权，不要分享；地址栏会自动移除授权片段。之后同一浏览器可直接访问本机地址。

默认地址 `http://127.0.0.1:43120`；服务只监听本机。关闭终端或按 Ctrl+C 停止，定时同步也会暂停。修改端口用 `npm start -- --port 43121`。数据默认保存位置：

| 系统 | 目录 |
| --- | --- |
| macOS | `~/Library/Application Support/cross-platform-account-dashboard/standalone` |
| Linux | `$XDG_DATA_HOME/cross-platform-account-dashboard/standalone`，未设置时使用 `~/.local/share` |
| Windows | `%LOCALAPPDATA%/cross-platform-account-dashboard/standalone` |

需要自定义目录时用 `npm start -- --root /你选择的独立数据目录`。不要指向 DSH 数据目录；两个运行方式不自动共享账号或授权。首次连接浏览器仍需安装连接器并确认权限。异常断电后若提示目录已占用，先确认旧实例已停止，再删除提示中的 `.standalone.lock`，不要在服务运行时删除。

升级源码后重新安装依赖并 `npm start`。连接器更新请按下方说明；启动失败不会清空账号数据。

## 使用流程

1. 打开「跨平台账号看板」，连接已经登录平台的浏览器。自动选择优先使用已配对扩展，否则使用本机可用的浏览器适配器；也可在连接设置中指定。
2. 点「添加平台」，只添加你实际使用的平台。首次读取成功后完成绑定。
3. 在总览查看账号，进入详情查看 7 / 30 / 90 天趋势、每日净变化及当前已加载作品。
4. 在每个平台的设置中单独开启自动同步：每日指定时间，或每 1 / 3 / 6 / 12 小时。默认关闭，支持时区设置。
5. 登录失效、验证码、页面无法识别或账号不符时，只暂停该平台。完成平台页面上的操作后回工作台继续；失败保留最后成功数据。

隐藏平台只影响展示，已有计划继续运行。解除绑定会停止计划，并将历史留作本地归档；重新绑定同一账号可恢复。

## 每日记录与自动同步

- 每个自然日保留最后一次成功观测。缺测不补零，折线不跨缺口；只有相邻自然日且时区一致才计算净变化。
- 万 / 亿 / k 等约数保留约数标记，净变化相应标注估算。未知指标不显示为零。
- 修改时区保留原记录的时区，不重新改写历史日期。原 90 次快照迁入每日记录；首次迁移先逐字节备份原文件。
- DSH Desktop（或独立服务）与浏览器需保持运行。休眠或关闭期间不会采集，恢复后合并执行一次到期任务，不补造历史。
- 各平台任务串行执行；网络失败短暂重试，登录或验证问题等待用户处理。解绑或修改计划后，旧任务结果不能覆盖新状态。
- 扩展自动任务使用不激活的专用标签，成功后关闭。可选本机适配器执行计划时可能打开任务窗口，设置中会提示此限制。

## 浏览器连接

工作台主流程不要求特定浏览器，也不修改系统默认浏览器。读取页面需要可用适配器，单纯打开默认浏览器不能代替授权。

- Chrome 120+ / 当前版 Edge：下载连接器，解压后在扩展管理页加载 chromium 目录，生成一次性连接码并在扩展中授权。
- 其他 Chromium 浏览器：需支持 MV3、scripting、alarms 和本地扩展，未逐一实机认证。
- Firefox 115+：在 about:debugging 临时加载 firefox/manifest.json，重启浏览器后需要重新加载。
- Safari / 移动浏览器 / 禁止本地扩展的受管浏览器：暂无适配器，仍可查看本地缓存。
- Ego Lite：已有安装时可作为可选适配器。默认命令位置 ~/.local/bin/ego-browser，可在插件配置中指定 browserExecutable。

升级到 0.5.0 后，已有 Chrome/Edge 扩展也需要更新：下载新的连接器，替换原加载目录的文件，在扩展管理页点击重新加载；保持原目录和扩展身份可保留本机授权。Firefox 临时附加组件重新载入新包。仅升级工作台不会自动替换浏览器里已加载的扩展。

连接器约每 30 秒检查本机待办，任务接收可能稍有延迟。一次仅授权一个扩展连接；重新配对替换旧凭据。不同浏览器的登录状态不会复制。扩展安装与权限确认由用户亲自完成。

扩展的“已提交”只表示原始读取结果已送达；工作台完成身份校验与落盘后才显示“同步成功”。两端不把接收成功冒充保存成功。

## 数据与读取边界

数据保存在插件配置的本机目录。accounts.json 保存账号、每日记录、计划及恢复状态；browser-connection.json 保存本机授权，权限 0600。不要分享这些内部文件。首次从旧版迁移会保留 accounts.v1.backup.json；卸载不删除用户资料。

扩展仅申请 storage、scripting、alarms、127.0.0.1 及四个平台必要域名权限，不申请 cookies、history、debugger、webRequest 或全站访问。本机桥接校验 Host、扩展 Origin 与随机凭据；连接码两分钟过期、单次有效。DSH 工作台接口受宿主认证保护；独立版使用本地会话、同源检查与请求校验。

采集只读取可见 DOM，不访问平台私有 API、不绕过验证码、不读取密码或 Cookie、不发帖/点赞/评论/关注。作品最多保存 200 条，仅代表当前页面已加载内容。小红书作品总量未知时保持未知；抖音不混入喜欢和收藏；哔哩哔哩分别读取本人投稿页的视频、图文与音频，分类展示平台总数、已读取数量及未读取状态；不混入收藏或推荐，不承诺读取全部历史投稿；X 只保存本人已加载帖子，排除他人转帖与推荐，主页总数可能包含回复和转帖。X 不提供可靠账号累计获赞值，因此保持未知。

## 扩展新平台

「添加平台 → 自定义平台」引导填写官方域名、主页、指标和登录要求，生成针对当前项目的开发提示词。它是后续开发入口，不会直接执行用户脚本或把尚未实现的平台标记可用。详见 [平台开发指南](docs/PLATFORM-DEVELOPMENT.md)。

## 开发与本地安装

```sh
pnpm test
pnpm build
pnpm check
pnpm pack
```

包包含已构建的单文件客户端、服务端、两套本地连接器及指南；无运行期远端脚本。测试使用合成数据和临时目录，不改真实账号。安装应使用 Desktop 随附的 Node 包装器与正确 DSH_HOME：

```sh
PATH="$HOME/Library/Application Support/dsh-desktop/harness/.desktop-bin:$PATH" \
DSH_HOME="$HOME/Library/Application Support/dsh-desktop/harness" \
"$HOME/Library/Application Support/dsh-desktop/harness/.desktop-bin/node" \
'/Applications/DSH Desktop.app/Contents/Resources/app.asar/node_modules/@deepseek-ai/dsh/lib/bin.js' \
plugin --profile web add "$PWD/dsh-workbench-personal-social-local-0.5.0.tgz" \
--offline --ignore-scripts --config.auto-install-peers=false
```

实际安装、界面验收与未验证范围见项目中的 docs/LOCAL-TEST.md。配置和文件安装成功不等于 Desktop 已实际加载。本项目只在本地使用，没有发布市场、远端仓库或 npm 包。

## Git 与贡献

本地 Git 已建立版本基线；账号数据、授权、备份与构建产物不进入版本历史。公开协作准备了 [贡献指南](CONTRIBUTING.md)、[安全说明](SECURITY.md)、[更新记录](CHANGELOG.md) 和 GitHub 检查/议题模板。采用 [MIT 许可](LICENSE)。

`package.json` 的 repository 当前是保留 DSH 安装身份的本地占位标识，不代表已存在公开仓库。准备上传 GitHub 时先确定真实地址，并同时迁移 DSH 工作台身份与现有会话归属，不能只随意修改该字段。本项目未配置 Git remote。
