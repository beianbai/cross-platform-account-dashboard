import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
const code = await readFile(
  new URL("../src/client.js", import.meta.url),
  "utf8",
);
const value = (n) => ({ value: n, display: String(n), approximate: false });
const day = (n) =>
  new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
function fixture({ paired = false, hidden = false, phase = null, syncFailure = false, syncGate = null, storedTheme = null, requestFailures = {}, empty = false, storedGuide = null, storageUnavailable = false, initialLoading = false } = {}) {
  const account = {
    platform: "douyin",
    name: "林间的慢镜头",
    url: "https://www.douyin.com/user/self",
    accountId: "lin_film",
    history: [],
    daily: [
      {
        date: day(-3),
        at: day(-3) + "T01:00Z",
        timeZone: "UTC",
        fans: value(100),
      },
      {
        date: day(-1),
        at: day(-1) + "T01:00Z",
        timeZone: "UTC",
        fans: value(120),
      },
      {
        date: day(0),
        at: day(0) + "T01:00Z",
        timeZone: "UTC",
        fans: value(123),
      },
    ],
    fans: value(123),
    works: [],
    scope: "当前个人主页作品",
    syncedAt: new Date().toISOString(),
  };
  let state = {
    version: 2,
    accounts: empty ? {} : { douyin: account },
    archives: [],
    platforms: [
      {
        id: "douyin",
        label: "抖音",
        metrics: [
          { key: "fans", label: "粉丝" },
          { key: "workCount", label: "作品", description: "主页作品总数" },
        ],
      },
      { id: "x", label: "X", metrics: [{ key: "fans", label: "粉丝" }] },
    ],
    settings: {
      provider: "auto",
      timeZone: "UTC",
      platforms: {
        douyin: {
          visible: !hidden,
          schedule: {
            enabled: false,
            kind: "daily",
            time: "09:00",
            hours: 6,
            timeZone: "UTC",
          },
        },
      },
    },
    sync: { running: false },
    syncByPlatform: phase
      ? {
          douyin: {
            phase,
            platform: "douyin",
            provider: "browser",
            url: "https://www.douyin.com/user/lin_film",
            lastResult: "请完成登录",
          },
        }
      : {},
    environment: { status: "missing", message: "尚未检测到连接" },
    browserConnection: {
      available: true,
      paired,
      online: paired,
      label: "Chrome",
    },
  };
  const hooks = new Map([["Panel", [initialLoading ? null : state]]]),
    calls = [];
  let current = "Panel",
    cursor = 0,
    Panel, poll;
  let now = 0, timerId = 0, selection = "";
  const timers = new Map(), effects = new Map(), queuedEffects = [], storage = new Map(storedTheme ? [["psw-theme", storedTheme]] : []), listeners = new Map();
  if (storedGuide !== null) storage.set("psw-onboarding-v1", storedGuide);
  const React = {
    Fragment: "fragment",
    createElement: (type, props, ...children) => ({
      type,
      props: { ...props, children: children.flat(Infinity) },
      children: children.flat(Infinity),
    }),
    useState(initial) {
      const a = hooks.get(current) || [];
      hooks.set(current, a);
      const i = cursor++;
      if (!(i in a)) a[i] = typeof initial === "function" ? initial() : initial;
      return [
        a[i],
        (v) => {
          a[i] = typeof v === "function" ? v(a[i]) : v;
        },
      ];
    },
    useRef(initial) {
      const a = hooks.get(current) || [];
      hooks.set(current, a);
      const i = cursor++;
      if (!(i in a)) a[i] = { current: initial };
      return a[i];
    },
    useCallback: (fn) => (poll = fn),
    useEffect(fn, deps) {
      if (!current.endsWith(":SuccessNotice") && !current.endsWith(":Select")) return;
      const key = current + ":effect:" + cursor++, previous = effects.get(key);
      if (!previous || deps.some((d, i) => d !== previous.deps[i])) {
        queuedEffects.push(() => { previous?.cleanup?.(); effects.set(key, { deps, cleanup: fn() }); });
      }
    },
  };
  vm.runInNewContext(code, {
    Date: class extends Date { static now() { return now; } },
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    window: {
      localStorage: { getItem: key => { if (storageUnavailable) throw Error("storage unavailable"); return storage.get(key); }, setItem: (key, value) => { if (storageUnavailable) throw Error("storage unavailable"); storage.set(key, value); } },
      getSelection: () => ({ toString: () => selection }),
      innerHeight: 800,
      __ModuleLoader__: {
        load(module) {
          module
            .factory(() => React)
            .apply({
              effect: (fn) => fn(),
              desktopWorkbenches: {
                register(options, p) {
                  assert.equal(options.customFrame, true);
                  Panel = p;
                },
              },
            });
        },
      },
    },
    URL,
    document: { baseURI: "http://localhost/", addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) },
    requestAnimationFrame: (fn) => fn(),
    navigator: { clipboard: { writeText: async () => {} } },
    fetch: async (path, options) => {
      const body = options?.body ? JSON.parse(options.body) : null;
      calls.push({ path, body });
      const failure = Object.entries(requestFailures).find(([endpoint]) => path.endsWith("/" + endpoint));
      if (failure) return { ok: false, json: async () => ({ error: failure[1] }) };
      if (syncGate && path.endsWith("/sync")) await syncGate;
      if (syncFailure && path.endsWith("/sync")) return { ok: false, json: async () => ({ error: "浏览器连接已离线，请检查后重试。" }) };
      if (path.endsWith("/settings")) {
        if (body.provider) state.settings.provider = body.provider;
        if (body.platform)
          state.settings.platforms[body.platform] = {
            ...state.settings.platforms[body.platform],
            ...body,
          };
      }
      if (path.endsWith("/unbind")) {
        state.archives.push(state.accounts[body.platform]);
        delete state.accounts[body.platform];
      }
      return {
        ok: true,
        json: async () =>
          path.endsWith("/browser/pair")
            ? { code: "test-connection-code", expiresAt: Date.now() + 120000 }
            : state,
      };
    },
  });
  function expand(node, path = "Panel") {
    if (!node || typeof node !== "object") return node;
    if (typeof node.type === "function") {
      current = path + ":" + node.type.name;
      cursor = 0;
      return expand(node.type(node.props), current);
    }
    return {
      ...node,
      children: node.children.map((n, i) =>
        expand(n, path + "/" + (n?.props?.key || i)),
      ),
    };
  }
  return {
    calls,
    storage,
    listeners,
    selectText(value) { selection = value; },
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const next = [...timers].filter(([, t]) => t.at <= end).sort((a,b) => a[1].at - b[1].at)[0];
        if (!next) break;
        now = next[1].at; timers.delete(next[0]); next[1].fn();
      }
      now = end;
    },
    hooks,
    poll: () => poll(),
    get state() {
      return state;
    },
    render() {
      current = "Panel";
      cursor = 0;
      const tree = expand(Panel());
      while (queuedEffects.length) queuedEffects.shift()();
      return tree;
    },
  };
}
const nodes = (tree) =>
  !tree || typeof tree !== "object"
    ? []
    : [tree, ...tree.children.flatMap(nodes)];
