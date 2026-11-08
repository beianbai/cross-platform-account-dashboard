# 2026-11-08 上手指南与 Safari 本地试用适配

本轮分支：`codex/onboarding-safari-local`。本地开发、打包和 Desktop 安装。使用者在后续确认分两笔本地提交；无合并、推送、Release 或市场更新。

## 最初验证时的依据与环境（后续状态见文末）

- 实际获取并阅读全文：<https://dshdesktop.com/workbench/docs/development.md>，2026-11-08 获取，官网版本 **2026-10-27**。按当前 3.6 探测安装工具；本会话未提供 `install_local_workbench`，使用已探测支持 tarball 的随附 CLI 回退。未拒绝审批后绕过工具。
- Apple 当前文档：Safari Web Extensions 的运行、兼容性、打包与分发说明；支持新名 `safari-web-extension-packager` 及旧名 `safari-web-extension-converter`。文档支持不代表本机原生通过。
- macOS **14.3.1 / arm64**；Safari 安装元数据 **17.3.1**，未查看 Safari「关于」。本机开发目录指向 Command Line Tools，未找到完整 Xcode 或上述 Safari 工具。
- DSH Desktop 安装元数据 **0.12.1**，未查看原生「关于」。原生 UI 工具返回 `Sky Computer Use service startup request failed`；无法操作已安装列表、入口与实际界面。
- 保留用户原有 `docs/validation/2026-10-12-desktop-0.6.1.md` 未提交修改。

## 实现与技术验证

| 项目 | 结果与证据 |
| --- | --- |
| 上手指南双向切换 | 通过：顶部入口反复点击可展开、收起；内部仅保留收起；箭头与 `aria-expanded` 一致 |
| 持久化与兼容 | 通过：刷新后保持收起；旧版 `skipped` 偏好仍关闭且可重开；不修改账号与完成状态 |
| Safari 来源与授权 | Node 集成测试通过：严格 UUID 来源、预检、错误 token、伪造来源、来源替换、任务结果、服务重启与撤销。不是 Safari 原生网络验收 |
| Safari 适配资源 | 通过：下载 ZIP 和 tgz 均含 safari manifest、脚本、弹窗、图标、构建入口和说明。权限继续限于本机与四个平台 |
| 全量测试 | `pnpm test`：**238/238 通过**，0 失败、0 跳过 |
| 构建与包检查 | `pnpm build`、`pnpm check`、`git diff --check` 通过 |
| 独立代码评审 | 分离上下文 reviewer 完成；未发现必须修复问题。其针对性 108 项测试通过。建议补真实焦点与原生更新验证，焦点随后在浏览器预览补测 |
| Safari 构建脚本帮助 | `node extension/build-safari.mjs --help` 正常 |
| Safari 原生构建 | **受阻**：指定实际 safari 产物执行脚本，退出 1，明确缺少完整 Xcode；未生成或安装 .app。未自动下载开发工具或更改 Safari 安全设置 |

## 实际浏览器预览

Ego Lite 的隔离合成数据夹具；**不是 Desktop 截图，也不是 Safari 验收**。

- 宽屏浅色与 390px 窄屏深色已实际查看截图；窄屏文档宽度为 390，无整页横向溢出。
- 顶部点击收起 → 空格展开 → 回车收起；内部收起后入口获得焦点；从设置页打开进入总览并聚焦指南标题；刷新后仍收起。
- 浏览器连接弹窗展开 Firefox / Safari 说明；390px 时弹窗范围 x=12…378，完整位于容器，说明可读。
- 连接弹窗按 Escape 后等待 React 完成渲染，确认弹窗关闭；初次立即读取曾观察到旧帧，已用等待最终状态复核。滚动后全局顶部栏仍位于 y=0。
- 未触发真实平台同步、未消耗真实连接码、未改写 Safari 设置或真实账号数据。
- 截图保存在 `.install/validation-20261108/`，不打包；浏览器任务已关闭。

## 包与本机安装

- 版本：**0.8.0**。
- `pnpm pack --pack-destination .install` 产物：`.install/dsh-workbench-personal-social-local-0.8.0.tgz`。
- 大小：**1,668,731 bytes**，小于 8 MiB；88 个包条目。
- SHA-256：`e29c667aa03c8510758c44d9f6e61e1b344028830d78f8248c4c4269569d9294`。
- 实际检查归档版本、入口、patch、Safari 文件和 ZIP；当前源码/产物与包内容一致。`pnpm pack` 正常移除源清单的 `packageManager` 字段；其余清单与安装副本一致。无账号文件、授权文件、.env 或本机用户名绝对路径。
- 通过 Desktop 随附 CLI `plugin --profile web add <本轮tgz> --offline --ignore-scripts --config.auto-install-peers=false` 安装，退出 **0**。
- 安装目录版本 **0.8.0**；`lib/client.js`、`dsh/index.js`、`src/browser-bridge.mjs`、扩展 ZIP 和 Safari manifest 与本轮逐字节一致。
- `--profile web --dump-config` 中存在本包插件条目；只报告本包匹配结果，完整配置已从临时文件清理。
- CLI 报告 Cordis peer 缺失提示及另一已安装工作台的 Harness 版本范围警告；未放宽权限、豁免其版本或修改其他插件。安装成功不证明本轮模块已由当前宿主加载。

