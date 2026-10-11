// Isolated UI fixture; never shipped or used as an installed workbench.
import React from "react";
import { createRoot } from "react-dom/client";
document.title = "跨平台账号看板 · UI QA";
const params = new URLSearchParams(location.search);
// An explicit preview theme keeps screenshot capture reproducible without changing production defaults.
if (["light", "dark"].includes(params.get("theme"))) localStorage.setItem("psw-theme", params.get("theme"));
const platforms = [
  {
    id: "xiaohongshu",
    label: "小红书",
    color: "#c6484e",
    metrics: ["fans", "following", "workCount", "likes"],
  },
  {
    id: "douyin",
    label: "抖音",
    color: "#343434",
    metrics: ["fans", "following", "workCount", "likes"],
  },
  {
    id: "bilibili",
    label: "哔哩哔哩",
    color: "#2689ab",
    metrics: ["fans", "following", "workCount", "likes"],
  },
  {
    id: "x",
    label: "X",
    color: "#242424",
    metrics: ["fans", "following", "workCount"],
  },
].map((p) => ({
  ...p,
  metrics: p.metrics.map((key) => ({
    key,
    label: {
      fans: "粉丝",
      following: "关注",
      workCount: "作品总数",
      likes: "获赞",
    }[key],
  })),
}));
const day = (n) =>
    new Date(Date.now() + n * 86400000).toISOString().slice(0, 10),
  m = (n) => ({
    value: n,
    display: n.toLocaleString("zh-CN"),
    approximate: false,
  });
const color = ["#c5c3ac", "#9faaa0", "#bcb9a5", "#c3afa3"];
const portrait = (i) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${color[i]}"/><path d="M0 80Q30 20 55 55T100 40V100H0Z" fill="#56614e"/><circle cx="72" cy="25" r="12" fill="#f4e3b3"/><path d="M0 80Q50 40 100 85V100H0" fill="#8a8a62"/></svg>`,
  );
const cover = (i) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360"><rect width="600" height="360" fill="${["#d8d3c1", "#a9b6a7", "#bec1b1"][i % 3]}"/><path d="M0 290 170 100 280 220 400 50 600 220V360H0" fill="${["#7d886a", "#657c67", "#959875"][i % 3]}"/><path d="M0 310 140 230 310 340 480 150 600 240V360H0" fill="#4c614d"/><circle cx="100" cy="60" r="20" fill="#f0dfb2"/></svg>`,
  );
function sample(platform) {
  const i = platforms.findIndex((p) => p.id === platform),
    fans = [12846, 5620, 2381, 864][i];
  return {
    platform,
    url:
      platform === "x"
        ? "https://x.com/lin_ontheroad"
        : platform === "bilibili"
          ? "https://space.bilibili.com/123"
          : platform === "douyin"
            ? "https://www.douyin.com/user/self"
            : "https://www.xiaohongshu.com/user/profile/000000000000000000000001",
    name: ["林间来信", "林间的慢镜头", "林间放映室", "Lin · field notes"][i],
    avatar: portrait(i),
    accountId: ["lin_letters", "lin_film", "lin_studio", "lin_ontheroad"][i],
    bio: "记录沿途的光、山野与日常。",
    fans: m(fans),
    following: m([268, 142, 86, 319][i]),
    workCount: m([126, 48, 32, 218][i]),
    likes: platform === "x" ? null : m([48632, 28416, 12869][i]),
    daily: Array.from({ length: 30 }, (_, n) => ({
      date: day(n - 29),
      at: day(n - 29) + "T01:00:00.000Z",
      timeZone: "Asia/Shanghai",
      fans: m(
        fans -
          (29 - n) * [24, 13, 8, 2][i] -
          Math.round((Math.sin(n) - Math.sin(29)) * 14),
      ),
      following: m([268, 142, 86, 319][i]),
      workCount: m([126, 48, 32, 218][i] - Math.floor((29 - n) / 5)),
      likes:
        platform === "x" ? null : m([48632, 28416, 12869][i] - (29 - n) * 42),
    })).filter((_, n) => n !== 13 && n !== 14),
    works: [
      "周末去山里，找一条没有名字的小路",
      "留住十月傍晚的光",
      "城市之外，一场短暂的出走",
    ].map((title, n) => ({
      id: String(n),
      title,
      kind: platform === "bilibili" ? ["视频", "图文", "音频"][n] : platform === "xiaohongshu" ? "图文" : "视频",
      url: "https://www.xiaohongshu.com/",
      cover: cover(n),
    })),
    ...(platform === "bilibili" ? { coverage: {
      video: { total: m(26), loaded: 1, status: "partial" },
      opus: { total: m(6), loaded: 1, status: "partial" },
      audio: { total: null, loaded: 1, status: "partial" },
    } } : {}),
    worksStatus: "available",
    scope: "当前个人主页已加载的 3 条作品，不代表全部作品。",
    history: [],
    syncedAt: new Date().toISOString(),
  };
}
let state = {
  version: 2,
  accounts: {},
  archives: [],
  platforms,
  settings: { provider: "auto", timeZone: "Asia/Shanghai", platforms: {} },
  sync: { running: false, error: "", platform: null },
  syncByPlatform: {},
  environment: {
    status: params.get("environment") || "missing",
    message: "尚未检测到可用连接。",
    checking: false,
  },
  browserConnection: {
    available: true,
    paired: params.has("connected"),
    online: params.has("connected"),
    label: "Chrome",
  },
};
if (params.has("populated"))
  for (const p of platforms.slice(0, params.has("four") ? 4 : 3)) {
    state.accounts[p.id] = sample(p.id);
    state.settings.platforms[p.id] = {
      visible: true,
      schedule: {
        enabled: p.id === "xiaohongshu",
        kind: "daily",
        time: "09:00",
        hours: 6,
        timeZone: "Asia/Shanghai",
      },
      nextRunAt: day(1) + "T01:00:00Z",
      lastAttemptAt: new Date().toISOString(),
      lastResult: "同步完成",
    };
  }