const text = (node) =>
  typeof node === "string" || typeof node === "number"
    ? String(node)
    : node && typeof node === "object"
      ? node.type === "style" ? "" : node.children.map(text).join("")
      : "";
const button = (tree, label) =>
  nodes(tree).find(
    (n) =>
      n.type === "button" &&
      (text(n) === label || n.props["aria-label"] === label),
  );
function field(tree, label) {
  const l = nodes(tree).find(
    (n) => n.type === "label" && text(n).startsWith(label),
  );
  assert(l, `missing field ${label}`);
  return nodes(l).find((n) => ["input", "select", "textarea"].includes(n.type));
}
test("overview renders only bound visible accounts and cached detail remains usable offline", () => {
  const app = fixture(),
    tree = app.render();
  assert.match(text(tree), /林间的慢镜头/);
  assert(!nodes(tree).some((n) => n.props["aria-label"] === "X账号"));
  assert.equal(button(tree, "查看详情").props.disabled, false);
  button(tree, "查看详情").props.onClick();
  const detail = app.render();
  assert.match(text(detail), /粉丝趋势/);
  assert(button(detail, "7 天"));
  assert(button(detail, "90 天"));
  assert(!button(detail, "解除绑定"));
  const hidden = fixture({ hidden: true });
  assert.match(text(hidden.render()), /账号已在首页隐藏/);
  assert(
    !nodes(hidden.render()).some((n) => n.props["aria-label"] === "抖音账号"),
  );
});
test("add menu includes unbound metadata platforms and does not create a binding on cancel", () => {
  const app = fixture();
  button(app.render(), "添加平台").props.onClick();
  let tree = app.render();
  assert(nodes(tree).some((n) => n.props.role === "dialog"));
  assert(button(tree, "X"));
  button(tree, "X").props.onClick();
  tree = app.render();
  assert(button(tree, "读取并绑定"));
  button(tree, "关闭").props.onClick();
  assert.deepEqual(Object.keys(app.state.accounts), ["douyin"]);
  assert.equal(app.calls.length, 0);
});
test("resume preserves original provider and exact platform URL", async () => {
  const app = fixture({ paired: true, phase: "needs_login" });
  assert(button(app.render(), "前往登录"));
  await button(app.render(), "继续同步").props.onClick();
  assert.deepEqual(app.calls.find((c) => c.path.endsWith("/sync")).body, {
    platform: "douyin",
    provider: "browser",
    url: "https://www.douyin.com/user/lin_film",
    resume: true,
  });
});
test("settings separates hidden account from disabled plan and persists daily schedule", async () => {
  const app = fixture();
  button(app.render(), "设置").props.onClick();
  let tree = app.render();
  assert.match(text(tree), /隐藏不影响自动同步/);
  assert.match(text(tree), /可能打开浏览器任务窗口/);
  assert.equal(field(tree, "自动同步").props.checked, false);
  assert.equal(field(tree, "时间").props.value, "09:00");
  field(tree, "自动同步").props.onChange({ target: { checked: true } });
  tree = app.render();
  await button(tree, "保存计划").props.onClick();
  const saved = app.calls.find((c) => c.body?.schedule);
  assert.equal(saved.body.schedule.enabled, true);
  assert.equal(saved.body.schedule.timeZone, "UTC");
  tree = app.render();
  await field(tree, "在首页展示").props.onChange({
    target: { checked: false },
  });
  assert.equal(app.state.settings.platforms.douyin.visible, false);
  assert.equal(app.state.settings.platforms.douyin.schedule.enabled, true);
});
test("unbind is confirmed and archive remains visible in settings", async () => {
  const app = fixture();
  button(app.render(), "设置").props.onClick();
  button(app.render(), "解除绑定").props.onClick();
  assert.match(text(app.render()), /保留为只读档案/);
  assert(!text(app.render()).includes("删除本工作台"));
  await button(app.render(), "确认解除").props.onClick();
  assert.equal(app.state.archives.length, 1);
  assert.match(text(app.render()), /历史档案/);
});
test("chart does not bridge missing dates and provides keyboard values, raw time zones, and adjacent-day deltas", () => {
  const app = fixture({ paired: true });
  button(app.render(), "查看详情").props.onClick();
  const tree = app.render(),
    svg = nodes(tree).find(
      (n) => n.type === "svg" && n.props.className === "psw-chart",
    ),
    path = nodes(svg).find((n) => n.type === "path");
  assert.equal((path.props.d.match(/M/g) || []).length, 2);
  assert.equal((path.props.d.match(/L/g) || []).length, 1);
  assert(nodes(svg).some((n) => n.type === "circle" && n.props.tabIndex === 0));
  assert.match(text(tree), /UTC/);
  const rows = nodes(tree).filter((n) => n.type === "tr");
  assert(rows.some((n) => text(n).includes("+3")));
  assert(!rows.some((n) => text(n).includes("+20")));
});
test("latest sample for a date drives chart; table retains records from both time zones", () => {
  const app = fixture({ paired: true });
  app.state.accounts.douyin.daily.push({
    date: day(0),
    at: day(0) + "T22:00Z",
    timeZone: "Asia/Shanghai",
    fans: value(999),
  });
  button(app.render(), "查看详情").props.onClick();
  const tree = app.render();
  const summary = nodes(tree).find(
    (n) => n.props.className === "psw-chart-summary",
  );
  assert.match(text(summary), /999/);
  assert.match(text(tree), /Asia\/Shanghai/);
  assert.match(text(tree), /UTC/);
});
test("developer prompt is project specific and strips query/hash from provided example", () => {
  const app = fixture();
  button(app.render(), "添加平台").props.onClick();
  button(app.render(), "开发新平台接入生成项目专属开发任务").props.onClick();
  let tree = app.render();
  for (const [label, value] of [
    ["平台名称", "新平台"],
    ["官方域名", "example.com"],
    ["个人主页链接示例", "https://example.com/user/me?token=secret#private"],
  ]) {
    field(tree, label).props.onChange({ target: { value } });
    tree = app.render();
  }
  nodes(tree)
    .find((n) => n.type === "form")
    .props.onSubmit({ preventDefault() {} });
  tree = app.render();
  const prompt = field(tree, "开发任务").props.value;
  assert.match(prompt, /src\/platforms.mjs/);
  assert.match(prompt, /dsh-workbench-personal-social-local/);
  assert(!prompt.includes("token=secret"));
  assert(!prompt.includes("#private"));
  assert(!prompt.includes("/Users/"));
  assert.equal(app.calls.length, 0);
});