## 宿主与 Safari 验收边界

| 项目 | 本轮状态 |
| --- | --- |
| Desktop 包安装、版本和磁盘内容 | **通过** |
| Desktop 配置含本包 | **通过** |
| Desktop 本轮已安装列表、运行状态、工作台切换入口 | **待验证**：原生 UI 工具不可用 |
| Desktop 新模块加载、实际指南交互和布局 | **待验证**：没有宿主内证据，未重启 Harness |
| Safari 工程生成、.app 构建、注册与启用 | **待验证/受阻**：缺完整 Xcode，原生 UI 不可用 |
| Safari 本机配对、四个平台手动采集、后台自动同步、休眠/重启恢复 | **待验证**，不得以 Node 或 Chromium 结果替代 |
| Safari 更新保留授权 | **待验证**，保留固定 bundle identifier；没有执行卸载或删除数据 |
| iOS/iPadOS、签名和公开分发 | **不适用**：本轮仅 macOS 本地试用适配 |
| 创建/恢复宿主会话、工作区、草稿与归属 | **不适用**：本轮未使用这些能力 |
| 宿主侧栏、模式切换、卸载后保留 | **待验证**：未自行卸载、清空数据或改写归属 |

下一步：如 Desktop 尚未加载新包，在本轮任务结束后按宿主提示重启 Harness，再从工作台切换器打开「跨平台账号看板」。Safari 需先安装与当前 macOS 兼容的完整 Xcode，再运行 `pnpm run build:safari` 并按连接器 README 完成本机原生验收。本轮未宣称 Safari 可直接安装使用或全部本机自测通过。

## 后续：补齐 Xcode 安装与协作流程

- 按使用者反馈补齐主 README、中英文入口和连接器 README：官方下载、旧系统版本选择、.xip 安装、首次许可/组件初始化、工具链检查、构建命令、Safari 本人授权、配对、逐平台同步、自动触发、重启/休眠及更新验收；明确使用者只需先初始化 Xcode，开发者继续负责构建和排错。Safari 原生流程完成前不提交、合并或推送。
- 实际读取 Apple Xcode Resources 当前网页，确认旧版下载需 Apple Account、无需付费会员。Apple 兼容列表与版本发布说明本次网络请求失败；没有声称本次在线核实 Xcode 15.2 的系统要求，文档要求在官方下载页确认。
- `node scripts/build.mjs`、`pnpm check`、`git diff --check` 和实际归档测试 `node --test tests/package.test.mjs`（1/1）通过；本次仅文档与下载 ZIP 更新，未增加产品版本，未重复全部业务测试。
- 最新归档：`.install/safari-guide-1d30b300f3f3.tgz`（与标准文件名的最新产物内容相同），**1,674,660 bytes**，SHA-256 **1d30b300f3f3c20771375da1c2363eb3b8951eecc5750f440b3ab62a7bde7a61**。以上较早包哈希保留为本轮历史，后续以此最新归档为准。
- 首次同版本同文件名重新安装被 pnpm 认为 Already up to date，逐字节检查发现旧 README 尚未更新；改用上述包含内容哈希的新 tarball 路径，经同一官方 CLI 安装成功。主 README、连接器 README、包内说明和下载 ZIP 已与安装副本逐字节一致。未清缓存、删除用户资料或改变插件身份。
- Desktop 当前宿主界面仍待验证；Safari 原生工程/应用和真实业务流程仍待完整 Xcode，不因补齐文档改记通过。

## 后续：用户从 App Store 安装 Xcode 后的真实构建

