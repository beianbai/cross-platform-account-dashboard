# 2026-11-12 抖音 ARTICLE 修正本机安装

## 授权与真实页面证据

- 使用者在真实 Safari 的抖音 self 登录页面运行新旧对照脚本，返回 `before: parse_error`、`after: needs_login`。
- 使用者明确同意把该修正安装本机，保持 0.8.6，不提交 Git。
- 本轮沿用修复分支与已有修改；没有新增版本、Git 提交/合并/推送或 Release。
- 重新获取官方开发规范，2026-10-27 版本，与此前读取的完整文件逐字节一致；遵循本地开发流程。

## 构建、打包：通过

- 全量 304 项测试通过；客户端、三浏览器连接器、独立版构建通过；包检查通过。
- 安装包 `.install/douyin-article-4bf613e0f9b5.tgz`，0.8.6，1,714,378 bytes，88 个文件。
- SHA-256：`4bf613e0f9b552f0c460cb707a91f63806ac92f9f15cbef5dbcf0f5fc9e82fce`。
- 核实入口和源码对应，归档小于 8 MiB，无账号/连接控制文件、私钥、已知凭据模式或本机私人路径命中。

## 磁盘安装：通过

- 重新查看 Desktop 随附 CLI 帮助，确认支持本地 tarball。使用 web profile、offline、ignore-scripts 安装，退出 0；88 个安装文件均与归档逐字节相同。
- 安装器既有 SEO 插件兼容与 Cordis peer 警告未作额外豁免，不视为这些无关插件加载通过。
- Safari 构建输出 `.install/safari-local-article-20261112`，使用当前完整 Xcode，未修改全局 Xcode 选择。
- 构建及 ad-hoc 深度严格签名校验通过；不含开发者签名/公证，不代表正式分发安装体验。
- 备份原应用为 `.install/safari-before-article-20261112-rollback.zip` 后更新原试用路径 `.install/safari-trial-0.8.0/Account Dashboard Safari.app`，保持应用/扩展身份与 0.8.6 不变。
- 注销 Xcode 自动登记的新构建输出路径，只注册原试用路径；pluginkit 最终只有 1 个该标识的扩展。
- 10 个已安装扩展资源与生成资源一致。已安装 readPageGate 函数与真实 Safari 对照中通过的修正源码逐字节一致。
- 安装后 background.js SHA-256：`7fa8a0aaf6444461d6bb72e8eb14bb2cfa07c6b4630f8e24dfc96c7271d9fca4`。

## 当前进程与同步 UI：待验证

未自动关闭或重启 Safari、Desktop 或 Harness，未操作账号、浏览器授权、配对或登录状态。此前原生 Safari 控制工具超时，不能冒充本轮 UI 验收证据。

使用者随后明确反馈“成功了”，确认真实同步已显示预期登录提示，该项使用者验收通过。本轮变更在扩展检测函数，未修改已安装服务端协议。其他未执行的宿主界面项目不因该项通过自动视为已验收。