test("daily net-change bars omit missing and cross-timezone comparisons and mark estimates", () => {
  const app = fixture({ paired: true });
  app.state.accounts.douyin.daily.at(-1).fans = value(115);
  app.state.accounts.douyin.daily.at(-2).fans.approximate = true;
  button(app.render(), "查看详情").props.onClick();
  let tree = app.render(),
    bars = nodes(tree).find((n) => n.props.className === "psw-delta-chart");
  const points = nodes(bars).filter((n) => n.type === "rect");
  assert.equal(points.length, 1);
  assert.match(points[0].props["aria-label"], /约 -5 · 估算/);
  assert.equal(points[0].props.tabIndex, 0);
  points[0].props.onKeyDown({ key: "Enter", preventDefault() {} });
  assert.match(text(app.render()), /约 -5 · 估算/);
  app.state.accounts.douyin.daily.at(-1).timeZone = "Asia/Shanghai";
  tree = app.render();
  bars = nodes(tree).find((n) => n.props.className === "psw-delta-chart");
  assert.equal(nodes(bars).filter((n) => n.type === "rect").length, 0);
});

test("workbench header is first and dialog is a scoped overlay with Escape dismissal", () => {
  const app = fixture(),
    initial = app.render();
  assert.equal(initial.children[0].type, "header");
  button(initial, "添加平台").props.onClick();
  const tree = app.render(),
    overlay = nodes(tree).find(
      (n) => n.props.className === "psw-modal-overlay",
    );
  assert(overlay);
  const dialog = nodes(overlay).find((n) => n.props.role === "dialog");
  assert.equal(dialog.type, "div");
  assert(!nodes(tree).some((n) => n.type === "dialog"));
  let prevented = false;
  dialog.props.onKeyDown({
    key: "Escape",
    preventDefault() {
      prevented = true;
    },
    stopPropagation() {},
  });
  assert(prevented);
  assert(!nodes(app.render()).some((n) => n.props.role === "dialog"));
});

test("browser connection has a stable accessible name and visible icon when its text collapses", () => {
  for (const paired of [false, true]) {
    const app = fixture({ paired }),
      tree = app.render(),
      control = button(tree, "浏览器连接");
    assert(control);
    assert.equal(control.props["aria-label"], "浏览器连接");
    assert.match(control.props.title, /连接/);
    assert(nodes(control).some((n) => n.type === "svg"));
    control.props.onClick();
    assert(
      nodes(app.render()).some(
        (n) =>
          n.props.role === "dialog" && n.props["aria-label"] === "浏览器连接",
      ),
    );
  }
});

test("detail metric and date range are restored per account after returning to overview", () => {
  const app = fixture({ paired: true });
  app.state.platforms[0].metrics.push({ key: "likes", label: "获赞" });
  app.state.accounts.douyin.likes = value(9);
  app.state.accounts.x = {
    ...app.state.accounts.douyin,
    platform: "x",
    name: "林间笔记",
  };
  const open = (id) =>
    button(
      nodes(app.render()).find(
        (n) =>
          n.props["aria-label"] === (id === "douyin" ? "抖音" : "X") + "账号",
      ),
      "查看详情",
    ).props.onClick();
  open("douyin");
  button(app.render(), "获赞9").props.onClick();
  button(app.render(), "7 天").props.onClick();
  button(app.render(), "全部账号").props.onClick();
  open("x");
  assert.equal(button(app.render(), "30 天").props["aria-pressed"], true);
  assert.equal(button(app.render(), "粉丝123").props["aria-pressed"], true);
  button(app.render(), "全部账号").props.onClick();
  open("douyin");
  assert.equal(button(app.render(), "获赞9").props["aria-pressed"], true);
  assert.equal(button(app.render(), "7 天").props["aria-pressed"], true);
  assert.match(text(app.render()), /获赞趋势/);
});

