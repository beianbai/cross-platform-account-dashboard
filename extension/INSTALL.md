# 跨平台账号看板 · 浏览器扩展安装

此下载包适用于 Chrome、Edge 和 Firefox。请保留解压后的整个文件夹。

## Chrome / Edge

1. 在 Chrome 打开 `chrome://extensions`，或在 Edge 打开 `edge://extensions`。
2. 打开“开发者模式”，点击“加载已解压的扩展”，选择本包的 `chromium` 文件夹。
3. 确认扩展权限，并将“跨平台账号看板 · 浏览器连接”固定到工具栏。

## Firefox

1. 打开 `about:debugging#/runtime/this-firefox`。
2. 点击“临时载入附加组件”，选择本包 `firefox` 文件夹中的 `manifest.json`。
3. Firefox 重启后需要重新载入该扩展。

## Safari（macOS）

Safari 需要单独的连接器应用，此 ZIP 不能安装到 Safari。请回看板点击“下载 Safari 连接器（macOS）”，解压后按 INSTALL.txt 启用扩展，无需 Xcode。该应用无 Apple 开发者签名、未公证；macOS 可能拦截，Safari 需允许未签名扩展，退出后需再次开启该选项。

## 连接看板

1. 在看板打开“连接浏览器”，点击“生成连接码”。
2. 点击浏览器工具栏中的连接器，粘贴连接码并授权。
3. 在此浏览器登录需要同步的平台，回看板点击同步。

连接码两分钟内有效，请勿分享。一次只连接一个浏览器，重新配对会替换旧连接，已有账号、作品和历史保留。扩展只读取已授权的平台页面，不读取密码或验证码输入内容。
