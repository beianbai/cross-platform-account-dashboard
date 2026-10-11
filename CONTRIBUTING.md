# 参与开发

需要 Node.js 22+ 和 pnpm 10（项目固定版本见 package.json）。

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm check
pnpm start
```

提交前先查看 Git 状态，保留已有改动。使用独立分支完成一项连贯改进，附上问题、行为变化、测试结果；界面改动附浅色/深色及窄屏截图。新增平台请遵循 [平台开发指南](docs/PLATFORM-DEVELOPMENT.md)，为身份识别、失败恢复和数据口径增加回归测试。

采集逻辑位于 src，DSH 入口位于 dsh，独立版位于 standalone，浏览器扩展位于 extension。两种运行方式复用业务服务；不要维护两套数据语义。lib 是构建产物，不手动编辑。

测试只能使用合成账号与临时目录。提交前检查暂存区，不能包含真实账号、授权、连接码、浏览器资料、日志或数据备份。不得通过采集绕过验证码、访问控制或平台限制。

本项目采用 MIT；贡献提交按相同许可提供。目前没有配置公开远端；仓库实际公开后再通过该仓库的议题和拉取请求协作。
