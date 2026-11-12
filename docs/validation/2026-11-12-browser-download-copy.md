# 2026-11-12 用户下载包与文案清理

- 用户确认抖音真实未登录提示成功，随后要求移除开发进度文案，并指出 Safari 下载仍是源码而非成品应用。
- 分支 `codex/browser-download-user-copy`；保留全部既有修改，版本保持 0.8.6，没有 Git 提交、推送、合并或发布。
- 连接弹窗和更新记录移除修复中/待复测等研发进度。下载按钮明确限定 Chrome/Edge/Firefox，Safari 已安装用户仍可配对。
- 用户下载 ZIP 只含 chromium、firefox 和面向用户的 README（21 个文件）；Safari 源码和构建脚本仍保留在开发资源中，不再混入该下载包。新增 extension/INSTALL.md。没有以 ad-hoc 测试应用冒充正式安装包。
- 修改真实归档/下载路由集成测试，先确认旧 ZIP 失败，再构建验证通过；全量 304 项测试、构建、包检查与 diff 检查通过。
- Ego 空间 9 中实际打开隔离 UI 预览并展开安装说明，下载标签、Safari 可用性说明及排版正常；截图 `/tmp/psw-browser-download-copy.png`。已结束空间。该预览不等于 Desktop 宿主实测。
- 安装包 `.install/browser-download-3deef118956f.tgz`，1,664,455 bytes，89 个文件，SHA-256 `3deef118956fa1bb7c6f7ff4531501ed513e1fe3f443162627e0682e4ca8986b`。检查无私钥/已知凭据模式/本机私人路径命中。
- 通过 Desktop 随附 CLI 的 web profile 本地安装，退出 0；89 个安装文件与归档一致。没有重新构建或替换已通过验收的 Safari 应用。Desktop 当前界面加载新文案待重启后核实；没有自动重启宿主。
- 本机 codesigning 身份查询未发现 Developer ID Application、Apple Development 或 Apple Distribution 身份。用户确认尚无付费开发者账号，要求先说明开通流程。Safari 正式分发尚未交付，签名/公证、全新机器安装、用户端无需 Xcode 的完整安装验收均待后续完成。
- 已读取 Apple 官方 enrollment/enroll 页面及 Safari Web Extension 分发文档：支持 Mac App Store，亦支持 Developer ID 签名、公证后在商店外分发。用户注册、身份核验、许可及付款由本人完成。

后续用户明确选择无需付费会员的预构建 ad-hoc 应用分发，不采用上述签名计划。已新增独立应用下载，实际检查及安装结果见 [Safari 应用下载](2026-11-12-safari-app-download.md)。会员不是免费试用此扩展的必要条件。