function openDeveloper(app) {
  button(app.render(), "添加平台").props.onClick();
  button(app.render(), "开发新平台接入生成项目专属开发任务").props.onClick();
}
function fillDeveloper(app, domain, url) {
  for (const [label, value] of [["平台名称", "新平台"], ["官方域名", domain], ["个人主页链接示例", url]])
    field(app.render(), label).props.onChange({ target: { value } });
  nodes(app.render()).find(n => n.type === "form").props.onSubmit({ preventDefault() {} });
}
test("developer accepts HTTPS official website and normalizes hostname", () => {
  const app = fixture(); openDeveloper(app);
  fillDeveloper(app, "https://EXAMPLE.com/about?ref=home", "https://creator.example.com/user/me?secret=yes");
  const prompt = field(app.render(), "开发任务").props.value;
  assert.match(prompt, /官方域名：example.com/);
  assert(!prompt.includes("secret=yes"));
});
test("developer rejects deceptive hosts and credentials with field-specific errors cleared on edit", () => {
  for (const [domain, url, invalid] of [
    ["example.com", "https://example.com.evil.test/user/me", "个人主页链接示例"],
    ["https://user@example.com", "https://example.com/me", "官方域名"],
    ["http://example.com", "https://example.com/me", "官方域名"],
    ["example.com", "https://user:pass@example.com/me", "个人主页链接示例"],
  ]) {
    const app = fixture(); openDeveloper(app); fillDeveloper(app, domain, url);
    const input = field(app.render(), invalid);
    assert.equal(input.props["aria-invalid"], true);
    assert(input.props["aria-describedby"]);
    input.props.onChange({ target: { value: "example.com" } });
    assert(!field(app.render(), invalid).props["aria-invalid"]);
  }
});
test("manual sync reports queued immediately, only notifies after observed completion, once", async () => {
  const app = fixture({ paired: true });
  await button(app.render(), "同步抖音").props.onClick();
  assert.match(text(app.render()), /等待同步|排队/);
  assert(!text(app.render()).includes("抖音同步成功"));
  app.state.syncByPlatform.douyin = { phase: "complete", jobId: "manual-1", completedAt: new Date().toISOString(), automatic: false };
  await app.poll();
  assert.match(text(app.render()), /抖音同步成功/);
  assert.match(text(app.render()), /数据无变化/);
  button(app.render(), "关闭通知").props.onClick();
  await app.poll();
  assert(!text(app.render()).includes("抖音同步成功"));
  app.state.syncByPlatform.douyin = { phase: "complete", jobId: "scheduled-1", automatic: true };
  await app.poll();
  assert(!text(app.render()).includes("同步成功"));
});
test("timezone picker searches Chinese cities and saves IANA timezone", async () => {
  const app = fixture(); button(app.render(), "设置").props.onClick();
  const zone = field(app.render(), "计划时区");
  assert.equal(zone.props.role, "combobox");
  zone.props.onChange({ target: { value: "纽约" } });
  let tree = app.render();
  const option = nodes(tree).find(n => n.props.role === "option" && text(n).includes("纽约"));
  assert(option); assert.match(text(option), /UTC/);
  option.props.onClick();
  await button(app.render(), "保存计划").props.onClick();
  assert.equal(app.calls.find(c => c.body?.schedule).body.schedule.timeZone, "America/New_York");
});
test("archive rows identify platform, account and archived date", () => {
  const app = fixture();
  app.state.archives.push({ platform: "douyin", account: app.state.accounts.douyin, archivedAt: "2026-10-09T12:00:00Z" });
  button(app.render(), "设置").props.onClick();
  const archive = nodes(app.render()).find(n => n.props.className === "psw-archive-row");
  assert(archive); assert.match(text(archive), /抖音/); assert.match(text(archive), /林间的慢镜头/); assert.match(text(archive), /10.09/);
  assert(nodes(archive).some(n => n.props.className === "psw-logo psw-douyin"));
});
test("sparse card history uses accumulation state without an isolated chart point", () => {
  const app = fixture(); app.state.accounts.douyin.daily = app.state.accounts.douyin.daily.slice(-1);
  const tree = app.render();
  assert.match(text(tree), /已记录 1 天/);
  assert(!nodes(tree).some(n => n.props.className === "psw-spark"));
  assert(!text(tree).includes("等待更多日记录"));
  assert(!text(tree).includes("每日同步，逐步形成趋势"));
});

test("Bilibili coverage distinguishes platform totals from read works and filters content kinds", () => {
  const app = fixture();
  app.state.platforms[0] = { id: "bilibili", label: "哔哩哔哩", metrics: [{ key: "fans", label: "粉丝" }] };
  app.state.accounts.bilibili = { ...app.state.accounts.douyin, platform: "bilibili", coverage: { video: { total: value(12), loaded: 1, status: "partial" }, opus: { total: value(3), loaded: 1, status: "partial" }, audio: { total: null, loaded: 0, status: "unavailable", reason: "network_error" } }, works: [{ id: "v1", kind: "视频", title: "视频标题" }, { id: "o1", kind: "图文", title: "图文标题" }] };
  delete app.state.accounts.douyin;
  button(app.render(), "查看详情").props.onClick();
  const tree = app.render();
  assert.match(text(tree), /平台总量 12/); assert.match(text(tree), /已读 1/); assert.match(text(tree), /音频.*网络/);
  button(tree, "图文").props.onClick();
  assert.match(text(app.render()), /图文标题/); assert(!text(app.render()).includes("视频标题"));
});