- 重新获取并全文核对官方开发规范：<https://dshdesktop.com/workbench/docs/development.md>，仍为 **2026-10-27**。
- 当前实际探测为 **macOS 27.2 (26B123) / arm64**、Safari 安装元数据 **27.2**、**Xcode 27.2 (27B52)**。使用 `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`，未全局修改 xcode-select；Xcode 与 Apple Safari 打包工具可用，缺 Xcode 的历史阻塞已解除。
- 首次真实构建失败：Apple packager 生成外层标识 `com.beianbai.Account-Dashboard-Safari`，内嵌扩展为 `com.beianbai.accountdashboard.Extension`，违反父子前缀约束。修正生成工程的标识，兼容旧 `project.pbxproj` 与新 `project.xcproj` 格式；回归测试先失败、修正后通过。未绕过 Xcode 的内嵌校验。
- 第二次 `CODE_SIGNING_ALLOWED=NO` 编译成功，但 `codesign --verify --deep --strict` 失败。最终改为 Xcode 本地 **ad-hoc 签名**，无开发者证书、无公证，不用于正式分发；Safari 仍按未签名开发扩展处理。应用及扩展均为 **0.8.0 / build 1**，固定标识 `com.beianbai.accountdashboard` 及 `.Extension`，部署目标 macOS 12.0 仅为构建设置，不代表此系统上的 Safari 实测通过。
- 最终工程：`.install/safari-local-build-3/Account Dashboard Safari/Account Dashboard Safari.xcodeproj`；真实 xcodebuild 退出 0，日志 `BUILD SUCCEEDED`。应用及内嵌扩展的 codesign 深度严格检查通过；所有扩展资源与 `lib/browser-extension/safari` 逐字节一致，真实 Info.plist 声明 `com.apple.Safari.web-extension`。
- 供本人联调的应用：`.install/safari-trial-0.8.0/Account Dashboard Safari.app`，与构建产物复制后再次通过签名检查；同目录附 `开始使用.md`。未复制到 Applications、未运行该应用、未修改 Safari 设置。Xcode 构建日志包含 Launch Services 注册动作，不能据此认定 Safari 已识别或启用。
- 钥匙串只读查询显示 **0 valid signing identities**。最终面向普通用户的开发者签名、公证或 App Store 安装路径仍需完成，不能把本次要求允许未签名扩展的测试步骤作为产品最终体验。普通用户不需要 Xcode。
- 当前 CUA 可列出应用，但按名称与 bundle ID 访问 Safari 均在 30 秒超时；未获得可操作的 Safari 窗口或截图。Safari 的加载、启用、弹窗、配对、四个平台采集、计划、重启/休眠和更新仍全部待验证，Desktop 原生界面也仍待验证。未替换真实 Chrome 配对，未采集真实平台账号。
- `pnpm test` **239/239 通过，无失败或跳过**；`pnpm build`、`pnpm check`、归档测试 **1/1** 和 `git diff --check` 通过。聚焦代码审查无阻塞项，审查者独立复查签名也通过。
- 本次工作台归档 `.install/safari-xcode-38c5bada44de.tgz`，**1,676,653 bytes**，SHA-256 **38c5bada44ded98fb6993860525f0248af1b17b4b3ce2151a3bc5ddcc44c7a6f**。入口、脚本、说明及 ZIP 与当前源码/产物比对通过，不包含本地 Safari 工程或应用、真实账号或授权文件。
- 无提交、合并、推送、公开 Release 或市场更新。Safari 原生流程与最终分发仍未闭环。
- 从上述内容哈希归档经已确认支持 tarball 的 Desktop CLI 安装，退出 0；安装后的版本为 0.8.0，README、客户端、下载 ZIP、Safari 构建脚本和 manifest 等均与本次产物逐字节一致。缺少 Cordis peer 及无关 SEO 工作台的版本兼容警告仍存在，未擅自授予豁免或更改其他插件。磁盘安装通过，实际宿主加载未验证；没有自动重启。

## 后续：Safari 原生窗口与重复注册处理

- 使用者提供原生截图：本地应用成功打开，能查询扩展当前关闭状态；Safari 设置的扩展页显示两个同名 0.8.0 条目。该证据确认应用启动及 Safari 可发现扩展，不代表已启用、配对或采集通过。
- `pluginkit -m -A -D -v -i com.beianbai.accountdashboard.Extension` 确认两份注册分别来自 `safari-local-build-3/DerivedData/Build/Products/Debug` 与 `safari-trial-0.8.0`。原因是构建产物自动注册后，又复制了试用应用，留下两个路径。
- 使用 Launch Services `lsregister -u` 仅注销上述构建路径，退出 0；它同时移除了该路径的插件登记，随后显式 pluginkit 移除提示 no plugin at（无剩余登记）。再次完整查询仅剩 **1 plug-in**，指向 `safari-trial-0.8.0`。未删除任何应用文件、浏览器授权或账号数据，未重启 Safari。
- Safari 设置界面刷新后的单条目、勾选启用和工具栏弹窗仍待使用者确认。无产品源码变更、无 Git 操作。

## 当前结论：使用者验收及分批提交授权

使用者明确确认上手指南已验收；Safari 本机扩展启用、弹窗、配对及登录哔哩哔哩后同步成功。Safari 未登录测试中，小红书和哔哩哔哩提示正确；抖音和 X 误报无法识别平台数据，作为后续修复项。证据为本对话使用者实测反馈与截图，不冒称 Agent 独立完成四平台验收。不将真实昵称、账号、二维码和截图加入仓库。

使用者随后授权：先更新文案、记录并提交上手指南/Safari 本地接入；再单独修复登录识别和 UI 提示（可关闭、连接状态提前、弹框更早滚动）。此授权取代历史记录中的暂缓提交要求，不包含推送、合并或发布。旧记录保留时间顺序，当前通过范围以上述结论为准。

本机浏览器与看板间的同步链路已获得真实使用证据；自动计划、重启/休眠恢复、更新保留授权及正式签名分发仍待验证。Safari 17 是适配目标，非逐版本实测结果。用户对弹框的最新确认是“已有滚动，但触发高度过高”，后续仅调整高度约束并保留正文滚动。

第一批提交前重新执行 `pnpm build`、`pnpm test`（239/239）、`pnpm check`、`git diff --check` 均通过。当前在线开发规范与已全文读取的 2026-10-27 版本逐字节一致。此次只同步已验收范围及已知问题，不把新缺陷标为解决。
