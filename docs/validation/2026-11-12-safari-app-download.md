# 2026-11-12 Safari 预构建应用下载

## 授权与范围

用户明确选择免费分发已构建 `.app` ZIP，不加入付费开发者计划、不上架 App Store。维护者构建，普通用户无需 Xcode 或开发者会员；应用使用 ad-hoc 签名、未公证，Safari 需要允许未签名扩展且退出后重设。此前“正式分发必须是唯一交付路线”的解释已纠正。

本轮分支 `codex/safari-app-download`，版本保持 0.8.6，保留既有修改，没有提交、合并、推送、Release 或外部发布。重新核对官方工作台开发规范，与此前完整读取的 2026-10-27 版本一致。

## 实现

- 连接弹窗提供独立 Safari 应用下载按钮，Chrome/Edge/Firefox 保持原 ZIP；说明仅包含用户所需的启用条件与限制。
- `browser/download/safari` 返回 `account-dashboard-safari.zip`；文件不存在返回 503 JSON，不回退到源码或 HTML。
- `--release` 构建 Intel/Apple 芯片通用 Release 应用，不生成调试信息；维护者打包脚本检查版本、身份、架构、扩展资源、签名完整性及本机私人路径，ZIP 只包含应用和 INSTALL.txt。
- 哈希清单覆盖 ZIP、完整扩展资源文件名集合/内容、安装说明。包检查拒绝资源过期、漏加文件、版本或说明不一致的包。
- README 中英文及用户安装说明改为预构建应用流程；Xcode 构建命令仅保留在维护者说明中。系统拦截由本人确认来源并按应用级提示处理，不提供关闭整体系统保护的脚本。

## 验证：通过

- 先扩展包/下载路由测试，旧实现因缺少 Safari 独立接口而失败；实现后全量 304 项测试、构建、包检查、diff 检查通过。真实打包测试覆盖 ZIP 内容、正确响应、缺失文件 503、过期采集资源检查失败。
- 干净的通用构建：`.install/safari-download-release-clean-20261112`。首个 Release 试构建检测到编译路径，已禁用调试信息重新构建；该首个应用未被交付。
- Safari ZIP 约 480 KiB，SHA-256：`1ea168c00a8e25ba16024937558ff6abbff50e04cb7049dbb7da57cac1137c3b`。
- Ego 空间 10 在隔离界面预览中，按钮连接真实 dsh 下载处理函数，实际点击并保存 `/tmp/psw-safari-user-downloaded.zip`，逐字节匹配产物。
- 使用下载得到的 ZIP 解压检查：应用及扩展均 0.8.6、arm64+x86_64、具有执行权限；codesign 深度严格完整性检查通过，10 个扩展资源与清单一致，无 Xcode 工具链运行时链接。
- 宽窗/420px 窄窗截图已查看，按钮及限制文案不溢出：`/tmp/psw-safari-download-wide.png`、`/tmp/psw-safari-download-narrow.png`。Ego 空间已结束，隔离服务已关闭。预览不冒充 Desktop 截图。
- 独立代码审查及反馈复验无阻断项；已修复资源文件集合、安装说明过期校验和 README 文案问题。

## 打包与本机安装：通过

- `.install/safari-app-download-e315352d4e46.tgz`，2,139,931 bytes，93 个文件，0.8.6。
- SHA-256：`e315352d4e46a26b67d74e6b895dd0d4e2a21b8fcae0beebe61c253b17610323`。
- 归档小于 8 MiB，检查必要入口及 Safari ZIP 内部文件，无源码工程、Swift 源码、dSYM、本机私人路径或凭据模式命中。
- 重新查看随附 CLI 帮助，使用 web profile 本地 tarball 安装，退出 0；93 个安装文件均与归档一致。既有无关插件兼容/peer 警告未做额外豁免。
- 保留现用 Safari 应用及配对；Xcode 自动登记的两个新构建路径均已注销，最终仅保留原试用路径的 1 个扩展登记。未自动关闭/重启 Safari、Desktop 或 Harness。

## 待验证边界

Desktop 当前进程需使用者重启 Harness 后加载新增路由与客户端，真实宿主按钮下载尚待本机界面确认。用户此前验收通过的抖音同步不因本轮打包自动算作新应用安装验收。

没有在全新、无 Xcode 的另一台 Mac 上实际打开该 ZIP 应用；未验证互联网隔离属性下的 Gatekeeper 提示、Intel 真机运行、所有 Safari/macOS 版本或受管理电脑的安装。通用二进制、依赖及签名完整性检查不能替代这些实机结果。未获 Apple 开发者签名或公证，不声称免安全提示。