if (params.has("sparse")) for (const account of Object.values(state.accounts)) account.daily = account.daily.slice(-1);
if (params.has("archive")) state.archives.push({ platform: "bilibili", archivedAt: "2026-10-09T12:00:00Z", account: sample("bilibili") });
if (params.has("login"))
  state.syncByPlatform.douyin = {
    phase: "needs_login",
    platform: "douyin",
    provider: "browser",
    url: "",
    lastResult: "请在原浏览器登录抖音，完成后继续同步。",
  };
window.fetch = async (url, opts) => {
  const path = String(url),
    body = opts?.body ? JSON.parse(opts.body) : {};
  if (path.endsWith("/environment")) {
    state.environment = { status: "ready", message: "Ego Lite 连接检测通过。" };
    return Response.json({ environment: state.environment });
  }
  if (path.endsWith("/browser/pair"))
    return Response.json({
      code: "dsh-social://127.0.0.1:12345#" + "a".repeat(64),
      expiresAt: Date.now() + 120000,
    });
  if (path.endsWith("/browser/revoke")) {
    state.browserConnection.paired = false;
    state.browserConnection.online = false;
    return Response.json({ ok: true });
  }
  if (path.endsWith("/sync") || path.endsWith("/login")) {
    const jobId = "preview-" + Date.now();
    state.syncByPlatform[body.platform] = { jobId, automatic: false, completedAt: null, running: true, phase: "queued", provider: body.provider, platform: body.platform, error: "", lastResult: "等待同步" };
    setTimeout(() => { state.syncByPlatform[body.platform] = { ...state.syncByPlatform[body.platform], phase: "reading", lastResult: "正在读取" }; }, 600);
    setTimeout(() => {
      if (!params.has("syncerror")) {
        state.accounts[body.platform] ||= sample(body.platform);
        state.accounts[body.platform].syncedAt = new Date().toISOString();
      }
      state.syncByPlatform[body.platform] = { ...state.syncByPlatform[body.platform], completedAt: new Date().toISOString(), running: false, phase: params.has("syncerror") ? "network_error" : "complete", error: params.has("syncerror") ? "平台页面暂未响应，请检查浏览器后重试。" : "", lastResult: params.has("syncerror") ? "同步未完成" : "同步完成" };
    }, 2200);
    return Response.json({ started: true });
  }
  if (path.endsWith("/settings")) {
    if (body.provider) state.settings.provider = body.provider;
    if (body.platform) {
      const p = state.settings.platforms[body.platform] || {
        visible: true,
        schedule: {
          enabled: false,
          kind: "daily",
          time: "09:00",
          hours: 6,
          timeZone: "Asia/Shanghai",
        },
      };
      state.settings.platforms[body.platform] = {
        ...p,
        ...("visible" in body ? { visible: body.visible } : {}),
        ...(body.schedule ? { schedule: body.schedule } : {}),
      };
    }
    return Response.json({ ok: true });
  }
  if (path.endsWith("/unbind")) {
    state.archives.push({ platform: body.platform, archivedAt: new Date().toISOString(), account: state.accounts[body.platform] });
    delete state.accounts[body.platform];
    return Response.json({ ok: true });
  }
  if (params.has("failure"))
    return Response.json(
      { error: "本地服务暂时不可用，请稍后重试。" },
      { status: 503 },
    );
  return Response.json(state);
};
window.__ModuleLoader__ = {
  load(module) {
    const client = module.factory((name) => {
      if (name === "react") return React;
      throw Error(name);
    });
    client.apply({
      effect(fn) {
        fn();
      },
      desktopWorkbenches: {
        register(options, Panel) {
          createRoot(document.getElementById("root")).render(<Panel />);
          return () => {};
        },
      },
    });
  },
};
const script = document.createElement("script");
script.src = "../lib/client.js";
document.body.append(script);
