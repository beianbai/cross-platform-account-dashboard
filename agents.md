## 提交与推送

- 每次内容修改后，默认不主动提交或推送；只有用户主动提出相应操作或明确授权时，才执行提交或推送。

## DSH Desktop 开发与更新

- 开发前新建本地功能分支；提交、合并、推送分别等待用户明确授权，不因测试通过自动执行。
- 开发和更新本工作台前，阅读并遵循 [本地开发、更新与验收流程](docs/DSH-LOCAL-DEVELOPMENT.md)，同时核对文中链接的官方规范。
- 修改源码、构建和浏览器预览不会自动更新已安装的 Desktop 工作台。交付时分别说明打包、安装、宿主加载和实际界面验收状态，未验证项不得报告通过。

## 工作台市场投稿与更新

- 用户明确要求“投稿／更新到工作台市场”时，按以下流程执行；此请求授权必要的公开仓库提交、合并、推送、Release 发布及收录 PR，但不授权公开凭据、真实账号数据或其他私有内容。仅更新本规则等文档不单独升级产品版本。
- 每次先读取[官方市场验收规范](https://dshdesktop.com/workbench/docs/market-acceptance.md)、上游 [catalog/README.md](https://github.com/dataelement/awesome-dsh-workbench/blob/main/catalog/README.md) 与 `data/categories.json`，并遵循本仓库的本地开发流程；不能将旧验收或浏览器预览当作本次 Desktop 实测。
- 本项目公开仓库为 `beianbai/cross-platform-account-dashboard`，上游为 `dataelement/awesome-dsh-workbench`，已有 fork 为 `beianbai/awesome-dsh-workbench`。先检查现有条目 `data/workbenches/beianbai__cross-platform-account-dashboard.yml`、未关闭 PR 和安装来源；复用 fork，不重复新建条目或投稿。
- 当前采用 GitHub Release 分发，条目指向 `https://github.com/beianbai/cross-platform-account-dashboard/releases/latest/download/cross-platform-account-dashboard.tgz`。更新版本须发布与包内版本对应的新 Release，并上传固定文件名 `cross-platform-account-dashboard.tgz`；仅推送 main 不会更新此安装源。仅版本更新、截图内容在原地址更新，通常无需目录 PR；名称、简介、截图地址／顺序、分类或安装地址变化时才更新 YAML。
- 投稿前核实最终版本、公开范围、许可证、本机安装与实际打开证据；运行项目真实测试、构建和包检查，用 `pnpm pack` 生成安装包，检查小于 8 MiB、无密钥／业务数据／本机私人路径。公开截图必须来自最终可安装版本的真实 Desktop 界面，使用有权公开的内容，不能用独立预览冒充宿主截图。证据不足时先完成可做的检查和材料准备，准确说明缺项，不直接投稿。
- 发布后下载实际 Release 地址，核对包内版本、SHA-256 和入口，从该下载包安装并记录实际结果。不要覆盖旧版本 Release、改工作台身份或清空用户数据来更新。使用已有授权的 GitHub 网页或 gh；不得为方便发布自行创建令牌、扩大权限，或将真实凭据写入命令日志和仓库。
- 确有资料变更时，从最新上游创建投稿分支，在 fork 中只新增或修改自己的上述 YAML。按当前 schema 填写真实中英文名称／简介、分类（目前为 `operations`）和 1–5 张本仓库 HTTPS 图片地址；保留必要的旧身份迁移字段，不添加版本、npm 包名或校验值，不改生成文件。读取脚本后运行市场仓库 `npm run check`；PR 描述说明用途、最终安装来源、Desktop 版本／平台、外部依赖、网络访问、存储位置及验收边界。
- 创建 PR 后将真实 URL 附加到当前任务，并核查最新提交的 CI 日志，跳过探测不算通过。最终分别报告 Release 地址、PR（如无需 PR 则解释原因）、在线目录实际版本和未验证项：拿到 PR URL 才称“已提交”，合并但目录未刷新称“等待目录更新”，目录中可见且安装来源有效才称“市场已更新”。不自动合并上游 PR。
