# 2026-11-12 连接器下载失败处理

用户报告 Desktop 内 Safari 下载无结果。分支 `codex/authenticated-connector-download`；保持 0.8.6，不提交、合并、推送或发布，不更新 Safari 应用。

## 调查与边界

原按钮为普通下载链接，没有请求结果检查或失败反馈。运行中服务对不带授权的两个下载 URL 均返回 401；这只能证明接口受保护，不能证明用户实际点击同样收到 401，也不能据此判断当前进程是否加载新路由。宿主静态代码检查未找到全局 fetch 授权注入证据，不作该假设。用户点击时的真实请求结果及是否重启 Harness 尚待确认。

采用项目既有备份下载流程：页面内 same-origin fetch → 检查响应 → blob 下载，避免静默导航，并显式呈现失败原因。并未将未证实的授权问题写为确定根因。

## 实现与验证

- Chrome/Edge/Firefox 和 Safari 下载按钮均先请求文件，检查 HTTP 状态、ZIP MIME 与文件头，再创建本地 blob 下载。
- 请求等待上限 30 秒，处理中阻止重复点击；授权失效、404、异常响应及超时显示就地错误。
- 新增回归先失败（原链接缺少点击处理），实现后通过。全量 306 项测试、构建和包检查通过。
- Ego 空间 11 在带合成 HttpOnly 会话 Cookie 校验的隔离服务中点击实际按钮，服务使用真实下载路由，下载完成且 SHA-256 与 Safari ZIP 一致：`1ea168c00a8e25ba16024937558ff6abbff50e04cb7049dbb7da57cac1137c3b`。不是 Desktop 实测。空间与服务均已结束。

## 打包与安装

- `.install/authenticated-download-f4056c7773c2.tgz`，2,140,883 bytes，93 个文件。
- SHA-256：`f4056c7773c206db7e482b5f1cb55cb23955714d8953655f8b61ab2d01c3bda9`。
- web profile 本地 tarball 安装退出 0；93 个安装文件逐字节一致；没有处理无关插件的兼容性警告。
- 未重启 Desktop/Harness/Safari，未更改配对或账号。

## 待验证

用户确认：“我重启完了，然后再重新下载成功了”。真实 Desktop 内 Safari 连接器按钮下载记为用户验收通过；该反馈支持更新加载后下载恢复，不能据此断言此前失败一定由授权导致。

没有重新执行 Safari 新安装、Intel 真机或 Gatekeeper 验收。