test("sync submission failure remains visible inside the add dialog and preserves cached values", async () => {
  const app = fixture({ syncFailure: true });
  button(app.render(), "添加平台").props.onClick(); button(app.render(), "X").props.onClick();
  await button(app.render(), "读取并绑定").props.onClick();
  const dialog = nodes(app.render()).find(n => n.props.role === "dialog");
  assert(dialog); assert.match(text(dialog), /浏览器连接已离线/);
  assert(!nodes(dialog).some(n => n.props.role === "status" && text(n).includes("同步成功")));
  assert.equal(app.state.accounts.douyin.fans.value, 123);
});
test("manual observed failure is actionable and never emits a success notice", async () => {
  const app = fixture({ paired: true });
  await button(app.render(), "同步抖音").props.onClick();
  app.state.syncByPlatform.douyin = { phase: "network_error", jobId: "failed-1", automatic: false, error: "网络暂时不可用" };
  await app.poll();
  assert.match(text(app.render()), /网络暂时不可用/); assert(button(app.render(), "重试"));
  assert(!text(app.render()).includes("同步成功")); assert.equal(app.state.accounts.douyin.fans.value, 123);
});
test("timezone picker retains an existing valid IANA zone and does not save unselected search text", async () => {
  const app = fixture(); app.state.settings.platforms.douyin.schedule.timeZone = "Pacific/Chatham";
  button(app.render(), "设置").props.onClick();
  assert.match(field(app.render(), "计划时区").props.value, /Pacific\/Chatham/);
  field(app.render(), "计划时区").props.onChange({ target: { value: "不存在的城市" } });
  assert.match(text(app.render()), /未找到时区/);
  assert.equal(button(app.render(), "保存计划").props.disabled, true);
});

test("opening a login recovery also tracks the final manual outcome", async () => {
  const app = fixture({ paired: true, phase: "needs_login" });
  await button(app.render(), "前往登录").props.onClick();
  const request = app.calls.find(c => c.path.endsWith("/login"));
  assert(request); assert.equal(request.body.provider, "browser");
  app.state.syncByPlatform.douyin = { phase: "complete", jobId: "login-recovered", automatic: false };
  await app.poll();
  assert.match(text(app.render()), /抖音同步成功/);
});

test("detail sync immediately announces a queued busy state while POST is still pending", async () => {
  let release;
  const syncGate = new Promise(resolve => { release = resolve; });
  const app = fixture({ paired: true, syncGate });
  button(app.render(), "查看详情").props.onClick();
  const request = button(app.render(), "同步账号").props.onClick();
  try {
    const control = button(app.render(), "排队中");
    assert(control, "slow POST must immediately show the queued phase");
    assert.equal(control.props["aria-busy"], true);
    assert.equal(control.props.disabled, true);
    assert(!text(app.render()).includes("同步成功"));
  } finally { release(); await request; }
});
test("non-ready connection checks show actionable errors instead of green success notices", async () => {
  const app = fixture();
  button(app.render(), "浏览器连接").props.onClick();
  await button(app.render(), "检测连接").props.onClick();
  const dialog = nodes(app.render()).find(n => n.props.role === "dialog");
  assert(nodes(dialog).some(n => n.props.role === "alert" && text(n).includes("尚未检测到连接")));
  assert(!nodes(dialog).some(n => n.props.role === "status" && text(n).includes("尚未检测到连接")));
});


test("default Light and sun/moon preference persist across remounts", () => {
  const app = fixture();
  assert.equal(app.render().props["data-theme"], "light");
  button(app.render(), "切换为深色").props.onClick();
  assert.equal(app.render().props["data-theme"], "dark");
  assert.equal(app.storage.get("psw-theme"), "dark");
  const restored = fixture({ storedTheme: app.storage.get("psw-theme") });
  assert.equal(restored.render().props["data-theme"], "dark");
  button(restored.render(), "切换为浅色").props.onClick();
  assert.equal(restored.storage.get("psw-theme"), "light");
});
test("account card routes from its body and keyboard while controls and selected text remain independent", async () => {
  const app = fixture();
  let card = nodes(app.render()).find(n => n.type === "article");
  assert.equal(card.props.tabIndex, 0);
  app.selectText("林间");
  card.props.onClick({ target: { closest: () => null } });
  assert(!text(app.render()).includes("粉丝趋势"));
  app.selectText("");
  card.props.onClick({ target: { closest: () => ({}) } });
  assert(!text(app.render()).includes("粉丝趋势"));
  card.props.onClick({ target: { closest: () => null } });
  assert.match(text(app.render()), /粉丝趋势/);
  button(app.render(), "全部账号").props.onClick();
  card = nodes(app.render()).find(n => n.type === "article");
  let stopped = false;
  await button(card, "同步抖音").props.onClick({ stopPropagation() { stopped = true; } });
  assert(stopped); assert(!text(app.render()).includes("粉丝趋势"));
  card.props.onKeyDown({ key: "Enter", target: card, currentTarget: card, preventDefault() {} });
  assert.match(text(app.render()), /粉丝趋势/);
});
test("success expires in four seconds and pointer/focus pauses are independent", async () => {
  const app = fixture({ paired: true });
  await button(app.render(), "同步抖音").props.onClick();
  app.state.syncByPlatform.douyin = { phase: "complete", jobId: "notice-1", automatic: false };
  await app.poll();
  const notice = nodes(app.render()).find(n => n.props.className?.includes("psw-result"));
  app.advance(1500);
  notice.props.onPointerEnter();
  notice.props.onFocus();
  app.advance(10000); assert.match(text(app.render()), /抖音同步成功/);
  notice.props.onPointerLeave();
  app.advance(10000); assert.match(text(app.render()), /抖音同步成功/);
  notice.props.onBlur({ currentTarget: { contains: () => false }, relatedTarget: null });
  app.advance(2499); assert.match(text(app.render()), /抖音同步成功/);
  app.advance(1); assert(!text(app.render()).includes("抖音同步成功"));
});
test("sync errors remain beside their account and disappear after successful retry", async () => {
  const app = fixture({ paired: true });
  await button(app.render(), "同步抖音").props.onClick();
  app.state.syncByPlatform.douyin = { phase: "network_error", error: "暂时断网", jobId: "error-1" };
  await app.poll();
  let tree = app.render();
  assert.match(text(nodes(tree).find(n => n.type === "article")), /暂时断网/);
  app.advance(10000); assert.match(text(app.render()), /暂时断网/);
  await button(tree, "重试").props.onClick();
  app.state.syncByPlatform.douyin = { phase: "complete", jobId: "recovered-1", automatic: false };
  await app.poll();
  assert(!text(app.render()).includes("暂时断网"));
});
test("provider Select supports full keyboard navigation, Escape and outside dismissal", async () => {
  const app = fixture(); button(app.render(), "设置").props.onClick();
  const getSelect = () => nodes(app.render()).find(n => n.props.role === "combobox" && n.props["aria-label"] === "采集通路");
  assert(!nodes(app.render()).some(n => n.type === "select"));
  const key = async (name) => getSelect().props.onKeyDown({ key: name, preventDefault() {}, stopPropagation() {} });
  await key("ArrowDown"); assert.equal(getSelect().props["aria-expanded"], true);
  await key("End"); await key("Enter");
  assert.equal(app.state.settings.provider, "ego");
  assert.equal(getSelect().props["aria-expanded"], false);
  await key("ArrowUp"); await key("Home"); await key("Enter");
  assert.equal(app.state.settings.provider, "auto");
  await key("ArrowDown"); await key("Escape");
  assert.equal(getSelect().props["aria-expanded"], false);
  getSelect().props.onClick(); app.render();
  app.listeners.get("pointerdown")({ target: {} });
  assert.equal(getSelect().props["aria-expanded"], false);
});


