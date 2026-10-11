# 在跨平台账号看板中接入新平台

在当前工作台的“添加平台 → 开发新平台接入”中填写平台、官方域名、个人主页示例及指标，然后复制生成的开发任务交给开发 Agent。该操作只生成任务，不会立即安装或启用新平台。

## 接入位置

- `src/platforms.mjs`：平台 ID、名称、品牌色、指标定义、允许的主页/作品地址和页面范围。
- `src/collector.mjs`：可见页面 DOM 采集与登录/验证/解析错误分类。
- `src/work-traversal.mjs`：分批遍历、检查点、末尾证据与增量边界。新增平台需提供安全的窗口读取和翻页／滚动操作。
- `src/core.mjs`：如新增通用指标或身份规则，在这里实现归一化和校验；不要绕过旧账号身份保护。
- `extension/adapter.mjs`：扩展的页面访问和执行边界；平台域名来自统一定义。
- `scripts/build.mjs`：连接器精确域名权限、构建后的独立脚本和打包文件。
- `tests/`：提供脱敏页面夹具、错误状态和真实归一化输出的测试。

现有框架会复用平台选择、每日历史、同步计划和账号展示。新增指标时需要同步调整历史校验和图表标签，不应静默改变现有指标口径。

## 最小接口

平台定义提供稳定 `id`，`label`，`color`，`metrics: [{key,label,description}]`，主页与作品链接规则。个人主页必须是官方 HTTPS 地址。

采集函数接收 `{page, platform, url}`，通过 `page.goto`、`page.waitForFunction` 和 `page.evaluate` 读取页面，返回：

```js
{
  url: 'https://official.example/creator',
  accountId: 'stable-account-identity',
  name: '账号昵称', avatar: '', bio: '',
  fans: '123', following: '4', workCount: null, likes: null,
  works: [{ url: 'https://official.example/post/123', title: '作品标题', cover: '', kind: '作品' }],
  worksStatus: 'partial',
  scope: '仅当前主页已加载的本人作品'
}
```

上面的 example 域名只说明接口，不能被直接加入运行权限。未知指标返回 null，不填 0；约数保留原文。账号标识缺失时应停止绑定。作品数不能用当前列表长度替代，作品列表不能混入推荐内容或其他作者帖子。

只读取用户已授权平台的可见 DOM；不读取密码、Cookie 或网页内部凭据，不调用私有接口。登录/验证由用户完成。自动同步不能接管用户已有页面；扩展采集使用后台专用标签。

## 分批接口

新采集入口还接收 `collection: {mode, checkpoint, budgetMs}` 和 `onBatch(raw)`。每批最多 100 条，快照附 `collectionProgress: {mode, status, reason, checkpoint, scanned}`；状态为 `running`、`paused`、`complete` 或 `incremental`。必须等待 `onBatch` 确认后再推进；返回的 `known` 仅表示该批作品是否在本轮开始前就已存在。结束时提交空作品批次记录最终状态。不要把一页拆成几批后当作多个增量边界，也不要把置顶或重复未加载窗口计入停止条件。

检查点须关联平台、账号和分类；恢复时验证身份。没有明确末尾证据必须保持未完成，登录失效与验证码要上报对应错误，以暂停计划。保存新平台工作记录时沿用累计合并规则，不能以局部列表替换整个作品库。

## 必需验证

1. 先写并观察失败测试：主页地址、账号身份、未知/零/约数、推荐内容排除、登录过期、验证码与超时。
2. 实现最小适配后，运行 `node --test tests/*.test.mjs`、`node scripts/build.mjs` 和 `node scripts/check-workbench-package.mjs`。
3. 在真实浏览器完成至少一次成功读取、一次错误恢复，核对未覆盖已有账号和历史。
4. 为新增域名更新扩展权限，用户需要在浏览器中确认必要的权限变化。
5. 提升工作台版本，本地打包并安装。检查已安装列表、侧栏入口与真实业务面板；代码测试不能替代宿主加载证据。

开发任务或分享材料不要包含账号快照、浏览器连接码、授权令牌或个人机器的私有路径。无需公开仓库、上传包或市场投稿。
