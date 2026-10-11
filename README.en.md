# Cross-platform Account Dashboard

[简体中文](README.md) · **English**

View account metrics, daily changes, and loaded posts from Xiaohongshu (RED), Douyin, Bilibili, and X in one local dashboard. Connect a browser where you are already signed in, then sync manually or build a history on a schedule.

[Get started](#get-started) · [Browser support](#browser-support) · [Usage guide — 中文](docs/USAGE.md) · [Contribute — 中文](CONTRIBUTING.md)

![The actual light-theme dashboard showing four platform account cards, follower counts, daily changes, and 30-day trends](assets/cover.png)

*Actual interface with synthetic accounts and demo data. Light and dark themes are available. The application interface is currently in Chinese; Chinese labels below help you find its controls.*

## What you can do

| Your question | What the dashboard provides |
| --- | --- |
| How are my accounts doing? | An overview of followers, following, total posts, and likes where the platform provides them |
| What has changed recently? | 7 / 30 / 90-day trends and daily net changes; unknown values and unobserved days stay empty |
| What have I published recently? | Your own posts currently loaded on the page; the loaded list is not treated as the total post count |
| Can I keep a history without syncing manually each time? | Per-platform schedules: once daily or every 1 / 3 / 6 / 12 hours; disabled by default |

Run it on its own or inside DSH Desktop. Each platform currently holds one bound account; unbind it before switching accounts. **The local service (or DSH Desktop) and the connected browser must stay running for syncing.** Sleep and downtime are not recorded or backfilled.

## Get started

### 1. Start the local dashboard

You need **Node.js 22+** and a local copy of the project source. From the project root, run:

```sh
npm install
npm start
```

Startup builds the interface and browser connectors automatically. Open the **full local URL printed in the terminal**. You should see the dashboard, titled “跨平台账号看板”, and an option to add a platform. The first-use URL contains local authorization: do not share it. Its authorization fragment is removed from the address bar after opening.

The default address is `http://127.0.0.1:43120`; use the terminal URL for your first visit. Later, the same browser can open the base address directly. Press `Ctrl+C` to stop the service and scheduled syncing.

<details>
<summary>Use pnpm or install into DSH Desktop</summary>

The project pins pnpm 10.34.5. Alternatively, run:

```sh
pnpm install --frozen-lockfile
pnpm start
```

For DSH, see the [local installation instructions — 中文](docs/USAGE.md#安装到-dsh-desktop). Standalone and DSH modes store data separately and do not automatically share accounts or authorization.

</details>

### 2. Connect your signed-in browser

For Chrome / Edge:

1. Click “连接浏览器” (Connect browser), choose “常用浏览器 · 扩展连接” (Browser extension), then download and extract the local connector.
2. Open `chrome://extensions` or `edge://extensions`, enable Developer mode, and load the extracted `chromium` folder as an unpacked extension.
3. Generate a connection code in the dashboard, paste it into the connector from your browser toolbar, and authorize it. Codes **expire after two minutes and work only once**.

Install the extension and confirm permissions yourself. Sign in to each platform in your own browser. Full instructions, including Firefox setup, are in the [connector guide — 中文](extension/README.md).

### 3. Complete your first sync

Click “添加平台” (Add platform), select a platform, and start reading. If sign-in or a CAPTCHA is required, complete it on the platform page, then click “继续读取” (Continue reading) in the dashboard. The connector checks for tasks about every 30 seconds, so pickup may take a moment.

**Success means an account card and sync time appear in the dashboard.** Open its details to see the metrics and posts collected. Trends accumulate from successful observations. “已提交” (Submitted) in the extension only confirms delivery; use the dashboard's final sync result to confirm that data was saved.

## Browser support

| Browser | Connection and limitations |
| --- | --- |
| Chrome 120+ / current Edge | Load and pair the local Chromium connector |
| Other Chromium browsers | Require MV3, scripting, alarms, and local extensions; not individually verified |
| Firefox 115+ | Temporarily load `firefox/manifest.json`; reload it after restarting Firefox |
| Ego Lite | An optional adapter if already installed; not required |
| Safari / mobile browsers / managed browsers that block local extensions | No collection adapter is available; existing cached data can still be viewed |

Only one extension connection is authorized at a time; pairing again replaces the previous credentials. After updating the dashboard, [update the browser connector too — 中文](extension/README.md#050-更新).

## Data and collection limits

- **Stored locally.** Accounts, history, and authorization stay in a local directory. The standalone service listens only on `127.0.0.1`. See [storage, backups, and port settings — 中文](docs/USAGE.md#数据目录与备份).
- **Read-only page collection.** No passwords or cookies are read, no private platform APIs or CAPTCHA bypasses are used, and no posts, likes, comments, or follows are made. At most 200 loaded posts are saved; full historical coverage is not guaranteed.
- **Metrics keep their meaning.** Rounded values are marked as estimates. Net changes require consecutive calendar days in the same time zone. X's cumulative account likes remain unknown. See [platform-specific counting rules — 中文](docs/USAGE.md#各平台读取范围).
- **Recoverable failures.** Sign-in, verification, or account-identity problems retain the last successful data and pause the affected platform. Hiding a platform does not stop its schedule. Unbinding stops its schedule and keeps a local archive; rebinding the same account can restore it.

## Development and contribution

```sh
pnpm test
pnpm build
pnpm check
pnpm pack
```

- [Contributing — 中文](CONTRIBUTING.md): environment, source layout, and contribution requirements.
- [Add a platform — 中文](docs/PLATFORM-DEVELOPMENT.md): “添加平台 → 自定义平台” (Add platform → Custom platform) generates a development prompt; it does not activate an unimplemented platform.
- [Security — 中文](SECURITY.md) · [Changelog — 中文](CHANGELOG.md) · [MIT license](LICENSE).

The package is currently private for local use, with no npm or marketplace release. The repository URL in `package.json` preserves the DSH installation identity and is not a public download address. See [identity migration before publication — 中文](docs/USAGE.md#开发与发布身份).