test("Select opens above near the container edge and keeps a bounded menu", () => {
  const app = fixture(); button(app.render(), "设置").props.onClick();
  let tree = app.render();
  const root = nodes(tree).find(n => n.props.className === "psw-select");
  root.props.ref.current = {
    getBoundingClientRect: () => ({ top: 680, bottom: 724 }),
    closest: () => ({ getBoundingClientRect: () => ({ top: 0, bottom: 740 }) }),
    querySelector: () => null,
  };
  const control = nodes(root).find(n => n.props.role === "combobox");
  control.props.onClick();
  const menu = nodes(app.render()).find(n => n.props.role === "listbox" && n.props["aria-label"] === "采集通路");
  assert.equal(menu.props.style.top, "auto");
  assert.equal(menu.props.style.bottom, "calc(100% + 6px)");
  assert(menu.props.style.maxHeight <= 264);
});
test("schedule choices share Select and save interval changes", async () => {
  const app = fixture(); button(app.render(), "设置").props.onClick();
  let control = nodes(app.render()).find(n => n.props.role === "combobox" && n.props["aria-label"] === "同步频率");
  control.props.onClick();
  await nodes(app.render()).find(n => n.props.role === "option" && text(n).includes("固定间隔")).props.onClick();
  control = nodes(app.render()).find(n => n.props.role === "combobox" && n.props["aria-label"] === "间隔");
  control.props.onClick();
  await nodes(app.render()).find(n => n.props.role === "option" && text(n).includes("每 12 小时")).props.onClick();
  await button(app.render(), "保存计划").props.onClick();
  const schedule = app.calls.find(c => c.body?.schedule).body.schedule;
  assert.equal(schedule.kind, "interval");
  assert.equal(schedule.hours, 12);
});
test("a submission failure is attached to the bound card, with no global duplicate", async () => {
  const app = fixture({ syncFailure: true });
  await button(app.render(), "同步抖音").props.onClick();
  const tree = app.render();
  const card = nodes(tree).find(n => n.type === "article");
  assert.match(text(card), /浏览器连接已离线/);
  assert.equal((text(tree).match(/浏览器连接已离线/g) || []).length, 1);
});


test("failed unbind stays visible in its dialog with the original confirmation action", async () => {
  const requestFailures = { unbind: "本地记录暂时无法写入" }, app = fixture({ requestFailures });
  button(app.render(), "设置").props.onClick();
  button(app.render(), "解除绑定").props.onClick();
  await button(app.render(), "确认解除").props.onClick();
  const dialog = nodes(app.render()).find(n => n.props.role === "dialog");
  assert(dialog);
  assert(nodes(dialog).some(n => n.props.role === "alert" && /解除绑定未完成.*本地记录暂时无法写入/.test(text(n))));
  assert(!text(dialog).includes("同步未完成"));
  assert(!button(dialog, "重试"));
  assert(app.state.accounts.douyin);
  delete requestFailures.unbind;
  await button(dialog, "确认解除").props.onClick();
  assert(!nodes(app.render()).some(n => n.props.role === "dialog"));
  assert(!app.state.accounts.douyin);
  assert(!text(app.render()).includes("本地记录暂时无法写入"));
});
test("failed schedule save describes settings, preserves draft, and retries the save", async () => {
  const requestFailures = { settings: "暂时无法保存" }, app = fixture({ requestFailures });
  button(app.render(), "设置").props.onClick();
  field(app.render(), "自动同步").props.onChange({ target: { checked: true } });
  await button(app.render(), "保存计划").props.onClick();
  let tree = app.render();
  const account = nodes(tree).find(n => n.props.className === "psw-platformsetting");
  assert(nodes(account).some(n => n.props.role === "alert" && /设置未保存.*暂时无法保存/.test(text(n))));
  assert(!text(account).includes("同步未完成"));
  assert(!button(account, "重试"));
  assert.equal(field(tree, "自动同步").props.checked, true);
  assert.equal(button(tree, "保存计划").props.disabled, false);
  delete requestFailures.settings;
  await button(tree, "保存计划").props.onClick();
  tree = app.render();
  assert.equal(app.state.settings.platforms.douyin.schedule.enabled, true);
  assert(!text(tree).includes("暂时无法保存"));
});
test("Select consumes Escape only while expanded so a collapsed control can dismiss its dialog", () => {
  const app = fixture(); button(app.render(), "浏览器连接").props.onClick();
  const getControl = () => nodes(app.render()).find(n => n.props.role === "combobox" && n.props["aria-label"] === "采集通路");
  const escape = () => {
    let stopped = false;
    const event = { key: "Escape", preventDefault() {}, stopPropagation() { stopped = true; } };
    getControl().props.onKeyDown(event);
    const consumedBySelect = stopped;
    if (!stopped) nodes(app.render()).find(n => n.props.role === "dialog").props.onKeyDown(event);
    return consumedBySelect;
  };
  getControl().props.onClick();
  assert.equal(escape(), true);
  assert(nodes(app.render()).some(n => n.props.role === "dialog"));
  assert.equal(getControl().props["aria-expanded"], false);
  assert.equal(escape(), false);
  assert(!nodes(app.render()).some(n => n.props.role === "dialog"));
});

const guide = tree => nodes(tree).find(n => n.props.className === "psw-onboarding");
const guideStep = (tree, index) => nodes(guide(tree)).find(n => n.props["data-step"] === index);
test("first-run guide follows connection, selection and persisted success rather than button clicks", async () => {
  const app = fixture({ empty: true });
  let tree = app.render();
  assert(guide(tree));
  assert.equal(guideStep(tree, 0).props["aria-current"], "step");
  button(guide(tree), "连接浏览器").props.onClick();
  await button(app.render(), "生成连接码").props.onClick();
  assert.equal(guideStep(app.render(), 0).props["data-complete"], false);
  button(app.render(), "关闭").props.onClick();
  app.state.browserConnection.paired = true;
  app.state.browserConnection.online = true;
  tree = app.render();
  assert.equal(guideStep(tree, 1).props["aria-current"], "step");
  button(guide(tree), "添加一个平台").props.onClick();
  button(app.render(), "抖音").props.onClick();
  await button(app.render(), "读取并绑定").props.onClick();
  tree = app.render();
  assert.equal(guideStep(tree, 1).props["data-complete"], false);
  assert.match(text(guideStep(tree, 1)), /已选择，待绑定/);
  assert.equal(guideStep(tree, 2).props["aria-current"], "step");
  assert.equal(guideStep(tree, 2).props["data-complete"], false);
  assert.equal(app.calls.filter(c => c.path.endsWith("/sync")).length, 1);
  app.state.syncByPlatform.douyin = { phase: "complete" };
  assert.equal(guideStep(app.render(), 2).props["data-complete"], false);
  app.state.accounts.douyin = { platform: "douyin", name: "新账号", works: [], syncedAt: new Date().toISOString() };
  tree = app.render();
  assert.equal(guideStep(tree, 2).props["data-complete"], true);
  assert.equal(guideStep(tree, 3).props["aria-current"], "step");
  assert.match(text(guide(tree)), /点击账号卡片查看详情/);
  button(guide(tree), "设置自动同步").props.onClick();
  assert.match(text(app.render()), /工作台运行且电脑唤醒时执行/);
});
test("existing accounts keep guide closed and home or settings can reopen it", () => {
  const app = fixture();
  assert(!guide(app.render()));
  button(app.render(), "上手指南").props.onClick();
  assert(guide(app.render()));
  button(app.render(), "收起指南").props.onClick();
  assert(!guide(app.render()));
  button(app.render(), "设置").props.onClick();
  button(app.render(), "上手指南").props.onClick();
  assert(guide(app.render()));
  assert.match(text(app.render()), /我的账号/);
});
test("skip and collapse persist only a versioned preference and reopening remains available", () => {
  const app = fixture({ empty: true });
  button(app.render(), "跳过指南").props.onClick();
  assert(!guide(app.render()));
  const saved = app.storage.get("psw-onboarding-v1");
  assert.deepEqual(JSON.parse(saved), { version: 1, mode: "skipped" });
  const restored = fixture({ empty: true, storedGuide: saved });
  assert(!guide(restored.render()));
  button(restored.render(), "上手指南").props.onClick();
  assert(guide(restored.render()));
  assert.equal(guideStep(restored.render(), 0).props["data-complete"], false);
  button(restored.render(), "收起指南").props.onClick();
  assert.equal(JSON.parse(restored.storage.get("psw-onboarding-v1")).mode, "collapsed");
});
test("missing, malformed and inaccessible storage never blocks first-run guide", () => {
  for (const options of [{}, { storedGuide: "broken" }, { storedGuide: '{"version":99,"mode":"skipped"}' }, { storageUnavailable: true }]) {
    const app = fixture({ empty: true, ...options });
    assert(guide(app.render()));
    button(app.render(), "跳过指南").props.onClick();
    assert(!guide(app.render()));
    button(app.render(), "上手指南").props.onClick();
    assert(guide(app.render()));
  }
});
test("guide recognizes a ready adapter and respects the selected provider", () => {
  const app = fixture({ empty: true });
  app.state.environment.status = "ready";
  assert.equal(guideStep(app.render(), 0).props["data-complete"], true);
  app.state.settings.provider = "browser";
  assert.equal(guideStep(app.render(), 0).props["data-complete"], false);
});
test("work snapshot distinguishes truncation, retained count, uncapped page and legacy uncertainty", () => {
  for (const [collection, expected] of [
    [{ limit: 200, received: 205, retained: 200, truncated: true }, "本次达到 200 条上限，还有返回内容未保存"],
    [{ limit: 200, received: 1, retained: 1, truncated: false }, "仅本次页面已加载内容，未确认全量"],
    [undefined, "旧记录未保存截断信息，下次同步后更新"],
  ]) {
    const app = fixture();
    Object.assign(app.state.accounts.douyin, { workCollection: collection, workCount: value(collection?.retained || 1), works: [{ id: "one", title: "作品", url: "https://example.test/one" }] });
    button(app.render(), "查看详情").props.onClick();
    const content = text(app.render());
    assert.match(content, /当前作品快照/);
    assert(content.includes(`本次保留 ${collection?.retained || 1} 条`));
    assert(content.includes(expected));
    assert.match(content, /每次同步最多保留 200 条/);
    assert.match(content, /查看平台采集范围当前个人主页作品/);
    assert.match(content, /不是历史作品归档/);
    assert(!content.includes("已保存全部作品"));
  }
});
test("zero retained works remains unknown unless platform confirms empty", () => {
  const app = fixture();
  app.state.accounts.douyin.workCollection = { limit: 200, received: 0, retained: 0, truncated: false };
  button(app.render(), "查看详情").props.onClick();
  assert.match(text(app.render()), /本次保留 0 条/);
  assert.match(text(app.render()), /本次未读取到作品/);
  app.state.accounts.douyin.worksStatus = "empty";
  assert.match(text(app.render()), /平台确认暂无作品/);
});

test("guide resumes login in the original browser and only marks scheduling from saved settings", async () => {
  const app = fixture({ empty: true, paired: true, phase: "needs_login" });
  app.state.settings.provider = "ego";
  app.state.environment.status = "ready";
  await button(guide(app.render()), "前往浏览器处理").props.onClick();
  const request = app.calls.find(c => c.path.endsWith("/login"));
  assert.equal(request.body.provider, "browser");
  assert.equal(request.body.url, "https://www.douyin.com/user/lin_film");
  assert.equal(guideStep(app.render(), 2).props["data-complete"], false);
  const existing = fixture({ paired: true });
  button(existing.render(), "上手指南").props.onClick();
  button(guide(existing.render()), "设置自动同步").props.onClick();
  field(existing.render(), "自动同步").props.onChange({ target: { checked: true } });
  button(existing.render(), "上手指南").props.onClick();
  assert.equal(guideStep(existing.render(), 3).props["data-complete"], false);
  existing.state.settings.platforms.douyin.schedule.enabled = true;
  assert.equal(guideStep(existing.render(), 3).props["data-complete"], true);
});
test("Bilibili snapshot cap is shared across content kinds and filters retain snapshot count", () => {
  const app = fixture();
  Object.assign(app.state.accounts.douyin, {
    works: [{ id: "video", kind: "视频", title: "视频作品" }, { id: "opus", kind: "图文", title: "图文作品" }],
    workCollection: { limit: 200, received: 250, retained: 200, truncated: true },
    coverage: { video: { total: value(200), loaded: 199 }, opus: { total: value(50), loaded: 1 }, audio: { total: null, loaded: 0, status: "unavailable" } },
  });
  button(app.render(), "查看详情").props.onClick();
  assert.match(text(app.render()), /视频、图文、音频合计最多保留 200 条/);
  button(app.render(), "图文").props.onClick();
  assert.match(text(app.render()), /本次保留 200 条/);
  assert(!text(app.render()).includes("视频作品"));
  assert.match(text(app.render()), /平台总量 —/);
});

test("real service idle entries do not imply platform selection", () => {
  const app = fixture({ empty: true, paired: true });
  app.state.syncByPlatform = Object.fromEntries(app.state.platforms.map(p => [p.id, { platform: p.id, phase: "idle", running: false }]));
  const tree = app.render();
  assert.equal(guideStep(tree, 1).props["aria-current"], "step");
  assert.equal(guideStep(tree, 1).props["data-complete"], false);
  assert.match(text(guideStep(tree, 1)), /待选择/);
  assert(button(guide(tree), "添加一个平台"));
  assert(!text(guide(tree)).includes("继续首次同步"));
});

test("first render with no server state shows loading before onboarding can derive progress", async () => {
  const app = fixture({ empty: true, initialLoading: true });
  const tree = app.render();
  assert.match(text(tree), /正在读取本地账号/);
  assert(!guide(tree));
  await app.poll();
  assert(guide(app.render()));
  assert.equal(guideStep(app.render(), 0).props["aria-current"], "step");
});

test("selected platform with only an idle record reopens its form before first sync", async () => {
  const app = fixture({ empty: true, paired: true });
  app.state.syncByPlatform = Object.fromEntries(app.state.platforms.map(p => [p.id, { platform: p.id, phase: "idle", running: false }]));
  button(guide(app.render()), "添加一个平台").props.onClick();
  button(app.render(), "X").props.onClick();
  button(app.render(), "关闭").props.onClick();
  await button(guide(app.render()), "继续首次同步").props.onClick();
  assert(nodes(app.render()).some(n => n.props.role === "dialog"));
  assert(field(app.render(), "个人主页链接（可选）"));
  assert.equal(app.calls.filter(c => c.path.endsWith("/sync")).length, 0);
});
test("guide main flow keeps browser choice neutral", () => {
  const app = fixture({ empty: true });
  assert.match(text(guide(app.render())), /安装连接器并配对常用浏览器/);
  assert(!text(guide(app.render())).includes("Ego"));
});

test("guide pairing completion does not claim the browser is currently online", () => {
  const app = fixture({ empty: true, paired: true });
  app.state.browserConnection.online = false;
  const tree = app.render();
  assert.equal(guideStep(tree, 0).props["data-complete"], true);
  assert.match(text(guideStep(tree, 0)), /已配置/);
  assert(!text(guideStep(tree, 0)).includes("已连接"));
});
