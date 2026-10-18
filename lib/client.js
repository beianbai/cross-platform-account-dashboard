/* Built single-file module; no runtime compiler required. */
window.__ModuleLoader__.load({
  id: "dsh-workbench-personal-social-local",

  factory(require) {
    const React = require("react"),
      h = React.createElement;
    const FEEDBACK_URL = "https://my.feishu.cn/share/base/shrcn3QhjgppqaD3vnhVP4KUWXf";
    const GITHUB_URL = "https://github.com/beianbai/cross-platform-account-dashboard";
    // User-facing history travels with the installed client; no remote fetch or auto-update.
    const releaseNotes = [
      { version: "0.7.2", date: "2026-10-18", items: [["优化", "连接弹窗与设置使用清晰的浏览器状态卡片，扩展下载入口更醒目。"], ["修复", "浏览器授权成功后显示确认提示并收起已使用的连接码。"]] },
      { version: "0.7.1", date: "2026-10-18", items: [["优化", "浏览器连接统一使用扩展，简化连接界面，移除连接方式选择与浏览器命令配置。"]] },
      { version: "0.7.0", date: "2026-10-17", items: [["新增", "独立版通过固定地址和配对码授权，支持多个浏览器分别访问与撤销。"], ["优化", "可在终端或设置中重新取码，无须重启服务；旧版访问授权需重新配对，业务数据保留。"]] },
      { version: "0.6.6", date: "2026-10-17", items: [["优化", "日常同步保存账号指标和当前已加载作品后即可完成，不再等待全部历史读完。"], ["优化", "补齐历史独立操作，保留历史断点与已有作品；读取或保存失败仍明确提示。"]] },
      { version: "0.6.5", date: "2026-10-17", items: [["修复", "返回总览与更新记录按钮的悬停留白。"], ["修复", "抖音零作品被误判为列表尚未加载。"], ["优化", "区分账号数据已更新与历史范围待确认，未知总数时展示已收录数量。"]] },
      { version: "0.6.4", date: "2026-10-17", items: [["新增", "设置中可查看、复制本机存储路径，并下载业务数据备份。"], ["新增", "备份范围和手动恢复说明，帮助保管账号与历史记录。"]] },
      { version: "0.6.3", date: "2026-10-17", items: [
        ["新增", "在设置中查看更新记录，顶栏可直接打开 GitHub 项目。"],
        ["优化", "帮助与反馈移到设置底部，返回入口移至顶栏左侧。"],
        ["优化", "回到顶部按钮更易辨认，长页面操作结果始终显示在可视区域。"],
        ["新增", "飞书意见反馈与诊断信息预览，可自主选择复制和提交。"],
        ["优化", "浏览器连接说明更清晰。"] ] },
      { version: "0.6.2", date: "2026-10-12", items: [["优化", "精简 Desktop 安装包，保留完整看板与浏览器连接器。"]] },
      { version: "0.6.1", date: "2026-10-12", items: [["修复", "账号卡片的高度与指标分隔线对齐。"], ["优化", "支持浅色、深色与跟随系统，并记住外观选择。"]] },
      { version: "0.6.0", date: "2026-10-12", items: [["新增", "累计保存作品，支持补齐历史与后续增量同步。"], ["新增", "同步可暂停和继续，已保存进度不会因中断丢失。"], ["优化", "作品分页展示，并标明历史范围与同步进度。"]] },
      { version: "0.5.1", date: "2026-10-11", items: [["新增", "四步上手指南，可收起、跳过或重新查看。"], ["优化", "更清楚地说明作品保存范围与采集限制。"]] },
      { version: "0.5.0", date: "2026-10-11", items: [["新增", "提供可独立运行的工作台。"], ["优化", "支持浅色与深色界面，点击账号卡片即可进入详情。"], ["优化", "操作成功提示自动收起，停留查看时暂停倒计时。"]] },
      { version: "0.4.0", date: "本地基线", items: [["新增", "跨平台账号看板、定时同步、每日趋势和历史档案。"]] },
    ];
    const appVersion = typeof "0.7.2" === "string" ? "0.7.2" : "开发预览（未构建）";
    const runtimeMode = typeof "桌面工作台" === "string" ? "桌面工作台" : "开发预览";
    const fallback = [
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
    ];
    const labels = {
      fans: "粉丝",
      following: "关注",
      workCount: "作品总数",
      likes: "获赞",
    };
    const date = (v) =>
      v
        ? new Date(v).toLocaleString("zh-CN", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })
        : "尚无记录";
    const collectedFallback = (account, key) => key === "workCount" && account?.workCount == null && account?.works?.length > 0;
    const collectedLabel = account => account?.platform === "xiaohongshu" ? "已收录笔记" : "已收录作品";
    const unconfirmedHistory = (status, account) => status?.phase === "partial" || status?.phase === "paused" && ["no_progress", "no_pagination_evidence", "category_not_ready"].includes(account?.workSync?.reason);
    const historyExplanation = account => account?.workSync?.reason === "category_not_ready"
      ? "账号数据已更新，作品列表尚未就绪，可稍后重试。"
      : "账号数据已更新，历史范围尚未确认。页面没有提供明确的列表末尾，已读取的作品均已保存。";
    const accountData = a => JSON.stringify([a?.name, a?.accountId, a?.avatar, a?.bio, a?.fans, a?.following, a?.workCount, a?.likes, a?.works, a?.coverage, a?.workCollection, a?.workLibrary, a?.workSync]);
    const metric = (v) =>
      v?.display ??
      (Number.isFinite(v?.value) ? v.value.toLocaleString("zh-CN") : "—");
    const number = (v) => (Number.isFinite(v?.value) ? v.value : null);
    const dayShift = (day, n) =>
      new Date(Date.parse(day + "T12:00:00Z") + n * 86400000)
        .toISOString()
        .slice(0, 10);
    const today = (zone) => {
      try {
        return new Intl.DateTimeFormat("en-CA", {
          timeZone: zone || "Asia/Shanghai",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());
      } catch {
        return new Date().toISOString().slice(0, 10);
      }
    };
    function dailyLatest(rows) {
      const byDate = new Map();
      for (const row of rows || []) {
        const previous = byDate.get(row.date);
        if (!previous || String(row.at || "") >= String(previous.at || ""))
          byDate.set(row.date, row);
      }
      return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    }
    function dailyDifference(account, row, key) {
      const previous = (account.daily || [])
        .filter(
          (p) =>
            p.date === dayShift(row.date, -1) && p.timeZone === row.timeZone,
        )
        .sort((a, b) => String(a.at).localeCompare(String(b.at)))
        .at(-1);
      const currentValue = number(row[key]),
        previousValue = number(previous?.[key]);
      if (currentValue === null || previousValue === null) return null;
      return {
        value: currentValue - previousValue,
        approximate: !!(row[key].approximate || previous[key].approximate),
      };
    }
    const deltaLabel = (delta) =>
      delta
        ? `${delta.approximate ? "约 " : ""}${delta.value >= 0 ? "+" : ""}${delta.value.toLocaleString("zh-CN")}${delta.approximate ? " · 估算" : ""}`
        : "—";
    function change(rows, key) {
      const valid = dailyLatest(rows)
        .filter((r) => number(r[key]) !== null)
        .sort((a, b) => a.date.localeCompare(b.date));
      if (valid.length < 2) return null;
      const last = valid.at(-1),
        prev = valid.at(-2),
        value = number(last[key]) - number(prev[key]);
      return {
        value,
        estimated: last[key].approximate || prev[key].approximate,
        label:
          dayShift(prev.date, 1) === last.date &&
          prev.timeZone === last.timeZone &&
          last.date === today(last.timeZone)
            ? "较昨日"
            : `较 ${prev.date.slice(5).replace("-", "/")} 记录`,
      };
    }
    const themeKey = "psw-theme";
    function savedTheme() {
      try { const value = window.localStorage.getItem(themeKey); return ["light", "dark", "system"].includes(value) ? value : "light"; }
      catch { return "light"; }
    }
    const systemThemeQuery = "(prefers-color-scheme: dark)";
    const systemIsDark = () => window.matchMedia?.(systemThemeQuery).matches ?? false;
    const nextTheme = mode => ({ light: "dark", dark: "system", system: "light" })[mode];
    const themeNames = { light: "浅色", dark: "深色", system: "跟随系统" };
    const guideKey = "psw-onboarding-v1";
    function savedGuide() {
      try {
        const value = JSON.parse(window.localStorage.getItem(guideKey));
        return value?.version === 1 && ["expanded", "collapsed", "skipped"].includes(value.mode) ? value.mode : null;
      } catch { return null; }
    }
    function GuideArt({ step }) {
      return h("svg", { className: "psw-guide-art", viewBox: "0 0 72 56", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
        h("rect", { x: 5, y: 8, width: 53, height: 38, rx: 7, fill: "var(--card)" }),
        h("path", { d: "M5 18h53", opacity: .4 }),
        h("path", { d: "M12 13h1m5 0h1", opacity: .6 }),
        step === 0 ? h(React.Fragment, null,
          h("path", { d: "M19 27v8m-4-4h8m8-4h8m-4-4v16", opacity: .65 }),
          h("path", { className: "psw-guide-motion", d: "M48 34h8v-4h7v13h-7v-4h-8z", fill: "var(--accent-soft)" }))
        : step === 1 ? h(React.Fragment, null,
          h("circle", { cx: 24, cy: 28, r: 5 }), h("path", { d: "M15 40c1-9 17-9 18 0" }),
          h("g", { className: "psw-guide-motion" }, h("circle", { cx: 56, cy: 37, r: 11, fill: "var(--accent-soft)" }), h("path", { d: "M51 37h10m-5-5v10" })))
        : step === 2 ? h(React.Fragment, null,
          h("path", { d: "M15 38h8V27h8v11h8V24", opacity: .65 }),
          h("g", { className: "psw-guide-motion" }, h("rect", { x: 45, y: 27, width: 22, height: 22, rx: 7, fill: "var(--accent-soft)" }), h("path", { d: "m50 38 4 4 8-9" })))
        : h(React.Fragment, null,
          h("path", { d: "M15 27h23m-23 7h15", opacity: .5 }),
          h("g", { className: "psw-guide-motion" }, h("circle", { cx: 55, cy: 37, r: 12, fill: "var(--accent-soft)" }), h("path", { d: "M55 30v8l5 3" }))));
    }
    function Onboarding({ connected, chosen, synced, scheduled, active, description, action, onCollapse, onSkip }) {
      const steps = [
        ["连接浏览器", connected, "已配置"],
        ["添加一个平台", synced, "已绑定", chosen ? "已选择，待绑定" : "待选择"],
        ["完成首次同步", synced, "已保存"],
        ["设置自动同步", scheduled, "已开启"],
      ];
      return h("section", { className: "psw-onboarding", id: "psw-onboarding", "aria-label": "上手指南" },
        h("div", { className: "psw-guide-head" }, h("h2", { tabIndex: -1, id: "psw-guide-title" }, "从一个账号开始"),
          h("div", { className: "psw-actions" },
            h("button", { type: "button", className: "psw-quiet", onClick: onCollapse, "aria-label": "收起指南" }, "收起"),
            h("button", { type: "button", className: "psw-quiet", onClick: onSkip, "aria-label": "跳过指南" }, "跳过"))),
        h("ol", { className: "psw-guide-steps" }, steps.map(([title, complete, done, waiting], index) =>
          h("li", { key: title, "data-step": index, "data-complete": !!complete, "aria-current": active === index ? "step" : undefined },
            h(GuideArt, { step: index }),
            h("div", null, h("h3", null, h("span", { className: "psw-guide-number" }, complete ? h(Icon, { name: "check", size: 12 }) : index + 1), title),
              h("small", null, complete ? done : index === 3 ? "可选" : waiting || (active === index ? "当前步骤" : "待完成")))))),
        h("div", { className: "psw-guide-next" }, h("p", { "aria-live": "polite" }, description), action));
    }
    function SuccessNotice({ message, tone = "success", onClose }) {
      const clock = React.useRef({ remaining: 4000, started: 0, timer: null, reasons: new Set() });
      const closeRef = React.useRef(onClose);
      closeRef.current = onClose;
      const [paused, setPaused] = React.useState(false);
      const start = () => {
        const c = clock.current;
        c.started = Date.now();
        c.timer = setTimeout(() => closeRef.current(), c.remaining);
      };
      React.useEffect(() => {
        const c = clock.current;
        c.remaining = 4000;
        c.reasons.clear();
        setPaused(false);
        start();
        return () => clearTimeout(c.timer);
      }, [message]);
      const pause = reason => {
        const c = clock.current;
        if (!c.reasons.size) {
          clearTimeout(c.timer);
          c.remaining = Math.max(0, c.remaining - (Date.now() - c.started));
          setPaused(true);
        }
        c.reasons.add(reason);
      };
      const resume = reason => {
        const c = clock.current;
        if (!c.reasons.delete(reason) || c.reasons.size) return;
        setPaused(false);
        start();
      };
      return h("div", { className: "psw-feedback psw-result " + tone, role: tone === "error" ? "alert" : "status", "aria-live": tone === "error" ? "assertive" : "polite",
        style: { animationPlayState: paused ? "paused" : "running" },
        onPointerEnter: () => pause("pointer"), onPointerLeave: () => resume("pointer"),
        onFocus: () => pause("focus"), onBlur: e => { if (!e.currentTarget.contains(e.relatedTarget)) resume("focus"); } },
        h(Icon, { name: tone === "success" ? "check" : "alert", size: 17 }), h("span", null, message),
        h("button", { type: "button", className: "psw-quiet psw-icon-button", "aria-label": "关闭通知", onClick: onClose }, h(Icon, { name: "close", size: 16 })));
    }
    let selectSerial = 0;
    function Select({ value, onChange, disabled, children, "aria-label": label }) {
      const options = children.filter(Boolean).map(child => ({ value: child.props.value, label: child.props.children }));
      const selected = Math.max(0, options.findIndex(option => String(option.value) === String(value)));
      const [open, setOpen] = React.useState(false), [active, setActive] = React.useState(selected),
        [placement, setPlacement] = React.useState({}), [id] = React.useState(() => "psw-select-" + ++selectSerial);
      const root = React.useRef(null), trigger = React.useRef(null);
      const position = () => {
        const element = root.current;
        if (!element) return;
        const box = element.getBoundingClientRect(), bounds = element.closest(".psw-dialog, .psw")?.getBoundingClientRect();
        const bottom = Math.min(bounds?.bottom ?? window.innerHeight, window.innerHeight) - 12;
        const top = Math.max(bounds?.top ?? 0, 0) + 12;
        const below = bottom - box.bottom, above = box.top - top, upwards = below < 180 && above > below;
        setPlacement({ top: upwards ? "auto" : "calc(100% + 6px)", bottom: upwards ? "calc(100% + 6px)" : "auto", maxHeight: Math.max(48, Math.min(264, (upwards ? above : below) - 6)) });
      };
      const show = index => { position(); setActive(index); setOpen(true); };
      const choose = index => {
        setOpen(false);
        trigger.current?.focus();
        return onChange({ target: { value: options[index].value } });
      };
      React.useEffect(() => {
        if (!open) return;
        const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
        document.addEventListener("pointerdown", outside, true);
        return () => document.removeEventListener("pointerdown", outside, true);
      }, [open]);
      React.useEffect(() => {
        if (open) root.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
      }, [active, open]);
      const onKeyDown = event => {
        const key = event.key;
        if (key === "Escape" && !open) return;
        if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"].includes(key)) {
          event.preventDefault(); event.stopPropagation();
          if (key === "Escape") { setOpen(false); return; }
          if (key === "Enter" || key === " ") return open ? choose(active) : show(selected);
          const next = key === "Home" ? 0 : key === "End" ? options.length - 1 : !open ? selected : Math.max(0, Math.min(options.length - 1, active + (key === "ArrowDown" ? 1 : -1)));
          show(next);
        } else if (key === "Tab") setOpen(false);
      };
      return h("span", { className: "psw-select", ref: root, onBlur: e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); } },
        h("button", { type: "button", className: "psw-select-trigger", role: "combobox", ref: trigger,
          "aria-label": label, "aria-expanded": open, "aria-controls": id, "aria-haspopup": "listbox",
          "aria-activedescendant": open ? id + "-" + active : undefined, disabled, onKeyDown,
          onClick: () => open ? setOpen(false) : show(selected) },
          h("span", null, options[selected]?.label), h(Icon, { name: "chevron", size: 16 })),
        open && h("span", { className: "psw-select-options", id, role: "listbox", "aria-label": label, style: placement },
          options.map((option, index) => h("button", { type: "button", id: id + "-" + index, key: option.value,
            role: "option", tabIndex: -1, "aria-selected": selected === index, "data-active": active === index,
            onPointerMove: () => setActive(index), onMouseDown: e => e.preventDefault(), onClick: () => choose(index) },
            h("span", null, option.label), selected === index && h(Icon, { name: "check", size: 15 })))));
    }
    function Icon({ name, size = 18, ...props }) {
      const paths = {
        plus: "M12 5v14M5 12h14",
        top: "M5 4h14M12 20V9m-5 5 5-5 5 5",
        back: "m14 6-6 6 6 6M8 12h12",
        arrow: "M5 12h14m-5-5 5 5-5 5",
        external:
          "M14 4h6v6m0-6L10 14M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5",
        refresh:
          "M20 7v5h-5M4 17v-5h5M6.1 6.1A8 8 0 0 1 19 8M18 18A8 8 0 0 1 5 16",
        close: "m6 6 12 12M18 6 6 18",
        chevron: "m7 10 5 5 5-5",
        sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
        monitor: "M4 3h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM8 21h8m-4-4v4",
        moon: "M20.5 13.4A8.8 8.8 0 0 1 10.6 3.5a9 9 0 1 0 9.9 9.9Z",
        settings: "M9 4h6l1 3 3 1 1 5-2 2v4l-5 1-2-2-4-1-2-5 2-2Z",
        check: "m5 12 4 4L19 6",
        clock: "M12 7v5l3 2",
        browser: "M3 8h18M7 5h.01M10 5h.01",
        code: "m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16",
        copy: "M9 8h11v13H9zM15 8V3H4v13h5",
        grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
        alert: "M12 8v5m0 3h.01M12 3 2 21h20Z",
        eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12",
        archive: "M3 4h18v4H3zM5 8v12h14V8M9 12h6",
        download: "M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5",
      };
      return h(
        "svg",
        {
          width: size,
          height: size,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 1.65,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          "aria-hidden": true,
          ...props,
        },
        ["clock", "settings", "eye", "sun"].includes(name) &&
          h("circle", {
            cx: 12,
            cy: 12,
            r: name === "clock" ? 9 : name === "eye" ? 2.5 : name === "sun" ? 4 : 3,
          }),
        name === "browser" &&
          h("rect", { x: 2, y: 2, width: 20, height: 19, rx: 3 }),
        h("path", { d: paths[name] || paths.grid }),
      );
    }
    function BrandMark() {
      return h("svg", { viewBox: "0 0 40 40", width: 34, height: 34, fill: "none", stroke: "var(--accent)", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
        h("path", { d: "M5 10H9L15 16M4 20H15M5 30H9L15 24" }),
        h("rect", { x: 15, y: 8, width: 21, height: 24, rx: 6, fill: "var(--card)" }),
        h("path", { d: "M21 17H30M21 23H27" }),
        [[5,10],[4,20],[5,30]].map(([cx,cy]) => h("circle", { key: cy, cx, cy, r: 2, fill: "var(--paper)" })));
    }
    const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai";
    const cityZones = { "Asia/Shanghai": "北京 · 上海", "Asia/Hong_Kong": "香港", "Asia/Taipei": "台北", "Asia/Tokyo": "东京", "Asia/Seoul": "首尔", "Asia/Singapore": "新加坡", "Asia/Kolkata": "新德里", "Asia/Dubai": "迪拜", "Europe/London": "伦敦", "Europe/Paris": "巴黎", "Europe/Berlin": "柏林", "America/New_York": "纽约", "America/Los_Angeles": "洛杉矶", "America/Chicago": "芝加哥", "America/Toronto": "多伦多", "Australia/Sydney": "悉尼", "Pacific/Auckland": "奥克兰", "UTC": "协调世界时" };
    function zoneLabel(zone) {
      try {
        const offset = new Intl.DateTimeFormat("en", { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(new Date()).find(p => p.type === "timeZoneName").value.replace("GMT", "UTC");
        return `${cityZones[zone] || zone.replaceAll("_", " ")} · ${offset} · ${zone}`;
      } catch { return zone; }
    }
    function TimeZonePicker({ value, onChange, disabled, id }) {
      const [query, setQuery] = React.useState(null), [open, setOpen] = React.useState(false), [active, setActive] = React.useState(0);
      const choices = [...new Set([value, localZone(), ...Object.keys(cityZones), ...(Intl.supportedValuesOf?.("timeZone") || [])])].filter(Boolean);
      const filtered = choices.filter(z => query === null || zoneLabel(z).toLowerCase().includes(query.toLowerCase()));
      const select = zone => { onChange(zone); setQuery(null); setOpen(false); setActive(0); };
      return h("div", { className: "psw-timezone", onBlur: e => { if (!e.currentTarget.contains(e.relatedTarget)) { setOpen(false); setQuery(null); } } },
        h("label", { className: "psw-field", htmlFor: id }, "计划时区",
          h("input", { id, role: "combobox", autoComplete: "off", disabled, value: query === null ? zoneLabel(value) : query,
            "aria-expanded": open, "aria-controls": id + "-options", "aria-autocomplete": "list", "aria-activedescendant": open && filtered[active] ? id + "-" + active : undefined,
            onFocus: () => { setOpen(true); setActive(0); }, onChange: e => { setQuery(e.target.value); setOpen(true); setActive(0); },
            onKeyDown: e => { if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); setOpen(false); setQuery(null); } else if (["ArrowDown", "ArrowUp"].includes(e.key)) { e.preventDefault(); setOpen(true); const next = Math.max(0, Math.min(filtered.length - 1, active + (e.key === "ArrowDown" ? 1 : -1))); setActive(next); e.currentTarget.parentElement.parentElement.querySelector(`[data-zone-index="${next}"]`)?.scrollIntoView({ block: "nearest" }); } else if (e.key === "Enter" && open) { e.preventDefault(); if (filtered[active]) select(filtered[active]); } }
          })),
        open && h("div", { id: id + "-options", role: "listbox", "aria-label": "选择计划时区", className: "psw-zone-options" },
          filtered.length ? filtered.map((z, i) => h("button", { key: z, id: id + "-" + i, "data-zone-index": i, type: "button", role: "option", tabIndex: -1, "aria-selected": active === i, onMouseDown: e => e.preventDefault(), onClick: () => select(z) }, zoneLabel(z))) : h("p", null, "未找到时区，试试城市名或 IANA 名称")),
        h("div", { className: "psw-zone-hint" }, "按当地时间执行，夏令时自动调整", h("button", { type: "button", className: "psw-quiet", disabled, onClick: () => select(localZone()) }, "使用本机时区")));
    }
    function Logo({ id }) {
      return h(
        "span",
        { className: "psw-logo psw-" + id, "aria-hidden": true },
        id === "xiaohongshu"
          ? h("span", null, "小红书")
          : h(
              "svg",
              {
                viewBox: "0 0 32 32",
                width: 25,
                height: 25,
                fill: "none",
                stroke: "currentColor",
                strokeWidth: 1.8,
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              id === "bilibili"
                ? h(
                    React.Fragment,
                    null,
                    h("path", { d: "m10 4 4 5m8-5-4 5" }),
                    h("rect", { x: 4, y: 9, width: 24, height: 18, rx: 4 }),
                    h("path", { d: "M10 15v5m12-5v5m-9 3 3 1 3-1" }),
                  )
                : id === "douyin"
                  ? h("path", {
                      d: "M18 5v16a5 5 0 1 1-4-4M18 5c1 5 4 7 8 7",
                      strokeWidth: 3.3,
                    })
                  : h("path", {
                      d: "M6 5h6l14 22h-6ZM25 5 7 27",
                      strokeWidth: 2,
                    }),
            ),
      );
    }
    const styles = `
.psw{--ink:#252832;--muted:#656b78;--line:#e5e7ed;--paper:#f5f6f8;--card:#fff;--accent:#4d6bfe;--soft:#eef1f7;--green:#23744f;--danger:#b43d42;--field:#fff;--hover-border:#b7c3e7;--accent-soft:#edf0ff;--accent-hover:#3d58dc;--success-bg:#edf7f1;--success-line:#c5e2d1;--warning-bg:#fff8ec;--warning-line:#ebd7ad;--warning-ink:#76531c;--error-bg:#fff0ef;--error-line:#f0cccc;--shadow:0 3px 15px #25345708;--ease:cubic-bezier(.2,.75,.25,1);color:var(--ink);background:var(--paper);font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC",sans-serif;display:flex;flex-direction:column;flex:1;min-width:0;min-height:0;height:100%;overflow:hidden;container-type:inline-size;text-align:left;color-scheme:light;position:relative;isolation:isolate}
.psw *{box-sizing:border-box}.psw button,.psw input,.psw select,.psw textarea{font:inherit}.psw button,.psw a,.psw input,.psw select,.psw textarea{touch-action:manipulation}.psw svg{flex-shrink:0}.psw h1,.psw h2,.psw h3,.psw p{margin:0}.psw h1{font-size:29px;line-height:1.25;letter-spacing:-.9px;font-weight:650}.psw h2{font-size:17px;font-weight:620;letter-spacing:-.3px}.psw h3{font-size:15px;font-weight:600}.psw small{font-size:12px}.psw a{color:var(--accent);text-decoration:none}.psw a:hover{text-decoration:underline}.psw .psw-muted{color:var(--muted)}
.psw button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:9px 14px;border:1px solid var(--line);border-radius:9px;background:var(--card);color:var(--ink);cursor:pointer;white-space:nowrap;transition:background .16s,border-color .16s,transform .18s var(--ease),box-shadow .18s}.psw button:hover:not(:disabled){background:var(--soft);border-color:#516273}.psw button:active:not(:disabled){transform:scale(.975)}.psw button:disabled{opacity:.45;cursor:default}.psw button:focus-visible,.psw a:focus-visible,.psw input:focus-visible,.psw select:focus-visible,.psw textarea:focus-visible,.psw summary:focus-visible,.psw [tabindex]:focus-visible{outline:2px solid var(--accent);outline-offset:3px}.psw .psw-primary,.psw .psw-accent{background:var(--accent);border-color:var(--accent);color:#102526;font-weight:600;box-shadow:0 2px 12px #79dfda0c}.psw .psw-primary:hover:not(:disabled),.psw .psw-accent:hover:not(:disabled){background:#a3eee8;border-color:#a3eee8;box-shadow:0 3px 18px #79dfda20}.psw .psw-quiet{background:transparent;border-color:transparent}.psw .psw-icon-button{width:44px;padding:10px;flex-shrink:0}.psw .psw-danger{color:var(--danger)}
.psw .psw-topbar{display:flex;align-items:center;gap:14px;padding:10px 26px 10px max(26px,var(--dsh-frame-leading-clearance,0px));min-height:66px;border-bottom:1px solid #8fbdcf23;flex-shrink:0;background:linear-gradient(110deg,#1d2830dc,#12181fe8);backdrop-filter:blur(18px);z-index:3}.psw .psw-brand{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:650;letter-spacing:.025em;white-space:nowrap}.psw .psw-mark{width:36px;height:36px;display:grid;place-items:center}.psw .psw-top-actions{margin-left:auto;display:flex;align-items:center;gap:8px}.psw .psw-connection{font-size:12px;gap:7px;min-height:44px;background:#1b252f80;border-color:#3d536260;color:var(--ink)}.psw .psw-settings-button{font-size:12px;color:var(--muted)}.psw .psw-dot{height:6px;width:6px;border-radius:50%;background:var(--muted);display:inline-block;flex-shrink:0}.psw .psw-dot.online{background:var(--accent);box-shadow:0 0 8px #79dfda44}
.psw main{flex:1;min-height:0;overflow:auto;padding:30px 30px 42px;scrollbar-gutter:stable;background:radial-gradient(ellipse at 12% 0,#2a485b16,transparent 65%)}.psw .psw-wrap{max-width:1280px;margin:auto}.psw .psw-pagehead{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:24px}.psw .psw-heading{display:flex;align-items:baseline;gap:13px}.psw .psw-count{font-size:12px;color:var(--muted);white-space:nowrap}.psw .psw-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.psw .psw-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px}
.psw .psw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:stretch}.psw .psw-card{display:flex;flex-direction:column;background:linear-gradient(135deg,#202a32 0,var(--card) 55%);border:1px solid #36434e;border-radius:14px;padding:20px;min-width:0;position:relative;overflow:hidden;box-shadow:inset 0 1px #ffffff04,0 7px 20px #0000000d;transition:border-color .2s,box-shadow .2s,transform .24s var(--ease)}.psw .psw-card:hover{border-color:#536775;box-shadow:0 12px 30px #00000020;transform:translateY(-2px)}.psw .psw-card.is-syncing{border-color:#79dfda70}.psw .psw-card.is-syncing:before{content:'';position:absolute;top:0;left:0;width:45%;height:2px;background:linear-gradient(90deg,transparent,var(--accent),transparent);animation:psw-scan 1.8s ease-in-out infinite}.psw .psw-sync-flash{position:absolute;inset:0;pointer-events:none;border:1px solid transparent;border-radius:inherit;animation:psw-complete 1.5s var(--ease) both}.psw .psw-card-top{display:flex;align-items:center;gap:9px;min-width:0}.psw .psw-logo{width:33px;height:33px;display:grid;place-items:center;border-radius:9px;background:#59313a;color:#ffd0d4;flex-shrink:0;box-shadow:inset 0 0 0 1px #ffffff0a}.psw .psw-logo>span{font-size:10px;font-weight:800;letter-spacing:-1px}.psw .psw-douyin,.psw .psw-x{background:#10171d;color:#eef4f9}.psw .psw-bilibili{background:#183d50;color:#91d8ef}.psw .psw-status{margin-left:auto;color:var(--muted);font-size:11px;display:flex;align-items:center;gap:5px;border:1px solid var(--line);border-radius:20px;padding:3px 8px;white-space:nowrap}.psw .is-syncing .psw-status{color:var(--accent);border-color:#79dfda40;background:#79dfda08}
.psw .psw-account{display:flex;align-items:center;gap:10px;min-width:0}.psw .psw-card .psw-account{margin-top:18px}.psw .psw-avatar{width:37px;height:37px;border-radius:50%;object-fit:cover;background:linear-gradient(130deg,#39505a,#26343c);color:#c4e7e9;display:grid;place-items:center;font-size:15px;flex-shrink:0;border:1px solid #52717b50}.psw .psw-account>div{min-width:0}.psw .psw-account h3{font-size:15px;overflow-wrap:anywhere;line-height:1.4}.psw .psw-account small{display:block;color:var(--muted);margin-top:3px;font-size:11px}.psw .psw-mainmetric{display:flex;justify-content:space-between;gap:14px;margin-top:18px;align-items:center}.psw .psw-big{font-family:ui-sans-serif,-apple-system,sans-serif;font-size:38px;line-height:1.1;letter-spacing:-1.6px;font-weight:580;font-variant-numeric:tabular-nums;display:block}.psw .psw-metriclabel{display:block;color:var(--muted);font-size:12px;margin-bottom:6px}.psw .psw-delta{display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap;color:var(--green);font-size:12px;margin-top:7px}.psw .psw-delta.negative{color:var(--danger)}.psw .psw-delta small{color:var(--muted);font-size:11px}.psw .psw-spark{width:40%;max-width:180px}.psw .psw-spark svg{width:100%;height:55px;display:block}.psw .psw-spark span{font-size:11px;color:var(--muted);display:block;text-align:right;margin-top:5px}.psw .psw-accumulation{display:grid;justify-items:end;gap:4px;color:var(--muted);padding:12px 0 6px 12px;max-width:47%;text-align:right;background-image:radial-gradient(#9fbfcd20 .8px,transparent .8px);background-size:8px 8px}.psw .psw-accumulation svg{color:#8faebc;margin-bottom:3px}.psw .psw-accumulation strong{font-size:12px;font-weight:500;color:#bccbd5;background:var(--card)}.psw .psw-accumulation span{font-size:11px;background:var(--card)}
.psw .psw-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:14px 0;margin-top:16px;border-top:1px solid var(--line)}.psw .psw-stats b{font-weight:550;font-size:18px;font-variant-numeric:tabular-nums;letter-spacing:-.25px}.psw .psw-stats span{color:var(--muted);font-size:11px;display:block;margin-top:2px}.psw .psw-card-delta{display:flex;min-height:26px}.psw .psw-cardfooter{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:9px;border-top:1px solid var(--line)}.psw .psw-cardfooter small{font-size:11px;color:var(--muted)}.psw .psw-cardfooter button{min-height:40px;font-size:12px;padding:8px}.psw .psw-cardfooter .psw-actions{gap:2px}.psw .psw-cardfooter .psw-icon-button{width:40px}.psw .psw-note{font-size:12px;color:var(--muted);margin-top:20px;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.psw .psw-notice{padding:13px 16px;border:1px solid #59604c;background:#282c25;border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px;font-size:13px;overflow-wrap:anywhere;color:#e1dfc4}.psw .psw-notice p{margin-top:4px;color:#c9c9b8}.psw .psw-notice.error{color:var(--danger);border-color:#795047;background:#332421}.psw .psw-empty{padding:54px 25px;text-align:center;border:1px dashed #40515f;border-radius:14px;max-width:760px;margin:25px auto;background:linear-gradient(150deg,#202c35aa,#19212980)}.psw .psw-empty-art{margin:0 auto 22px;color:var(--accent);width:90px;height:72px}.psw .psw-empty p{color:var(--muted);max-width:340px;margin:12px auto 24px}.psw .psw-feedback{font-size:12px;color:var(--green);margin-top:12px}.psw .psw-result{display:flex;align-items:center;gap:9px;padding:7px 10px 7px 14px;margin:0 0 18px;border-radius:9px;background:#19312c;border:1px solid #396455;animation:psw-result .24s var(--ease)}.psw .psw-result>span{flex:1}.psw .psw-result button{color:var(--green);min-height:34px;height:34px;width:34px}
.psw .psw-detail-head{margin:22px 0 26px;display:flex;align-items:center;justify-content:space-between;gap:20px}.psw .psw-detail-head .psw-avatar{width:55px;height:55px;font-size:23px}.psw .psw-detail-head .psw-account h3{font-size:22px}.psw .psw-bio{margin-top:8px;color:var(--muted);max-width:650px;overflow-wrap:anywhere}.psw .psw-metric-tabs button:disabled{opacity:1;cursor:default}.psw .psw-metric-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--card);margin-bottom:18px}.psw .psw-metric-tabs button{display:block;text-align:left;min-height:92px;border-radius:0;border:0;border-right:1px solid var(--line);padding:17px 20px;position:relative}.psw .psw-metric-tabs button:last-child{border-right:0}.psw .psw-metric-tabs button[aria-pressed=true]{background:linear-gradient(145deg,#254245,#213238)}.psw .psw-metric-tabs button[aria-pressed=true]:after{position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--accent);content:''}.psw .psw-metric-tabs b{font-size:25px;display:block;font-weight:580;font-variant-numeric:tabular-nums}.psw .psw-chart-panel{padding:24px;border:1px solid var(--line);border-radius:14px;background:var(--card)}.psw .psw-segment{display:flex;gap:3px;padding:3px;border-radius:8px;background:#10171e;border:1px solid #303c48}.psw .psw-segment button{padding:6px 12px;font-size:12px;min-height:34px;border:0;background:transparent;border-radius:5px;color:var(--muted)}.psw .psw-segment button[aria-pressed=true]{background:#30424a;color:var(--accent);box-shadow:0 1px 5px #00000020}.psw .psw-chart-summary{margin-top:18px;min-height:25px;display:flex;gap:10px;align-items:center;font-size:12px;color:var(--muted)}.psw .psw-chart-summary strong{font-size:15px;color:var(--ink);font-variant-numeric:tabular-nums}.psw .psw-chart{width:100%;height:250px;display:block;overflow:visible;animation:psw-chart .28s var(--ease)}.psw .psw-chart text,.psw .psw-delta-chart text{font:11px -apple-system,sans-serif;fill:var(--muted)}.psw .psw-chart circle{cursor:pointer;transition:r .12s}.psw .psw-chart circle:hover,.psw .psw-chart circle:focus{r:6}.psw .psw-chart-empty{min-height:160px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--muted)}.psw .psw-chart-empty svg{color:var(--accent)}.psw .psw-daily-chart{border-top:1px solid var(--line);margin-top:22px;padding-top:18px}.psw .psw-delta-chart{width:100%;height:160px;display:block;margin-top:10px}.psw .psw-delta-chart rect{cursor:pointer;transition:opacity .15s}.psw .psw-delta-chart rect:hover,.psw .psw-delta-chart rect:focus{opacity:.75}
.psw details{margin-top:12px}.psw summary{cursor:pointer;color:var(--muted);font-size:12px;padding:8px 0}.psw .psw-table-scroll{max-height:240px;overflow:auto;margin-top:8px}.psw table{border-collapse:collapse;width:100%;font-size:12px;text-align:left;font-variant-numeric:tabular-nums}.psw th,.psw td{padding:9px 12px;border-bottom:1px solid var(--line)}.psw th{font-weight:550;color:var(--muted);position:sticky;top:0;background:var(--card)}.psw .psw-section{margin-top:28px}.psw .psw-works{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px;margin-top:18px}.psw .psw-work{min-width:0;border-bottom:1px solid var(--line);padding-bottom:16px}.psw .psw-cover{height:165px;border-radius:10px;background:var(--soft);overflow:hidden;margin-bottom:12px;display:grid;place-items:center;color:var(--muted)}.psw .psw-cover img{width:100%;height:100%;object-fit:cover;transition:transform .35s var(--ease)}.psw .psw-work a:hover img{transform:scale(1.025)}.psw .psw-work h3{font-size:14px;font-weight:550;margin:6px 0;overflow-wrap:anywhere}.psw .psw-work a{color:var(--ink)}.psw .psw-work small{font-size:11px;color:var(--muted)}.psw .psw-coverage{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px}.psw .psw-coverage>div{display:grid;gap:5px;padding:14px;border:1px solid var(--line);border-radius:10px;background:var(--card)}.psw .psw-coverage strong{font-size:13px}.psw .psw-coverage span,.psw .psw-coverage small{font-size:12px}.psw .psw-work-filters{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.psw .psw-work-filters button{font-size:12px;padding:6px 14px;min-height:38px}.psw .psw-work-filters button[aria-pressed=true]{color:var(--accent);background:#244044;border-color:#527f80}
.psw .psw-settings{max-width:980px}.psw .psw-setting-block{border-top:1px solid var(--line);padding:24px 0}.psw .psw-setting-grid{display:grid;grid-template-columns:180px minmax(0,1fr);gap:28px}.psw .psw-setting-body{min-width:0}.psw .psw-storage-path{display:block;white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,monospace;font-size:12px;overflow-wrap:anywhere;padding:12px;border:1px solid var(--line);border-radius:8px;background:var(--field);color:var(--ink);margin-top:7px;user-select:text}.psw .psw-storage-actions{margin-top:12px;flex-wrap:wrap}.psw .psw-storage-help{font-size:12px;color:var(--muted);margin-top:16px;line-height:1.7}.psw .psw-storage-help summary{cursor:pointer;color:var(--ink);min-height:36px;padding:6px 0}.psw .psw-storage-help ol{padding-left:20px}.psw .psw-storage-help li+li{margin-top:6px}.psw .psw-setting-body>p{color:var(--muted);font-size:12px;margin:7px 0}.psw .psw-field{display:block;font-size:12px;font-weight:550;margin:15px 0 0;color:#cbd6df}.psw input:not([type=checkbox]),.psw select,.psw textarea{width:100%;border:1px solid #42505e;border-radius:8px;min-height:44px;background:#131b22;padding:10px 12px;color:var(--ink);margin-top:7px;min-width:0;transition:border-color .16s,box-shadow .16s}.psw input::placeholder,.psw textarea::placeholder{color:#8695a2}.psw input:hover:not(:disabled),.psw select:hover:not(:disabled),.psw textarea:hover{border-color:#69828f}.psw input[aria-invalid=true]{border-color:var(--danger)}.psw .psw-field-error{display:block;color:var(--danger);font-size:12px;font-weight:400;margin-top:6px}.psw textarea{resize:vertical;line-height:1.6}.psw .psw-formrow{display:grid;grid-template-columns:1fr 1fr;gap:14px}.psw .psw-check{display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px;min-height:32px}.psw input[type=checkbox]{width:18px;height:18px;accent-color:var(--accent);flex-shrink:0}.psw .psw-toggle-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0}.psw .psw-toggle-row+.psw-toggle-row{border-top:1px solid var(--line)}.psw .psw-schedule{margin:10px 0 18px;padding:0 18px 18px;border:1px solid var(--line);border-radius:10px;background:#121b22}.psw .psw-runtime{font-size:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px;color:var(--muted);margin-top:16px}.psw .psw-runtime b{display:block;font-weight:450;color:var(--ink);margin-top:3px}.psw .psw-platformsetting{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:22px;margin-bottom:16px}.psw .psw-platformsetting .psw-card-top{margin-bottom:12px}.psw .psw-hidden{font-size:11px;background:var(--soft);color:var(--muted);padding:3px 8px;border-radius:4px}.psw .psw-timezone{position:relative}.psw .psw-zone-hint{display:flex;align-items:center;justify-content:space-between;gap:6px;color:var(--muted);font-size:11px;flex-wrap:wrap;margin-top:5px}.psw .psw-zone-hint button{font-size:11px;min-height:32px;padding:4px 6px;color:var(--accent)}.psw .psw-zone-options{position:absolute;top:72px;left:0;right:0;max-height:240px;overflow:auto;z-index:5;padding:6px;background:#202c36;border:1px solid #607786;border-radius:10px;box-shadow:0 15px 35px #0008}.psw .psw-zone-options button{width:100%;text-align:left;justify-content:flex-start;border:0;background:transparent;white-space:normal;font-size:12px;padding:10px;min-height:42px}.psw .psw-zone-options button[aria-selected=true]{background:#35565b;color:#ddfffb}.psw .psw-zone-options p{font-size:12px;padding:12px;color:var(--muted)}.psw .psw-archive-row{display:flex;align-items:center;gap:12px;padding:16px;border:1px solid var(--line);border-radius:10px;background:var(--card);margin-bottom:10px}.psw .psw-archive-info{display:grid;gap:3px;flex:1;min-width:0}.psw .psw-archive-info strong{font-size:13px;font-weight:550}.psw .psw-archive-info span{font-size:12px;overflow-wrap:anywhere}.psw .psw-archive-info small{font-size:11px;color:var(--muted)}
.psw .psw-dialog{color:var(--ink);width:min(620px,100%);max-height:100%;margin:auto;flex-shrink:0;padding:0;background:linear-gradient(150deg,#23303aea,#192129f5);backdrop-filter:blur(24px);border:1px solid #58707c80;border-radius:16px;box-shadow:0 25px 100px #0008,inset 0 1px #ffffff0a;overflow:auto;animation:psw-dialog .22s var(--ease)}.psw .psw-modal-overlay{position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:#050a10aa;backdrop-filter:blur(5px);overflow:hidden}.psw .psw-dialoghead{padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);position:sticky;top:0;background:#202b35f2;backdrop-filter:blur(14px);z-index:6}.psw .psw-dialogbody{padding:22px 24px 26px}.psw .psw-dialogbody>p{color:var(--muted);font-size:13px;margin-bottom:18px}.psw .psw-options{display:grid;grid-template-columns:1fr 1fr;gap:12px}.psw .psw-option{padding:17px 15px;justify-content:flex-start;gap:12px;font-weight:550;min-height:72px;background:#19232c}.psw .psw-option .psw-muted{margin-left:auto;font-size:11px}.psw .psw-developer{display:flex;align-items:center;gap:12px;width:100%;margin-top:18px;text-align:left;border-top:1px solid var(--line);border-radius:0;padding-top:18px}.psw .psw-developer small{display:block;font-size:11px;color:var(--muted);font-weight:400;margin-top:3px;white-space:normal}.psw .psw-dialogfooter{display:flex;gap:10px;justify-content:flex-end;margin-top:24px;flex-wrap:wrap}.psw .psw-instructions{padding-left:20px;font-size:13px;color:var(--muted)}.psw .psw-instructions li{margin-bottom:12px}.psw .psw-pair{font-family:monospace!important;font-size:12px!important;word-break:break-all}.psw .psw-prompt{font-size:12px!important;min-height:235px}.psw .psw-loading{padding:70px 20px;text-align:center;color:var(--muted)}
.psw .psw-spin{animation:psw-spin 1.2s linear infinite}@keyframes psw-spin{to{transform:rotate(360deg)}}@keyframes psw-scan{from{transform:translateX(-110%)}to{transform:translateX(330%)}}@keyframes psw-dialog{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}@keyframes psw-result{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}@keyframes psw-chart{from{opacity:.4}to{opacity:1}}@keyframes psw-complete{0%{border-color:#93dbb8;background:#93dbb814}100%{border-color:transparent;background:transparent}}

.psw[data-theme=dark]{--ink:#edf0f6;--muted:#a3adbf;--line:#343b4b;--paper:#14171e;--card:#1e232e;--accent:#9baeff;--soft:#2b3240;--green:#93dbb8;--danger:#ffb1a6;--field:#191e28;--hover-border:#607194;--accent-soft:#2a3455;--accent-hover:#b0beff;--success-bg:#20372d;--success-line:#3f6855;--warning-bg:#332d23;--warning-line:#6b583b;--warning-ink:#ead3a9;--error-bg:#38282c;--error-line:#715056;--shadow:0 5px 20px #0002;color-scheme:dark}
.psw .psw-topbar{background:var(--card);border-bottom:1px solid var(--line);backdrop-filter:none}.psw main{background:var(--paper)}.psw button:hover:not(:disabled){border-color:var(--hover-border)}.psw .psw-primary,.psw .psw-accent{color:#fff;box-shadow:0 3px 9px #4d6bfe18}.psw .psw-primary:hover:not(:disabled),.psw .psw-accent:hover:not(:disabled){background:var(--accent-hover);border-color:var(--accent-hover);box-shadow:0 4px 12px #4d6bfe25}.psw[data-theme=dark] .psw-primary,.psw[data-theme=dark] .psw-accent{color:#1b2544}.psw .psw-connection{background:transparent;border-color:transparent}.psw .psw-dot.online{box-shadow:0 0 0 3px var(--accent-soft)}
.psw .psw-card{background:var(--card);border-color:var(--line);box-shadow:var(--shadow);cursor:pointer}.psw .psw-card:hover{border-color:var(--hover-border);box-shadow:0 8px 24px #25345710}.psw .psw-card.is-syncing{border-color:var(--accent)}.psw .is-syncing .psw-status{color:var(--accent);border-color:var(--hover-border);background:var(--accent-soft)}.psw .psw-avatar{background:var(--accent-soft);color:var(--accent);border-color:var(--line)}.psw .psw-accumulation{background-image:none;padding-right:2px}.psw .psw-accumulation strong,.psw .psw-accumulation svg{color:var(--muted)}.psw .psw-logo{background:#ffedf0;color:#bc2846;box-shadow:none}.psw .psw-douyin,.psw .psw-x{background:#222630;color:#fff}.psw .psw-bilibili{background:#e5f5fd;color:#16749b}.psw[data-theme=dark] .psw-logo{background:#59313a;color:#ffd0d4}.psw[data-theme=dark] .psw-douyin,.psw[data-theme=dark] .psw-x{background:#10171d;color:#eef4f9}.psw[data-theme=dark] .psw-bilibili{background:#183d50;color:#91d8ef}
.psw .psw-notice{background:var(--warning-bg);border-color:var(--warning-line);color:var(--warning-ink)}.psw .psw-notice p{color:inherit}.psw .psw-notice.error{background:var(--error-bg);border-color:var(--error-line);color:var(--danger)}.psw .psw-platform-issue{cursor:default;align-items:flex-start;flex-wrap:wrap;font-size:12px;padding:12px;gap:10px}.psw .psw-platform-issue .psw-actions{margin-left:auto}.psw .psw-platform-issue button{font-size:12px;min-height:36px;padding:6px 10px}.psw .psw-empty{border-color:var(--hover-border);background:var(--card)}.psw .psw-result{background:var(--success-bg);border-color:var(--success-line);animation:psw-notice-expire 4s linear both}.psw .psw-result button{background:transparent}.psw .psw-metric-tabs button[aria-pressed=true]{background:var(--accent-soft)}.psw .psw-segment{background:var(--paper);border-color:var(--line)}.psw .psw-segment button[aria-pressed=true]{background:var(--card);box-shadow:var(--shadow)}.psw .psw-work-filters button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--hover-border)}
.psw .psw-field{color:var(--ink)}.psw input:not([type=checkbox]),.psw textarea{background:var(--field);border-color:var(--line)}.psw input::placeholder,.psw textarea::placeholder{color:var(--muted)}.psw input:hover:not(:disabled),.psw textarea:hover{border-color:var(--hover-border)}.psw input[aria-invalid=true]{border-color:var(--danger)}.psw .psw-schedule{background:var(--paper)}.psw .psw-zone-options{background:var(--card);border-color:var(--hover-border);box-shadow:0 12px 28px #17244820}.psw .psw-zone-options button[aria-selected=true]{background:var(--accent-soft);color:var(--accent)}.psw .psw-dialog{background:var(--card);border-color:var(--line);backdrop-filter:none;box-shadow:0 24px 80px #1c29463d}.psw .psw-dialoghead{background:var(--card);backdrop-filter:none}.psw .psw-modal-overlay{background:#26345155;backdrop-filter:blur(4px)}.psw[data-theme=dark] .psw-modal-overlay{background:#050a10aa}.psw .psw-option{background:var(--field)}
.psw .psw-theme-toggle{position:relative;width:38px;height:38px;min-height:38px;padding:0;border-radius:50%;background:var(--paper);border-color:var(--line);overflow:hidden}.psw .psw-theme-toggle svg{position:absolute;transition:transform .32s var(--ease),opacity .2s;color:var(--muted)}.psw .psw-theme-toggle svg{opacity:0;transform:rotate(-70deg) scale(.5)}.psw .psw-theme-toggle[data-mode=light] .psw-theme-sun,.psw .psw-theme-toggle[data-mode=dark] .psw-theme-moon,.psw .psw-theme-toggle[data-mode=system] .psw-theme-system{opacity:1;transform:rotate(0) scale(1)}.psw .psw-theme-toggle[data-mode=dark] .psw-theme-moon,.psw .psw-theme-toggle[data-mode=system] .psw-theme-system{color:var(--accent)}.psw .psw-theme-toggle:hover{background:var(--accent-soft)}
.psw .psw-select{position:relative;display:block;min-width:0;margin-top:7px}.psw .psw-select-trigger{display:flex;width:100%;justify-content:space-between;min-height:44px;text-align:left;background:var(--field);padding:10px 12px;border-color:var(--line);font-size:13px;font-weight:400;white-space:normal}.psw .psw-select-trigger>span{min-width:0;overflow-wrap:anywhere}.psw .psw-select-trigger[aria-expanded=true]{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}.psw .psw-select-trigger>svg{color:var(--muted);transition:transform .18s var(--ease)}.psw .psw-select-trigger[aria-expanded=true]>svg{transform:rotate(180deg)}.psw .psw-select-options{position:absolute;left:0;right:0;display:block;z-index:8;padding:5px;overflow:auto;overscroll-behavior:contain;background:var(--card);border:1px solid var(--hover-border);border-radius:10px;box-shadow:0 12px 28px #17244820}.psw .psw-select-options button{width:100%;justify-content:space-between;text-align:left;font-size:13px;font-weight:400;white-space:normal;padding:10px;border:0;border-radius:6px;background:transparent}.psw .psw-select-options button[data-active=true]{background:var(--soft)}.psw .psw-select-options button[aria-selected=true]{color:var(--accent);background:var(--accent-soft)}
.psw .psw-connection-card{display:flex;align-items:center;gap:14px;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--card);min-width:0}.psw .psw-connection-icon{display:flex;align-items:center;justify-content:center;width:46px;height:46px;flex-shrink:0;border-radius:12px;background:var(--soft);color:var(--muted)}.psw .psw-connection-copy{flex:1;min-width:0}.psw .psw-connection-title{display:flex;align-items:center;gap:8px 12px;flex-wrap:wrap}.psw .psw-connection-title strong{font-size:16px;font-weight:650;overflow-wrap:anywhere;min-width:0}.psw .psw-connection-badge{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:3px 9px;font-size:11px;font-weight:600;line-height:1.5;background:var(--soft);color:var(--muted);white-space:nowrap}.psw .psw-connection-copy p{font-size:12px;color:var(--muted);margin:7px 0 0;line-height:1.65}.psw .psw-connection-card[data-status=online]{border-color:var(--success-line)}.psw .psw-connection-card[data-status=online] .psw-connection-icon,.psw .psw-connection-card[data-status=online] .psw-connection-badge{color:var(--green);background:var(--success-bg)}.psw .psw-connection-card[data-status=offline] .psw-connection-icon,.psw .psw-connection-card[data-status=offline] .psw-connection-badge{color:var(--warning-ink);background:var(--warning-bg)}.psw .psw-connection-card[data-status=unavailable] .psw-connection-badge{color:var(--danger);background:var(--error-bg)}.psw .psw-connection-action{flex-shrink:0}.psw .psw-connection-card+.psw-note{margin-top:12px}.psw a.psw-download-extension{display:inline-flex;align-items:center;gap:7px;min-height:40px;padding:7px 12px;border:1px solid var(--hover-border);border-radius:9px;background:var(--accent-soft);color:var(--accent);font-weight:600;text-decoration:none}.psw a.psw-download-extension:hover{border-color:var(--accent);text-decoration:underline}.psw .psw-install-hint{margin:7px 0 0;font-size:12px;line-height:1.7}.psw .psw-instructions li::marker{font-weight:600;color:var(--ink)}
@container(max-width:600px){.psw .psw-connection-card{flex-wrap:wrap;padding:15px;gap:12px}.psw .psw-connection-action{width:100%;padding-top:2px}.psw .psw-connection-action button{width:100%}.psw .psw-connection-icon{width:40px;height:40px}.psw .psw-connection-title{align-items:flex-start;flex-direction:column;gap:6px}}
.psw .psw-toast-anchor{position:relative;flex-shrink:0;height:0;z-index:10;pointer-events:none}.psw .psw-toast-layer{position:absolute;top:12px;left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100% - 32px)}.psw .psw-toast-layer .psw-result{pointer-events:auto;margin:0;max-width:560px;box-shadow:0 8px 26px #17244820;overflow-wrap:anywhere}.psw .psw-result.warning{color:var(--warning-ink);background:var(--warning-bg);border-color:var(--warning-line)}.psw .psw-result.error{color:var(--danger);background:var(--error-bg);border-color:var(--error-line)}.psw .psw-result button{color:inherit}.psw .psw-result>span{min-width:0}.psw .psw-dialog{display:flex;flex-direction:column;overflow:hidden}.psw .psw-dialoghead{flex-shrink:0}.psw .psw-dialogbody{min-height:0;overflow:auto}.psw .psw-back-top{position:absolute;right:22px;bottom:20px;z-index:4;font-size:12px;min-height:38px;padding:7px 12px;box-shadow:var(--shadow);color:var(--muted)}.psw .psw-header-back{font-size:12px}.psw .psw-feedback-link{display:inline-flex;align-items:center;min-height:44px;padding:8px 4px;font-size:13px}.psw .psw-help-links{display:flex;gap:20px;align-items:center;margin-bottom:12px}.psw .psw-diagnostics{font-size:12px;line-height:1.8;resize:vertical}.psw .psw-top-actions{flex-wrap:wrap}.psw .psw-dialog .psw-toast-layer{max-width:calc(100% - 24px)}
@container(max-width:520px){.psw .psw-top-actions{justify-content:flex-start}.psw .psw-back-top{right:16px;bottom:16px}.psw .psw-toast-layer{max-width:calc(100% - 24px)}}
@keyframes psw-notice-expire{0%{opacity:0;transform:translateY(-4px)}5%,94%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-3px)}}
@container(min-width:1120px){.psw .psw-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.psw .psw-card{padding:19px}.psw .psw-big{font-size:36px}.psw .psw-cardfooter{flex-wrap:wrap}.psw .psw-cardfooter>.psw-actions{margin-left:auto}}
@container(max-width:740px){.psw main{padding:24px 22px 36px}.psw .psw-grid{grid-template-columns:1fr}.psw .psw-setting-grid{grid-template-columns:1fr;gap:15px}.psw .psw-metric-tabs button{padding:16px}.psw .psw-metric-tabs b{font-size:21px}.psw .psw-works{grid-template-columns:repeat(2,minmax(0,1fr))}.psw .psw-topbar{padding-left:max(18px,var(--dsh-frame-leading-clearance,0px));padding-right:18px;gap:8px}.psw .psw-brand{font-size:14px}.psw .psw-top-actions{gap:4px}.psw .psw-top-actions button{padding:8px 9px}}
@container(max-width:520px){.psw .psw-topbar{flex-wrap:wrap;padding-top:8px;padding-bottom:8px;gap:4px}.psw .psw-brand{font-size:14px;width:100%}.psw .psw-mark{width:30px;height:30px}.psw .psw-mark svg{width:30px;height:30px}.psw .psw-top-actions{margin-left:0;width:100%;justify-content:flex-end}.psw .psw-top-actions button{min-height:38px}.psw main{padding:22px 16px 32px}.psw h1{font-size:25px}.psw .psw-heading{gap:9px}.psw .psw-pagehead{gap:10px;margin-bottom:20px}.psw .psw-pagehead button{padding:9px 11px;font-size:12px}.psw .psw-count{font-size:11px}.psw .psw-card{padding:18px}.psw .psw-cardfooter{flex-wrap:wrap;gap:6px}.psw .psw-cardfooter>.psw-actions{margin-left:auto}.psw .psw-notice{align-items:flex-start;flex-direction:column;gap:12px}.psw .psw-detail-head{align-items:flex-start;flex-direction:column;gap:14px}.psw .psw-metric-tabs{grid-template-columns:repeat(2,minmax(0,1fr))}.psw .psw-metric-tabs button{min-height:82px}.psw .psw-metric-tabs button:nth-child(-n+2){border-bottom:1px solid var(--line)}.psw .psw-chart-panel{padding:18px 14px}.psw .psw-chart-panel>.psw-row{align-items:flex-start;gap:12px;flex-direction:column}.psw .psw-chart{height:220px}.psw .psw-coverage{grid-template-columns:1fr}.psw .psw-coverage>div{grid-template-columns:1fr 1fr;gap:6px 12px}.psw .psw-coverage small{grid-column:1/-1}.psw .psw-works{gap:13px}.psw .psw-cover{height:130px}.psw .psw-formrow,.psw .psw-runtime{grid-template-columns:1fr}.psw .psw-options{grid-template-columns:1fr}.psw .psw-dialogbody{padding:18px}.psw .psw-dialoghead{padding:13px 18px}.psw .psw-platformsetting{padding:17px}.psw .psw-schedule{padding:0 12px 15px}.psw .psw-archive-row{padding:12px;gap:9px;flex-wrap:wrap}.psw .psw-archive-row>button{margin-left:auto}.psw .psw-modal-overlay{padding:12px}.psw .psw-zone-options{max-height:200px}}

.psw .psw-onboarding{margin:0 0 25px;padding:22px;border:1px solid var(--hover-border);border-radius:16px;background:linear-gradient(125deg,var(--accent-soft),var(--card) 55%);box-shadow:var(--shadow)}.psw .psw-guide-head{display:flex;align-items:center;justify-content:space-between;gap:16px}.psw .psw-guide-head h2{font-size:19px}.psw .psw-guide-head button{font-size:12px;padding:8px 10px;color:var(--muted)}.psw .psw-guide-steps{list-style:none;padding:0;margin:22px 0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.psw .psw-guide-steps li{position:relative;min-width:0;border:1px solid var(--line);border-radius:12px;padding:16px 12px;background:var(--card);color:var(--muted);transition:border-color .2s,background .2s}.psw .psw-guide-steps li[aria-current=step]{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}.psw .psw-guide-steps h3{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink);line-height:1.5;overflow-wrap:anywhere}.psw .psw-guide-steps small{display:block;margin:7px 0 0 24px;font-size:12px}.psw .psw-guide-number{width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid var(--line);border-radius:50%;font-size:10px;color:var(--muted)}.psw .psw-guide-steps [aria-current=step] .psw-guide-number{background:var(--accent);border-color:var(--accent);color:var(--card)}.psw .psw-guide-steps [data-complete=true] .psw-guide-number{border-color:var(--success-line);color:var(--green);background:var(--success-bg)}.psw .psw-guide-art{display:block;width:72px;height:56px;margin:0 0 12px;color:var(--accent);opacity:.7}.psw .psw-guide-steps [aria-current=step] .psw-guide-art{opacity:1}.psw .psw-guide-steps [aria-current=step] .psw-guide-motion{transform-origin:55px 37px;animation:psw-guide-arrive .65s var(--ease) both}.psw .psw-guide-next{display:flex;align-items:center;justify-content:space-between;gap:22px;padding-top:18px;border-top:1px solid var(--line)}.psw .psw-guide-next p{font-size:13px;line-height:1.7;color:var(--muted);max-width:650px}.psw .psw-guide-next button{flex-shrink:0}.psw .psw-snapshot-scope{margin-top:10px;font-size:12px;line-height:1.7;color:var(--muted)}.psw .psw-snapshot-scope[data-truncated=true]{color:var(--warning-ink)}.psw .psw-snapshot-scope span{display:block;margin-top:4px}
@keyframes psw-guide-arrive{from{opacity:.2;transform:translateY(4px) scale(.86)}to{opacity:1;transform:none}}
@container(max-width:740px){.psw .psw-guide-steps{grid-template-columns:repeat(2,minmax(0,1fr))}.psw .psw-guide-steps li{display:flex;align-items:center;gap:10px}.psw .psw-guide-art{margin:0}.psw .psw-guide-next{align-items:flex-start;flex-direction:column;gap:14px}}
@container(max-width:520px){.psw .psw-pagehead{flex-wrap:wrap}.psw .psw-onboarding{padding:16px}.psw .psw-guide-head{gap:6px}.psw .psw-guide-head h2{font-size:17px}.psw .psw-guide-head .psw-actions{gap:0}.psw .psw-guide-steps{grid-template-columns:1fr;gap:8px;margin:16px 0}.psw .psw-guide-steps li{padding:10px 12px}.psw .psw-guide-art{width:58px;height:45px}.psw .psw-guide-steps small{margin-top:3px}.psw .psw-home-actions{flex-wrap:wrap;justify-content:flex-end;gap:2px}.psw .psw-guide-next button{width:100%}}
@media(prefers-reduced-motion:reduce){.psw *{animation:none!important;transition:none!important}.psw button:active:not(:disabled),.psw .psw-card:hover,.psw .psw-work a:hover img{transform:none}.psw .psw-card.is-syncing:before{width:100%;background:var(--accent);opacity:.5}}

.psw .psw-header-context{display:flex;align-items:center;gap:16px;min-width:0}.psw .psw-header-back{padding:8px 12px;min-height:44px;white-space:nowrap;color:var(--ink)}.psw .psw-header-divider{width:1px;height:18px;background:var(--line);flex-shrink:0}.psw .psw-header-title{font-size:13px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.psw .psw-github{display:grid;place-items:center;flex-shrink:0;width:44px;height:44px;color:var(--muted);border-radius:50%;text-decoration:none;transition:color .16s,background .16s}.psw .psw-github:hover{background:var(--soft);color:var(--ink)}.psw .psw-github:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.psw .psw-back-top{display:grid;place-items:center;width:48px;height:48px;min-height:48px;padding:0;border-radius:50%;background:var(--accent);border:1px solid var(--accent);color:#fff;box-shadow:0 5px 18px #3046af35;transition:background .16s,box-shadow .16s,transform .16s}.psw .psw-back-top:hover:not(:disabled){background:var(--accent-hover);border-color:var(--accent-hover);box-shadow:0 7px 22px #3046af45;transform:translateY(-2px)}.psw[data-theme=dark] .psw-back-top{color:#18213c}.psw .psw-top-tooltip{position:absolute;right:calc(100% + 10px);white-space:nowrap;background:var(--ink);color:var(--card);font-size:12px;line-height:1.4;padding:7px 10px;border-radius:7px;opacity:0;pointer-events:none;transition:opacity .12s}.psw .psw-back-top:hover .psw-top-tooltip,.psw .psw-back-top:focus-visible .psw-top-tooltip{opacity:1}
.psw .psw-version-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding-top:16px;margin-top:18px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}.psw .psw-release-trigger{font-size:12px;min-height:44px;padding:6px 12px;color:var(--muted)}.psw .psw-release-trigger:hover{color:var(--accent)}.psw .psw-release{padding:0 0 24px;margin-bottom:24px;border-bottom:1px solid var(--line)}.psw .psw-release:last-child{padding-bottom:0;margin-bottom:0;border-bottom:0}.psw .psw-release-heading{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:15px}.psw .psw-release-heading h3{margin:0;font-size:17px;font-variant-numeric:tabular-nums}.psw .psw-current-version{color:var(--accent);background:var(--accent-soft);border-radius:5px;padding:3px 7px;font-size:11px}.psw .psw-release-date{margin-left:auto;font-size:12px;color:var(--muted)}.psw .psw-release ul{padding:0;margin:0;list-style:none;display:grid;gap:12px}.psw .psw-release li{display:flex;align-items:baseline;gap:12px;font-size:13px;line-height:1.7}.psw .psw-release-kind{flex-shrink:0;font-size:11px;color:var(--muted)}
@container(max-width:740px){.psw .psw-header-context{gap:12px}.psw .psw-top-actions .psw-connection>span:last-child{display:none}.psw .psw-top-actions .psw-connection{min-width:44px}.psw .psw-header-back{font-size:12px}}
@container(max-width:520px){.psw .psw-header-context{width:100%;min-height:40px}.psw .psw-header-back{min-height:40px}.psw .psw-top-actions{justify-content:flex-end}.psw .psw-back-top{right:20px;bottom:20px}.psw main{padding-bottom:88px}}
@media(prefers-reduced-motion:reduce){.psw .psw-back-top,.psw .psw-top-tooltip{transition:none}.psw .psw-back-top:hover:not(:disabled){transform:none}}
`;
    async function api(path, body) {
      const response = await fetch(
        new URL("api/personal-social/" + path, document.baseURI).pathname,
        {
          method: body ? "POST" : "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          ...(body ? { body: JSON.stringify(body) } : {}),
        },
      );
      let data;
      try {
        data = await response.json();
      } catch {
        throw Error("本地服务暂未就绪，请稍后重试。");
      }
      if (!response.ok) throw Error(data.error || "本地请求失败");
      return data;
    }
    function Avatar({ account }) {
      const [failed, setFailed] = React.useState(false);
      return account.avatar && !failed
        ? h("img", {
            src: account.avatar,
            className: "psw-avatar",
            alt: "",
            referrerPolicy: "no-referrer",
            onError: () => setFailed(true),
          })
        : h(
            "span",
            { className: "psw-avatar", "aria-hidden": true },
            (account.name || "我").slice(0, 1),
          );
    }
    function Delta({ rows, metricKey = "fans" }) {
      const d = change(rows || [], metricKey);
      return d
        ? h(
            "span",
            { className: "psw-delta" + (d.value < 0 ? " negative" : "") },
            `${d.estimated ? "约 " : ""}${d.value >= 0 ? "+" : ""}${d.value.toLocaleString("zh-CN")}`,
            h("small", null, d.label, d.estimated ? " · 估算" : ""),
          )
        : null;
    }
    function Chart({
      account,
      metricKey = "fans",
      days = 30,
      mini = false,
      zone,
    }) {
      const [active, setActive] = React.useState(null);
      const [width, setWidth] = React.useState(700);
      const svgRef = React.useRef(null);
      React.useEffect(() => {
        if (mini || !svgRef.current || typeof ResizeObserver === "undefined")
          return;
        const observer = new ResizeObserver((entries) =>
          setWidth(Math.max(250, entries[0].contentRect.width)),
        );
        observer.observe(svgRef.current);
        return () => observer.disconnect();
      }, [mini]);
      const end = today(zone),
        start = dayShift(end, 1 - days),
        rows = Array.from({ length: days }, (_, i) => {
          const day = dayShift(start, i);
          return (
            dailyLatest(account.daily).find((r) => r.date === day) || {
              date: day,
            }
          );
        });
      const valid = rows.filter((r) => number(r[metricKey]) !== null),
        values = valid.map((r) => number(r[metricKey])),
        low = values.length ? Math.min(...values) : 0,
        high = values.length ? Math.max(...values) : 1,
        pad = Math.max((high - low) * 0.2, high * 0.005, 1),
        min = Math.max(0, low - pad),
        max = high + pad,
        W = mini ? 700 : width,
        H = mini ? 90 : 210,
        L = mini ? 4 : 63,
        R = mini ? 4 : 13,
        T = mini ? 9 : 16,
        B = mini ? 9 : 30,
        x = (i) => L + (i / (days - 1)) * (W - L - R),
        y = (v) => T + ((max - v) / (max - min || 1)) * (H - T - B);
      let previous = false;
      const path = rows
        .map((r, i) => {
          const v = number(r[metricKey]);
          if (v === null) {
            previous = false;
            return "";
          }
          const d = `${previous ? "L" : "M"}${x(i).toFixed(2)},${y(v).toFixed(2)}`;
          previous = true;
          return d;
        })
        .join(" ");
      const chosen =
        rows.find((r) => r.date === active && number(r[metricKey]) !== null) ||
        valid.at(-1);
      const chart = h(
        "svg",
        {
          ref: svgRef,
          className: mini ? undefined : "psw-chart",
          viewBox: `0 0 ${W} ${H}`,
          preserveAspectRatio: "none",
          role: mini ? "img" : "group",
          "aria-label": `${days}天${labels[metricKey]}趋势，${valid.length}天有记录，缺失日期不连线`,
        },
        !mini &&
          [0, 0.5, 1].map((v, i) => {
            const at = min + (max - min) * v;
            return h(
              "g",
              { key: i },
              h("line", {
                x1: L,
                y1: y(at),
                x2: W - R,
                y2: y(at),
                stroke: "var(--line)",
                strokeDasharray: "3 5",
              }),
              h(
                "text",
                { x: L - 12, y: y(at) + 4, textAnchor: "end" },
                Math.round(at).toLocaleString("zh-CN"),
              ),
            );
          }),
        h("path", {
          d: path,
          fill: "none",
          stroke: "var(--accent)",
          strokeWidth: mini ? 2.2 : 2.1,
          vectorEffect: "non-scaling-stroke",
          strokeLinejoin: "round",
        }),
        rows.map(
          (r, i) =>
            number(r[metricKey]) !== null &&
            h(
              "circle",
              {
                key: r.date,
                cx: x(i),
                cy: y(number(r[metricKey])),
                r: mini ? 2.2 : active === r.date ? 5 : 3.3,
                fill: mini ? "var(--accent)" : "var(--card)",
                stroke: "var(--accent)",
                strokeWidth: 1.6,
                tabIndex: mini ? undefined : 0,
                role: mini ? undefined : "button",
                "aria-label": `${r.date}，${labels[metricKey]} ${metric(r[metricKey])}`,
                onMouseEnter: () => setActive(r.date),
                onFocus: () => setActive(r.date),
                onClick: () => setActive(r.date),
                onKeyDown: (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive(r.date);
                  }
                },
              },
              h("title", null, `${r.date}: ${metric(r[metricKey])}`),
            ),
        ),
        !mini &&
          [0, Math.floor((days - 1) / 2), days - 1].map((i) =>
            h(
              "text",
              {
                key: i,
                x: x(i),
                y: H - 5,
                textAnchor:
                  i === 0 ? "start" : i === days - 1 ? "end" : "middle",
              },
              rows[i].date.slice(5).replace("-", "/"),
            ),
          ),
      );
      if (mini && valid.length < 2) return h("div", { className: "psw-accumulation" }, h(Icon, { name: "clock", size: 18 }), h("strong", null, `已记录 ${valid.length} 天`));
      if (mini)
        return h(
          "div",
          { className: "psw-spark" },
          chart,
          h("span", null, "近 30 天"),
        );
      return h(
        React.Fragment,
        null,
        h(
          "div",
          { className: "psw-chart-summary", "aria-live": "polite" },
          chosen
            ? h(
                React.Fragment,
                null,
                chosen.date.replaceAll("-", " / "),
                h("strong", null, metric(chosen[metricKey])),
                chosen[metricKey]?.approximate ? "平台约数" : "",
              )
            : "这个时间段还没有记录",
        ),
        valid.length < 2 ? h("div", { className: "psw-chart-empty" }, h(Icon, { name: "clock", size: 24 }), h("p", null, valid.length ? "趋势正在积累" : "这个时间段暂无记录"), h("small", null, "至少两天的日记录可形成趋势")) : chart,
        h(
          "p",
          { className: "psw-muted", style: { fontSize: 12 } },
          valid.length === 1
            ? "已记录 1 天，后续同步将逐步形成趋势。"
            : `已记录 ${valid.length} / ${days} 天 · 空白日期未采集`,
        ),
        h(DailyBars, {
          account,
          rows,
          metricKey,
          width: W,
          active,
          onSelect: setActive,
        }),
        h(
          "details",
          null,
          h("summary", null, "查看每日数值与净变化"),
          h(
            "div",
            { className: "psw-table-scroll" },
            h(
              "table",
              null,
              h(
                "thead",
                null,
                h(
                  "tr",
                  null,
                  h("th", null, "日期 / 时区"),
                  h("th", null, labels[metricKey]),
                  h("th", null, "较昨日"),
                ),
              ),
              h(
                "tbody",
                null,
                rows
                  .flatMap((r) => {
                    const raw = (account.daily || []).filter(
                      (v) => v.date === r.date,
                    );
                    return raw.length ? raw : [r];
                  })
                  .reverse()
                  .map((r) => {
                    const prev = (account.daily || [])
                      .filter(
                        (p) =>
                          p.date === dayShift(r.date, -1) &&
                          p.timeZone === r.timeZone,
                      )
                      .sort((a, b) => String(a.at).localeCompare(String(b.at)))
                      .at(-1);
                    const v = number(r[metricKey]),
                      pv = number(prev?.[metricKey]),
                      delta = v !== null && pv !== null ? v - pv : null;
                    return h(
                      "tr",
                      { key: r.date + (r.timeZone || "") },
                      h(
                        "td",
                        null,
                        r.date,
                        r.timeZone &&
                          h(
                            "small",
                            {
                              className: "psw-muted",
                              style: { display: "block" },
                            },
                            r.timeZone,
                          ),
                      ),
                      h("td", null, metric(r[metricKey])),
                      h(
                        "td",
                        null,
                        delta === null
                          ? "—"
                          : `${r[metricKey].approximate || prev[metricKey].approximate ? "约 " : ""}${delta >= 0 ? "+" : ""}${delta.toLocaleString("zh-CN")}`,
                      ),
                    );
                  }),
              ),
            ),
          ),
        ),
      );
    }
    function DailyBars({ account, rows, metricKey, width, active, onSelect }) {
      const values = rows.map((row) => ({
        ...row,
        delta: dailyDifference(account, row, metricKey),
      }));
      const valid = values.filter((row) => row.delta !== null);
      const max = Math.max(1, ...valid.map((row) => Math.abs(row.delta.value)));
      const left = 63,
        right = 13,
        top = 15,
        baseline = 73,
        bottom = 131,
        height = 160;
      const step = (width - left - right) / rows.length,
        barWidth = Math.max(2, Math.min(18, step * 0.65));
      const y = (value) => baseline - (value / max) * (baseline - top);
      const selected =
        values.find((row) => row.date === active) || valid.at(-1);
      return h(
        "section",
        {
          className: "psw-daily-chart",
          "aria-label": labels[metricKey] + "每日净变化",
        },
        h(
          "div",
          { className: "psw-row" },
          h("h3", null, "每日净变化"),
          h(
            "span",
            { className: "psw-muted", style: { fontSize: 12 } },
            "仅比较相邻自然日",
          ),
        ),
        h(
          "div",
          { className: "psw-chart-summary", "aria-live": "polite" },
          selected
            ? h(
                React.Fragment,
                null,
                selected.date.replaceAll("-", " / "),
                h("strong", null, deltaLabel(selected.delta)),
                !selected.delta && "缺少同一时区的前一日记录",
              )
            : "尚无相邻两天的有效记录",
        ),
        h(
          "svg",
          {
            className: "psw-delta-chart",
            viewBox: `0 0 ${width} ${height}`,
            preserveAspectRatio: "none",
            role: "group",
            "aria-label": `${rows.length}天每日净变化，${valid.length}天可比较；缺失数据留空`,
          },
          [max, 0, -max].map((value) =>
            h(
              "g",
              { key: value },
              h("line", {
                x1: left,
                x2: width - right,
                y1: y(value),
                y2: y(value),
                stroke: value === 0 ? "#c5beae" : "#e9e5da",
                strokeDasharray: value === 0 ? undefined : "3 5",
              }),
              h(
                "text",
                { x: left - 12, y: y(value) + 4, textAnchor: "end" },
                (value > 0 ? "+" : "") +
                  Math.round(value).toLocaleString("zh-CN"),
              ),
            ),
          ),
          values.map(
            (row, i) =>
              row.delta !== null &&
              h(
                "rect",
                {
                  key: row.date,
                  x: left + (i + 0.5) * step - barWidth / 2,
                  y:
                    row.delta.value === 0
                      ? baseline - 1
                      : Math.min(baseline, y(row.delta.value)),
                  width: barWidth,
                  height: Math.max(2, Math.abs(y(row.delta.value) - baseline)),
                  rx: Math.min(2, barWidth / 3),
                  fill:
                    row.delta.value < 0
                      ? "var(--accent)"
                      : row.delta.value > 0
                        ? "var(--green)"
                        : "#989384",
                  stroke: active === row.date ? "var(--ink)" : "none",
                  strokeWidth: 1.2,
                  tabIndex: 0,
                  role: "button",
                  "aria-label": `${row.date}，${labels[metricKey]}净变化 ${deltaLabel(row.delta)}`,
                  onMouseEnter: () => onSelect(row.date),
                  onFocus: () => onSelect(row.date),
                  onClick: () => onSelect(row.date),
                  onKeyDown: (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(row.date);
                    }
                  },
                },
                h("title", null, `${row.date}：${deltaLabel(row.delta)}`),
              ),
          ),
          [0, Math.floor((rows.length - 1) / 2), rows.length - 1].map((i) =>
            h(
              "text",
              {
                key: i,
                x: left + (i + 0.5) * step,
                y: height - 5,
                textAnchor:
                  i === 0 ? "start" : i === rows.length - 1 ? "end" : "middle",
              },
              rows[i].date.slice(5).replace("-", "/"),
            ),
          ),
        ),
        h(
          "p",
          { className: "psw-muted", style: { fontSize: 12 } },
          "正值为净增加，负值为净减少；约数差值标记为估算。",
        ),
      );
    }
    function Modal({ title, onClose, notification, scrollLabel, children }) {
      const ref = React.useRef(null), closing = React.useRef(false);
      function close() {
        if (closing.current) return;
        if (!ref.current?.animate || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return onClose();
        closing.current = true;
        ref.current.animate([{ opacity: 1, transform: "translateY(0) scale(1)" }, { opacity: 0, transform: "translateY(6px) scale(.99)" }], { duration: 120, easing: "ease-in", fill: "forwards" }).finished.then(onClose, onClose);
      }
      React.useEffect(() => {
        const previous = document.activeElement;
        const first = ref.current?.querySelector(
          'button, input, select, textarea, a[href], [tabindex="0"]',
        );
        (first || ref.current)?.focus();
        return () => {
          requestAnimationFrame(() => {
            if (previous?.isConnected) previous.focus?.();
          });
        };
      }, []);
      function onKeyDown(event) {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          close();
          return;
        }
        if (event.key !== "Tab") return;
        const available = [
          ...ref.current.querySelectorAll(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex="0"]',
          ),
        ].filter((node) => node.getClientRects().length);
        const first = available[0],
          last = available.at(-1);
        if (!first) {
          event.preventDefault();
          ref.current.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      return h(
        "div",
        {
          className: "psw-modal-overlay",
          onClick: (event) => {
            if (event.target === event.currentTarget) close();
          },
        },
        h(
          "div",
          {
            ref,
            className: "psw-dialog",
            role: "dialog",
            "aria-modal": true,
            "aria-label": title,
            tabIndex: -1,
            onKeyDown,
          },
          h(
            "div",
            { className: "psw-dialoghead" },
            h("h2", null, title),
            h(
              "button",
              {
                type: "button",
                className: "psw-icon-button psw-quiet",
                "aria-label": "关闭",
                onClick: close,
              },
              h(Icon, { name: "close" }),
            ),
          ),
          notification,
          h("div", { className: "psw-dialogbody", tabIndex: scrollLabel ? 0 : undefined, role: scrollLabel ? "region" : undefined, "aria-label": scrollLabel }, children),
        ),
      );
    }
    function Schedule({
      platform,
      config,
      account,
      onSave,
      pending,
      onUnbind,
      issueContent,
    }) {
      const defaults = {
          enabled: false,
          kind: "daily",
          time: "09:00",
          hours: 6,
          timeZone: localZone(),
        },
        [draft, setDraft] = React.useState({ ...defaults, ...config.schedule }),
        [dirty, setDirty] = React.useState(false),
        [saved, setSaved] = React.useState(false),
        [validation, setValidation] = React.useState("");
      React.useEffect(() => {
        if (!dirty) setDraft({ ...defaults, ...config.schedule });
      }, [JSON.stringify(config.schedule)]);
      const update = (patch) => {
        setDraft({ ...draft, ...patch });
        setDirty(true);
        setSaved(false);
        setValidation("");
      };
      return h(
        "section",
        { className: "psw-platformsetting" },
        h(
          "div",
          { className: "psw-card-top" },
          h(Logo, { id: platform.id }),
          h(
            "div",
            null,
            h("h3", null, platform.label),
            h("small", { className: "psw-muted" }, account.name),
          ),
          config.visible === false &&
            h("span", { className: "psw-hidden" }, "首页已隐藏"),
        ),
        h(
          "div",
          { className: "psw-toggle-row" },
          h(
            "label",
            { className: "psw-check" },
            h("input", {
              type: "checkbox",
              checked: config.visible !== false,
              disabled: pending,
              onChange: (e) =>
                onSave({ platform: platform.id, visible: e.target.checked }),
            }),
            "在首页展示",
          ),
          h("small", { className: "psw-muted" }, "隐藏不影响自动同步"),
        ),
        h(
          "div",
          { className: "psw-toggle-row" },
          h(
            "label",
            { className: "psw-check" },
            h("input", {
              type: "checkbox",
              checked: draft.enabled,
              disabled: pending,
              onChange: (e) => update({ enabled: e.target.checked }),
            }),
            "自动同步",
          ),
          h(Icon, { name: "clock", size: 16 }),
        ),
        issueContent,
        h(
          "p",
          {
            className: "psw-muted",
            style: { fontSize: 12, marginBottom: 12 },
          },
          "自动同步时宿主与浏览器需保持运行。需要登录时会暂停。",
        ),
        h(
          "div",
          { className: "psw-schedule" },
          h(
            "div",
            { className: "psw-formrow" },
            h(
              "div",
              { className: "psw-field" },
              "同步频率",
              h(
                Select,
                {
                  "aria-label": "同步频率",
                  value: draft.kind,
                  disabled: pending,
                  onChange: (e) => update({ kind: e.target.value }),
                },
                h("option", { value: "daily" }, "每天"),
                h("option", { value: "interval" }, "固定间隔"),
              ),
            ),
            draft.kind === "daily"
              ? h(
                  "label",
                  { className: "psw-field" },
                  "时间",
                  h("input", {
                    type: "time",
                    required: true,
                    value: draft.time,
                    disabled: pending,
                    onChange: (e) => update({ time: e.target.value }),
                  }),
                )
              : h(
                  "div",
                  { className: "psw-field" },
                  "间隔",
                  h(
                    Select,
                    {
                      "aria-label": "间隔",
                      value: draft.hours,
                      disabled: pending,
                      onChange: (e) =>
                        update({ hours: Number(e.target.value) }),
                    },
                    [1, 3, 6, 12].map((n) =>
                      h("option", { value: n, key: n }, `每 ${n} 小时`),
                    ),
                  ),
                ),
          ),
          h(TimeZonePicker, { id: "timezone-" + platform.id, value: draft.timeZone, disabled: pending, onChange: timeZone => update({ timeZone }) }),
          h(
            "div",
            { className: "psw-runtime" },
            h(
              "div",
              null,
              "下次计划",
              h(
                "b",
                null,
                dirty
                  ? draft.enabled
                    ? "保存后更新计划"
                    : "保存后关闭"
                  : config.schedule?.enabled
                    ? date(config.nextRunAt)
                    : "未开启",
              ),
            ),
            h(
              "div",
              null,
              "最后尝试",
              h("b", null, date(config.lastAttemptAt)),
            ),
            h("div", null, "最后成功", h("b", null, date(account.syncedAt))),
            h(
              "div",
              null,
              "最近结果",
              h(
                "b",
                null,
                config.pausedReason ||
                  (typeof config.lastResult === "string"
                    ? config.lastResult
                    : config.lastResult?.message) ||
                  "尚无记录",
              ),
            ),
          ),
          h(
            "div",
            { className: "psw-actions", style: { marginTop: 18 } },
            h(
              "button",
              {
                className: "psw-primary",
                disabled: pending || !dirty,
                onClick: async () => {
                  try {
                    new Intl.DateTimeFormat("zh-CN", {
                      timeZone: draft.timeZone,
                    }).format();
                  } catch {
                    setValidation(
                      "请输入有效的 IANA 时区，例如 Asia/Shanghai。",
                    );
                    return;
                  }
                  if (
                    draft.kind === "daily" &&
                    !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time)
                  ) {
                    setValidation("请选择有效的每日同步时间。");
                    return;
                  }
                  if (
                    await onSave({ platform: platform.id, schedule: draft })
                  ) {
                    setDirty(false);
                    setSaved(true);
                  }
                },
              },
              "保存计划",
            ),
            validation &&
              h("p", { className: "psw-danger", role: "alert" }, validation),
            saved &&
              h(
                "span",
                {
                  className: "psw-feedback",
                  role: "status",
                  style: { margin: 0 },
                },
                "计划已保存",
              ),
          ),
        ),
        h(
          "div",
          { className: "psw-row" },
          h(
            "small",
            { className: "psw-muted" },
            "解除绑定后，历史保留为只读档案。",
          ),
          h(
            "button",
            {
              className: "psw-quiet psw-danger",
              onClick: () => onUnbind(platform.id),
              disabled: pending,
            },
            "解除绑定",
          ),
        ),
      );
    }
    function Developer() {
      const [form, setForm] = React.useState({
          name: "",
          domain: "",
          url: "",
          metrics: "粉丝数、关注数、作品总数",
          login: "需要登录后读取自己的账号",
        }),
        [prompt, setPrompt] = React.useState(""),
        [copied, setCopied] = React.useState(false),
        [copyError, setCopyError] = React.useState(""),
        [errors, setErrors] = React.useState({});
      const field = (key, title, placeholder) =>
        h(
          "label",
          { className: "psw-field" },
          title,
          h("input", {
            required: true,
            value: form[key],
            id: "developer-" + key,
            "aria-invalid": !!errors[key],
            "aria-describedby": errors[key] ? "developer-" + key + "-error" : undefined,
            placeholder,
            onChange: (e) => {
              setForm({ ...form, [key]: e.target.value });
              setErrors({ ...errors, [key]: "" });
              setCopyError("");
              setPrompt("");
              setCopied(false);
            },
          }),
          errors[key] && h("span", { className: "psw-field-error", id: "developer-" + key + "-error", role: "alert" }, errors[key]),
        );
      function generate(e) {
        e.preventDefault();
        let parsed, official;
        const nextErrors = {};
        if (!form.name.trim()) nextErrors.name = "请输入平台名称。";
        if (!form.metrics.trim()) nextErrors.metrics = "请填写希望采集的指标。";
        if (!form.login.trim()) nextErrors.login = "请说明平台是否需要登录。";
        try {
          const raw = form.domain.trim();
          official = new URL(raw.includes("://") ? raw : "https://" + raw);
          if (official.protocol !== "https:" || official.username || official.password || official.port || /[\\\s]/.test(raw) || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(official.hostname)) throw Error();
        } catch { nextErrors.domain = "填写有效域名或 HTTPS 官网地址，不要包含登录凭据或端口。"; }
        try {
          parsed = new URL(form.url.trim());
          if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port || /[\\\s]/.test(form.url.trim())) throw Error();
          if (!nextErrors.domain && !(parsed.hostname === official.hostname || parsed.hostname.endsWith("." + official.hostname))) {
            nextErrors.url = "个人主页必须属于官方域名或其子域名。";
          }
        } catch { nextErrors.url = "填写不含登录凭据的 HTTPS 个人主页链接。"; }
        setErrors(nextErrors);
        setPrompt("");
        if (Object.keys(nextErrors).length) return;
        setCopyError("");
        setForm({ ...form, domain: official.hostname });
        setPrompt(
          `请为当前 personal-social-workbench 项目增加 ${form.name} 的只读账号接入。先阅读项目现状、docs/PLATFORM-DEVELOPMENT.md 与 docs/superpowers/specs/2026-10-11-cross-platform-v04-design.md，保持包身份 dsh-workbench-personal-social-local 与 DSH customFrame。\n\n平台信息\n- 官方域名：${official.hostname}\n- 个人主页示例：${parsed.origin}${parsed.pathname}\n- 指标与定义：${form.metrics}\n- 登录要求：${form.login}\n\n请检查并扩展 src/platforms.mjs 的平台定义与指标、src/collector.mjs 的可见 DOM 提取、extension/adapter.mjs 与 extension/background.mjs 的受限域名连接，以及 src/browser-bridge.mjs 的浏览器扩展通路。仅增加精确必要域名权限，并在 scripts/build.mjs 中保持连接器构建一致。\n\n通过 src/core.mjs 与 src/store.mjs 的 v2 持久化入口保存账号身份、快照和 daily 日记录；成功写入前核对稳定账号身份，账号不符拒绝覆盖。未知指标为 null，保留 display / value / approximate；没有观测的日期留空，仅相邻自然日可计算每日净变化。作品列表要注明当前页面范围，不将列表长度当作品总数。\n\n沿用 dsh/index.js 的 state、sync、login、settings、unbind 接口以及 src/scheduler.mjs 的独立计划和串行队列。恢复登录沿用原平台与浏览器，不复制登录态、不导出 Cookie 或凭据，不发布、不点赞、不执行任意用户脚本。自动任务不可抢焦点；等待登录、验证、离线、网络失败、解析失败和身份不符应给出准确可恢复状态，失败保留最后成功快照。\n\nsrc/client.js 从 platforms 元数据展示新平台，复用总览、7/30/90 天缺口趋势、每日变化、作品与设置；首次同步成功才绑定。保持宿主共享 React 单文件加载方式与 石墨冷光 / 银白文字 / 冰青强调设计。\n\n先增加有效与缺失指标、约数、中英文数字、身份校验、本人内容边界、错误恢复和自动后台任务的测试，再实现。运行测试、构建和包检查，并进行真实浏览器与窄容器验证；清楚标记尚未验证的真实账号读取。请勿自动安装、执行第三方脚本或将未经验证的接入标记为可用。`,
        );
      }
      return h(
        React.Fragment,
        null,
        h(
          "p",
          null,
          "生成适用于这个工作台的开发任务。完成实现和验证后，新平台才会出现在添加列表。",
        ),
        h(
          "form",
          { onSubmit: generate, noValidate: true },
          h(
            "div",
            { className: "psw-formrow" },
            field("name", "平台名称", "例如：即刻"),
            field("domain", "官方域名 / 官网地址", "example.com 或 https://example.com"),
          ),
          field("url", "个人主页链接示例", "https://example.com/user/example"),
          field("metrics", "希望采集的指标与定义", "粉丝数、关注数…"),
          field("login", "登录要求", "需要登录后读取自己的账号"),
          h(
            "div",
            { className: "psw-dialogfooter" },
            h(
              "button",
              { type: "submit", className: "psw-primary" },
              h(Icon, { name: "code" }),
              "生成开发任务",
            ),
          ),
        ),
        copyError &&
          h("p", { className: "psw-danger", role: "alert" }, copyError),
        prompt && h("p", { className: "psw-feedback", role: "status" }, "开发任务已生成，可检查后复制"),
        prompt &&
          h(
            "div",
            null,
            h(
              "label",
              { className: "psw-field" },
              "开发任务",
              h("textarea", {
                className: "psw-prompt",
                readOnly: true,
                value: prompt,
                onFocus: (e) => e.currentTarget.select(),
              }),
            ),
            h(
              "div",
              { className: "psw-dialogfooter" },
              h(
                "button",
                {
                  className: "psw-accent",
                  onClick: async () => {
                    try {
                      await navigator.clipboard.writeText(prompt);
                      setCopied(true);
                      setCopyError("");
                    } catch {
                      setCopyError(
                        "无法访问剪贴板，请选中上方任务文字后复制。",
                      );
                    }
                  },
                },
                h(Icon, { name: "copy" }),
                copied ? "已复制" : "复制开发任务",
              ),
            ),
          ),
      );
    }
    function StorageSettings({ storage, onNotice }) {
      const [busy, setBusy] = React.useState(false), [failure, setFailure] = React.useState("");
      const downloading = React.useRef(false), pathRef = React.useRef(null);
      const path = storage?.path || "";
      async function copyPath() {
        try { await navigator.clipboard.writeText(path); setFailure(""); onNotice("存储路径已复制。"); }
        catch { pathRef.current?.focus(); const selection = window.getSelection(), range = document.createRange(); if (selection && pathRef.current) { range.selectNodeContents(pathRef.current); selection.removeAllRanges(); selection.addRange(range); } setFailure("无法自动复制，请复制已选中的存储路径。"); }
      }
      async function downloadBackup() {
        if (downloading.current) return;
        downloading.current = true; setBusy(true); setFailure("");
        try {
          const response = await fetch(new URL("api/personal-social/backup", document.baseURI).pathname, {
            method: "POST", credentials: "same-origin", cache: "no-store",
            headers: { "Content-Type": "application/json" }, body: "{}",
          });
          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw Error(error.error || "备份未生成，请稍后重试。");
          }
          const blob = await response.blob();
          const url = URL.createObjectURL(blob), link = document.createElement("a");
          link.href = url;
          link.download = /filename="([^"/\\]+)"/.exec(response.headers.get("Content-Disposition") || "")?.[1]
            || `personal-social-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
          document.body.appendChild(link);
          try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
          onNotice("已发起备份下载，请在浏览器下载列表中确认保存。");
        } catch (error) { setFailure(error.message || "备份下载未完成，请重试。"); }
        finally { downloading.current = false; setBusy(false); }
      }
      return h("section", { className: "psw-setting-block psw-setting-grid", "aria-labelledby": "psw-storage-title" },
        h("h2", { id: "psw-storage-title" }, "数据与存储"),
        h("div", { className: "psw-setting-body" },
          h("p", null, "账号、历史记录和作品库保存在这台电脑上。关闭页面不会删除数据。"),
          h("p", { className: "psw-field", id: "psw-storage-label" }, "当前存储位置"),
          h("code", { id: "psw-storage-path", className: "psw-storage-path", ref: pathRef, tabIndex: 0, "aria-labelledby": "psw-storage-label" },
            path || "暂未获取到路径，请刷新；更新后可能需要重启工作台服务。"),
          h("div", { className: "psw-actions psw-storage-actions" },
            h("button", { type: "button", onClick: copyPath, disabled: !path }, h(Icon, { name: "copy" }), "复制路径"),
            h("button", { type: "button", onClick: downloadBackup, disabled: busy || !path, "aria-busy": busy },
              h(Icon, { name: "download" }), busy ? "正在生成备份…" : "下载数据备份")),
          h("p", { className: "psw-note" }, "备份包含已保存的账号、历史记录、作品库和同步设置，不含浏览器配对或登录凭据。文件含个人数据，请妥善保管。"),
          failure && h("p", { className: "psw-field-error", role: "alert" }, failure),
          h("details", { className: "psw-storage-help" }, h("summary", null, "如何恢复备份"),
            h("p", null, "目前支持手动恢复，请先停止独立服务；使用 DSH Desktop 时完整退出应用。"),
            h("ol", null,
              h("li", null, "在上方目录中，将现有 accounts.json 另存一份，避免覆盖唯一副本。"),
              h("li", null, "复制下载的备份到该目录，命名为 accounts.json；保留其他文件不变。"),
              h("li", null, "重新启动并核对账号和历史记录。备份中的同步计划也会恢复；需要时重新连接浏览器。")),
            h("p", null, "恢复会替换当前业务数据，不会合并备份之后新增的记录。"))));
    }
    function ConnectionCard({ connection, children }) {
      const status = connection?.available === false ? "unavailable" : connection?.paired ? connection.online ? "online" : "offline" : "unpaired";
      const labels = { online: "已连接", offline: "已授权 · 离线", unpaired: "等待授权", unavailable: "服务不可用" };
      const descriptions = { online: "浏览器已就绪，可以开始同步。", offline: "打开已授权浏览器，并确认扩展已启用。", unpaired: "先安装扩展，再用连接码授权这台工作台。", unavailable: "本机连接服务未启动，请重启工作台后重试。" };
      return h("div", { className: "psw-connection-card", "data-status": status },
        h("span", { className: "psw-connection-icon" }, h(Icon, { name: "browser", size: 24 })),
        h("div", { className: "psw-connection-copy" },
          h("div", { className: "psw-connection-title" },
            h("strong", null, connection?.paired ? connection.label || "已授权浏览器" : "尚未连接浏览器"),
            h("span", { className: "psw-connection-badge" }, h(Icon, { name: status === "online" ? "check" : status === "unavailable" ? "alert" : "clock", size: 14 }), labels[status])),
          h("p", null, descriptions[status])),
        children && h("div", { className: "psw-connection-action" }, children));
    }
    function Panel() {
      const [state, setState] = React.useState(null),
        [error, setError] = React.useState(""),
        [pending, setPending] = React.useState(false),
        [view, setView] = React.useState("overview"),
        [selected, setSelected] = React.useState(null),
        [modal, setModal] = React.useState(null),
        [addPlatform, setAddPlatform] = React.useState(null),
        [url, setUrl] = React.useState(""),
        [pair, setPair] = React.useState(null),
        [metricKey, setMetricKey] = React.useState("fans"),
        [days, setDays] = React.useState(30),
        [notice, setNoticeState] = React.useState(null),
        [localSync, setLocalSync] = React.useState({}),
        [highlighted, setHighlighted] = React.useState({}),
        [workKind, setWorkKind] = React.useState("全部"),
        [workPage, setWorkPage] = React.useState(1),
        [themeMode, setThemeMode] = React.useState(savedTheme),
        [systemDark, setSystemDark] = React.useState(systemIsDark),
        [platformErrors, setPlatformErrors] = React.useState({}),
        [operationError, setOperationError] = React.useState(null),
        [guideMode, setGuideMode] = React.useState(savedGuide),
        [showTop, setShowTop] = React.useState(false),
        [copyError, setCopyError] = React.useState("");
      const noticeSerial = React.useRef(0), pairingAttempt = React.useRef(null);
      const setNotice = (message, tone = "success") => setNoticeState(message ? { message, tone, id: ++noticeSerial.current } : null);
      const theme = themeMode === "system" ? (systemDark ? "dark" : "light") : themeMode;
      React.useEffect(() => {
        if (themeMode !== "system") return;
        const media = window.matchMedia?.(systemThemeQuery);
        if (!media) return;
        const update = () => setSystemDark(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
      }, [themeMode]);
      const alive = React.useRef(true),
        mainRef = React.useRef(null),
        workGridRef = React.useRef(null),
        pageNavigationRef = React.useRef(null),
        headerRef = React.useRef(null),
        scrollRef = React.useRef(0),
        detailPreferences = React.useRef({}),
        manualJobs = React.useRef({}),
        guideInitial = React.useRef(null);
      React.useEffect(() => {
        for (const element of [headerRef.current, mainRef.current])
          if (element) element.inert = !!modal;
        return () => {
          for (const element of [headerRef.current, mainRef.current])
            if (element) element.inert = false;
        };
      }, [modal]);
      React.useEffect(() => {
        const navigation = pageNavigationRef.current;
        if (!navigation) return;
        pageNavigationRef.current = null;
        const frame = requestAnimationFrame(() => {
          const main = mainRef.current, grid = workGridRef.current;
          if (!main || !grid) return;
          // Move only the workbench's scroll container after the new page renders.
          const top = main.scrollTop + grid.getBoundingClientRect().top - main.getBoundingClientRect().top - 16;
          main.scrollTo({ top: Math.max(0, top), behavior: "auto" });
          if (navigation.keyboard) grid.focus({ preventScroll: true });
        });
        return () => { if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame); };
      }, [workPage]);
      const changeWorkPage = (page, event) => {
        pageNavigationRef.current = { keyboard: event?.detail === 0 };
        setWorkPage(page);
      };
      const platforms = (
          state?.platforms?.length ? state.platforms : fallback
        ).map((p) => ({
          ...p,
          metrics: (p.metrics || []).map((m) =>
            typeof m === "string" ? m : m.key,
          ),
          metricInfo: Object.fromEntries(
            (p.metrics || [])
              .filter((m) => typeof m === "object")
              .map((m) => [m.key, m]),
          ),
        })),
        settings = state?.settings || {},
        connection = state?.browserConnection;
      const online = !!connection?.online;
      const load = React.useCallback(async () => {
        try {
          const s = await api("state");
          if (![1, 2].includes(s?.version) || !s.accounts)
            throw Error("本地数据格式异常");
          if (alive.current) {
            for (const [id, request] of Object.entries(manualJobs.current)) {
              const outcome = s.syncByPlatform?.[id] || (s.sync?.platform === id ? s.sync : null);
              if (!outcome) continue;
              const changed = JSON.stringify(outcome) !== request.status;
              if (!changed) continue;
              setLocalSync(old => { const next = { ...old }; delete next[id]; return next; });
              if (outcome.phase === "complete" && outcome.automatic !== true) {
                const unchanged = request.data === accountData(s.accounts[id]);
                const label = s.platforms?.find(p => p.id === id)?.label || id;
                setPlatformErrors(old => { const next = { ...old }; delete next[id]; return next; });
                setNotice(`${label}同步成功，${unchanged ? "数据无变化。" : "最新记录已保存。"}`);
                setHighlighted(old => ({ ...old, [id]: outcome.completedAt || outcome.jobId || Date.now() }));
                delete manualJobs.current[id];
              } else if (unconfirmedHistory(outcome, s.accounts[id])) {
                setNotice(`${s.platforms?.find(p => p.id === id)?.label || id}${historyExplanation(s.accounts[id])}`, "warning");
                delete manualJobs.current[id];
              } else if (outcome.phase === "paused") {
                const reason = s.accounts[id]?.workSync?.reason;
                setNotice(`${s.platforms?.find(p => p.id === id)?.label || id}已暂停 · 已保存进度 · ${reason === "legacy_connector" ? "请更新浏览器连接器后继续" : reason === "needs_login" ? "请先在浏览器登录" : reason === "needs_attention" ? "请先在浏览器完成验证" : s.accounts[id]?.workSync?.mode === "refresh" ? "可重新同步" : s.accounts[id]?.workSync?.mode === "incremental" ? "可继续增量同步" : "可继续补齐历史"}`, "warning");
                delete manualJobs.current[id];
              } else if (outcome.error || ["needs_login", "needs_attention", "connection_offline", "parse_error", "account_mismatch", "network_error", "error"].includes(outcome.phase)) {
                if (outcome.automatic !== true) setNotice(`${s.platforms?.find(p => p.id === id)?.label || id}同步未完成：${outcome.error || outcome.lastResult || "请检查账号旁的提示后重试。"}`, ["needs_login", "needs_attention"].includes(outcome.phase) ? "warning" : "error");
                delete manualJobs.current[id];
              }
            }
            const attempt = pairingAttempt.current;
            if (attempt && s.browserConnection?.paired && s.browserConnection.completedPairId === attempt.id) {
              pairingAttempt.current = null;
              setPair(null);
              setNotice(`授权成功，${s.browserConnection.label || "浏览器"}${s.browserConnection.online ? " 已连接，可以开始同步。" : " 暂时离线，请打开浏览器并启用扩展。"}`, s.browserConnection.online ? "success" : "warning");
            }
            setState(s);
          }
        } catch (e) {
          if (alive.current) setError(e.message);
        }
      }, []);
      React.useEffect(() => {
        alive.current = true;
        load();
        const timer = setInterval(load, 2500);
        return () => {
          alive.current = false;
          clearInterval(timer);
        };
      }, [load]);
      async function action(path, body, { close = false, message = "" } = {}) {
        setPending(true);
        setOperationError(null);
        setError("");
        setNotice("");
        try {
          const result = await api(path, body);
          await load();
          if (body?.platform && path === "unbind") setPlatformErrors(old => { const next = { ...old }; delete next[body.platform]; return next; });
          if (close) setModal(null);
          if (message) setNotice(message);
          return result || true;
        } catch (e) {
          setNotice((path === "settings" ? "设置未保存：" : path === "unbind" ? "解除绑定未完成：" : "操作未完成：") + e.message, "error");
          if (body?.platform && ["sync", "login"].includes(path)) {
            setPlatformErrors(old => ({ ...old, [body.platform]: e.message }));
          } else if (body?.platform && ["settings", "unbind"].includes(path)) {
            setOperationError({ path, platform: body.platform, message: (path === "unbind" ? "解除绑定未完成：" : "设置未保存：") + e.message });
          } else setError((path === "settings" ? "设置未保存：" : "") + e.message);
          return false;
        } finally {
          setPending(false);
        }
      }
      const ps = (id) =>
        settings.platforms?.[id] || {
          visible: true,
          schedule: {
            enabled: false,
            kind: "daily",
            time: "09:00",
            hours: 6,
            timeZone: settings.timeZone || localZone(),
          },
        };
      const status = (id) => {
        if (!state || !id) return null;
        return state.syncByPlatform?.[id] ||
          (state.sync?.platform === id ? state.sync : null);
      };
      const sync = async (id, resume = false, path = "sync", options = {}) => {
        const a = state?.accounts[id];
        manualJobs.current[id] = { status: JSON.stringify(status(id)), data: accountData(a) };
        setLocalSync(old => ({ ...old, [id]: { phase: "queued", running: true } }));
        const result = await action(path, {
          platform: id,
          ...(path === "sync" ? { mode: options.mode || (resume ? status(id)?.mode || status(id)?.progress?.mode || a?.workSync?.mode : null) || "refresh", ...(options.restart ? { restart: true } : {}) } : {}),
          ...(resume && status(id)?.url ? { url: status(id).url } : url && addPlatform === id ? { url } : {}),
          ...(resume ? { resume: true } : {}),
        }, { close: true });
        if (!result) { delete manualJobs.current[id]; setLocalSync(old => { const next = { ...old }; delete next[id]; return next; }); }
        return result;
      };
      const phaseLabel = (s, account) => unconfirmedHistory(s, account) ? "已更新 · 历史待确认" : ({ queued: "排队中", waiting: "等待浏览器", opening: "等待浏览器", connecting: "等待浏览器", reading: "正在读取", collecting: "正在读取", needs_login: "需要登录", needs_attention: "等待处理", complete: "同步完成", paused: "已暂停 · 可继续" }[s?.phase] || (s?.running ? "正在同步" : ""));
      const btn = (text, onClick, icon, cls = "", disabled = false) =>
        h(
          "button",
          { type: "button", onClick, className: cls, disabled },
          icon && h(Icon, { name: icon }),
          text,
        );
      const goSettings = () => {
        if (view === "overview") scrollRef.current = mainRef.current?.scrollTop || 0;
        setView("settings");
        setShowTop(false);
        requestAnimationFrame(() => mainRef.current?.scrollTo?.(0, 0));
      };
      const goDetail = (id) => {
        if (view === "overview") scrollRef.current = mainRef.current?.scrollTop || 0;
        setShowTop(false);
        setSelected(id);
        setWorkKind("全部");
        setWorkPage(1);
        setMetricKey(detailPreferences.current[id]?.metricKey || "fans");
        setDays(detailPreferences.current[id]?.days || 30);
        setView("detail");
        mainRef.current?.scrollTo?.(0, 0);
      };
      const chooseMetric = (key) => {
        detailPreferences.current[selected] = {
          ...detailPreferences.current[selected],
          metricKey: key,
        };
        setMetricKey(key);
      };
      const chooseDays = (count) => {
        detailPreferences.current[selected] = {
          ...detailPreferences.current[selected],
          days: count,
        };
        setDays(count);
      };
      const back = () => {
        setView("overview");
        setSelected(null);
        requestAnimationFrame(() => {
          mainRef.current?.scrollTo?.(0, scrollRef.current);
          setShowTop(scrollRef.current >= (mainRef.current?.clientHeight || Infinity));
        });
      };
      const bound = platforms.filter((p) => state?.accounts[p.id]),
        visible = bound.filter((p) => ps(p.id).visible !== false),
        archived = selected?.startsWith?.("archive:")
          ? state?.archives?.[Number(selected.slice(8))]
          : null,
        account = archived?.account || archived || state?.accounts[selected],
        shownWorks = [...(account?.works || [])].sort((a, b) => String(b.firstSeenAt || "").localeCompare(String(a.firstSeenAt || ""))).filter(w => workKind === "全部" || w.kind === workKind),
        pageCount = Math.max(1, Math.ceil(shownWorks.length / 24)),
        currentPage = Math.min(workPage, pageCount),
        pageWorks = shownWorks.slice((currentPage - 1) * 24, currentPage * 24),
        selectedSync = localSync[selected] || status(selected),
        selectedBusy = !!(selectedSync?.running || selectedSync?.phase === "queued"),
        platform = platforms.find(
          (p) => p.id === (account?.platform || selected),
        ),
        issues = platforms
          .map((p) => ({ p, s: platformErrors[p.id] ? { ...status(p.id), phase: "error", error: platformErrors[p.id] } : status(p.id) }))
          .filter(
            ({ s }) =>
              s &&
              (s.error ||
                [
                  "needs_login",
                  "needs_attention",
                  "connection_offline",
                  "parse_error",
                  "account_mismatch",
                  "network_error",
                ].includes(s.phase)),
          );
      if (state && guideInitial.current === null) guideInitial.current = !bound.length;
      const guideConnected = !!connection?.paired;
      const guideSynced = bound.some(p => !!state.accounts[p.id].syncedAt);
      const guideChosen = addPlatform || platforms.find(p => localSync[p.id]?.running || (status(p.id)?.phase && status(p.id).phase !== "idle"))?.id;
      const guideScheduled = bound.some(p => ps(p.id).schedule?.enabled === true);
      const guideActive = guideSynced ? 3 : !guideConnected ? 0 : !guideChosen ? 1 : 2;
      const guideOpen = guideMode === "expanded" || (guideMode === null && guideInitial.current === true);
      const changeGuide = mode => {
        setGuideMode(mode);
        try { window.localStorage.setItem(guideKey, JSON.stringify({ version: 1, mode })); } catch {}
      };
      const reopenGuide = () => {
        changeGuide("expanded");
        setModal(null);
        setShowTop(false);
        setView("overview");
        requestAnimationFrame(() => { mainRef.current?.scrollTo?.(0, 0); mainRef.current?.querySelector?.("#psw-guide-title")?.focus(); });
      };
      const closeGuide = mode => {
        changeGuide(mode);
        requestAnimationFrame(() => mainRef.current?.querySelector?.("[data-guide-reopen]")?.focus());
      };
      const guideControl = () => h("button", { type: "button", className: "psw-quiet", "data-guide-reopen": true, "aria-expanded": view === "overview" && guideOpen, "aria-controls": "psw-onboarding", onClick: reopenGuide }, "上手指南");
      const openAdd = () => { setAddPlatform(null); setUrl(""); setModal("add"); };
      const guideRunning = guideChosen && (localSync[guideChosen]?.running || status(guideChosen)?.running || status(guideChosen)?.phase === "queued");
      const guideNeedsLogin = ["needs_login", "needs_attention"].includes(status(guideChosen)?.phase);
      const continueGuideSync = () => {
        if (status(guideChosen)?.phase && status(guideChosen).phase !== "idle") return sync(guideChosen, true, guideNeedsLogin ? "login" : "sync");
        setAddPlatform(guideChosen); setModal("add");
      };
      const guideDescription = guideActive === 0 ? "安装连接器并配对常用浏览器，已有连接可在连接设置中检查。"
        : guideActive === 1 ? "选择一个平台；如需登录，请在原浏览器亲自完成。首次读取成功后才会绑定。"
        : guideActive === 2 ? guideRunning ? "正在等待本次读取结果，成功保存后会出现账号卡片。" : "在原浏览器完成登录或验证，再读取账号。成功保存后，点击账号卡片查看详情。"
        : "首次记录已保存，点击账号卡片查看详情。自动同步可稍后设置，仅在工作台运行且电脑唤醒时执行。";
      const guideAction = guideActive === 0 ? btn("连接浏览器", () => setModal("connection"), "browser", "psw-primary")
        : guideActive === 1 ? btn("添加一个平台", openAdd, "plus", "psw-primary")
        : guideActive === 2 ? btn(guideRunning ? "等待同步结果" : guideNeedsLogin ? "前往浏览器处理" : "继续首次同步", continueGuideSync, "refresh", "psw-primary", !!guideRunning || pending)
        : btn(guideScheduled ? "查看同步计划" : "设置自动同步", goSettings, "clock", "psw-primary");
      function issue({ p, s }) {
        const login = s.phase === "needs_login",
          attention = s.phase === "needs_attention";
        return h(
          "div",
          { className: "psw-notice psw-platform-issue", key: p.id, role: "status", onClick: e => e.stopPropagation() },
          h(
            "div",
            null,
            h(
              "strong",
              null,
              p.label,
              " · ",
              login
                ? "需要重新登录"
                : attention
                  ? "等待处理"
                  : s.phase === "account_mismatch"
                    ? "账号身份不符"
                    : "同步未完成",
            ),
            h("p", null, s.error || s.lastResult || "请检查浏览器连接后重试。"),
          ),
          h(
            "div",
            { className: "psw-actions" },
            (login || attention) &&
              btn(
                login ? "前往登录" : "打开平台处理",
                () => sync(p.id, true, "login"),
                "external",
                "",
                pending,
              ),
            btn(
              login || attention ? "继续同步" : "重试",
              () => sync(p.id, true),
              "refresh",
              "",
              pending,
            ),
          ),
        );
      }
      const feedbackLink = () => h("a", { href: FEEDBACK_URL, target: "_blank", rel: "noopener noreferrer", className: "psw-feedback-link" }, "意见反馈 ↗");
      const diagnosticText = [
        `版本：${appVersion}`,
        `运行方式：${runtimeMode}`,
        `浏览器扩展：${connection?.online ? "ready" : "offline"}`,
      ].join("\n");
      const notification = notice && h("div", { className: "psw-toast-anchor" },
        h("div", { className: "psw-toast-layer" }, h(SuccessNotice, { key: notice.id, message: notice.message, tone: notice.tone, onClose: () => setNotice("") })));
      function card(p) {
        const a = state.accounts[p.id],
          s = localSync[p.id] || status(p.id);
        return h(
          "article",
          { className: "psw-card" + (s?.running || s?.phase === "queued" ? " is-syncing" : ""), key: p.id, "aria-label": p.label + "账号", "aria-busy": !!s?.running, tabIndex: 0, "aria-keyshortcuts": "Enter Space", "aria-description": "按 Enter 或空格查看账号详情",
            onClick: event => {
              if (event.target.closest("button, a, input, select, textarea, [role=option]")) return;
              if (window.getSelection?.().toString()) return;
              goDetail(p.id);
            },
            onKeyDown: event => {
              if (event.target !== event.currentTarget || !["Enter", " "].includes(event.key)) return;
              event.preventDefault(); goDetail(p.id);
            } },
          highlighted[p.id] && h("div", { key: highlighted[p.id], className: "psw-sync-flash", "aria-hidden": true, onAnimationEnd: () => setHighlighted(old => { const next = { ...old }; delete next[p.id]; return next; }) }),
          h(
            "div",
            { className: "psw-card-top" },
            h(Logo, { id: p.id }),
            h("h2", null, p.label),
            h(
              "span",
              { className: "psw-status" },
              s?.running
                ? h(Icon, { name: "refresh", size: 13, className: "psw-spin" })
                : h(Icon, {
                    name: ps(p.id).schedule?.enabled ? "clock" : "check",
                    size: 13,
                  }),
              phaseLabel(s, a) || (ps(p.id).schedule?.enabled ? "自动同步" : "已绑定"),
            ),
          ),
          h(
            "div",
            { className: "psw-account" },
            h(Avatar, { account: a }),
            h(
              "div",
              null,
              h("h3", null, a.name),
              h(
                "small",
                null,
                a.accountId
                  ? String(a.accountId).replace(/^@?/, "@")
                  : "个人账号",
              ),
            ),
          ),
          h(
            "div",
            { className: "psw-mainmetric" },
            h(
              "div",
              null,
              h("span", { className: "psw-metriclabel" }, "粉丝"),
              h(
                "b",
                {
                  className: "psw-big",
                  title: a.fans?.approximate ? "平台显示的约数" : undefined,
                },
                metric(a.fans),
              ),
              h("div", { className: "psw-card-delta" }, h(Delta, { rows: a.daily })),
            ),
            h(Chart, {
              account: a,
              mini: true,
              zone: ps(p.id).schedule?.timeZone,
            }),
          ),
          h(
            "div",
            { className: "psw-stats" },
            [
              "following",
              "workCount",
              ...(p.metrics?.includes("likes") ? ["likes"] : []),
            ].map((key) =>
              h(
                "div",
                { key },
                h("b", { title: collectedFallback(a, key) ? "本地累计收录量，不等于平台总数" : undefined }, collectedFallback(a, key) ? String(a.works.length) : metric(a[key])),
                h("span", null, collectedFallback(a, key) ? collectedLabel(a) : labels[key]),
              ),
            ),
          ),
          issues.filter(item => item.p.id === p.id).map(issue),
          h(
            "div",
            { className: "psw-cardfooter" },
            h("small", null, "更新于 ", date(a.syncedAt)),
            h(
              "div",
              { className: "psw-actions" },
              btn("查看详情", () => goDetail(p.id), "arrow", "psw-quiet"),
              h(
                "button",
                {
                  type: "button",
                  className: "psw-icon-button psw-quiet",
                  "aria-label": "同步" + p.label,
                  onClick: event => { event?.stopPropagation(); return sync(p.id); },
                  disabled: pending || s?.running,
                },
                h(Icon, { name: "refresh", size: 16 }),
              ),
            ),
          ),
        );
      }
      return h(
        "section",
        { className: "psw", "data-theme": theme, "aria-label": "跨平台账号看板" },
        h(
          "header",
          { className: "psw-topbar", ref: headerRef },
          view === "overview"
            ? h("div", { className: "psw-brand" }, h("span", { className: "psw-mark" }, h(BrandMark)), "跨平台账号看板")
            : h("div", { className: "psw-header-context" },
                btn("返回账号总览", back, "back", "psw-quiet psw-header-back"),
                h("span", { className: "psw-header-divider", "aria-hidden": true }),
                h("span", { className: "psw-header-title" }, view === "settings" ? "设置" : archived ? "历史档案" : (platform?.label || "账号") + "详情")),
          h(
            "div",
            { className: "psw-top-actions" },
            h("button", { type: "button", className: "psw-theme-toggle psw-icon-button", "data-mode": themeMode, "aria-label": `切换为${themeNames[nextTheme(themeMode)]}`, title: `当前：${themeNames[themeMode]} · 点击切换为${themeNames[nextTheme(themeMode)]}`,
              onClick: () => { const next = nextTheme(themeMode); if (next === "system") setSystemDark(systemIsDark()); setThemeMode(next); try { window.localStorage.setItem(themeKey, next); } catch {} } },
              h(Icon, { name: "sun", size: 19, className: "psw-theme-sun" }), h(Icon, { name: "moon", size: 19, className: "psw-theme-moon" }), h(Icon, { name: "monitor", size: 19, className: "psw-theme-system" })),
            h(
              "button",
              {
                className: "psw-quiet psw-connection",
                "aria-label": "浏览器连接",
                title: online ? "浏览器已连接 · 管理连接" : "连接浏览器",
                onClick: () => setModal("connection"),
              },
              h(Icon, { name: "browser", size: 18 }),
              h("span", { className: "psw-dot" + (online ? " online" : "") }),
              h("span", null, online ? "浏览器已连接" : "连接浏览器"),
            ),
            view !== "settings" && btn("设置", goSettings, "settings", "psw-quiet psw-settings-button"),
            h("a", { href: GITHUB_URL, target: "_blank", rel: "noopener noreferrer", className: "psw-github", "aria-label": "查看 GitHub 项目", title: "查看 GitHub 项目" },
              h("svg", { viewBox: "0 0 24 24", width: 20, height: 20, fill: "currentColor", "aria-hidden": true },
                h("path", { d: "M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.03-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1.01 1.73 2.65 1.23 3.3.94.1-.73.4-1.23.72-1.51-2.5-.28-5.13-1.25-5.13-5.57 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .94-.3 3.09 1.15a10.77 10.77 0 0 1 5.62 0c2.15-1.46 3.09-1.15 3.09-1.15.61 1.55.23 2.7.11 2.98.72.79 1.15 1.79 1.15 3.02 0 4.33-2.63 5.28-5.14 5.56.4.35.76 1.03.76 2.08v3.11c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" }))),
          ),
        ),
        h("style", null, styles),
        !modal && notification,
        h(
          "main",
          { ref: mainRef, tabIndex: -1, "aria-label": "工作台内容", onScroll: e => setShowTop(e.currentTarget.scrollTop >= e.currentTarget.clientHeight) },
          h(
            "div",
            { className: "psw-wrap" },
            error &&
              h(
                "div",
                { className: "psw-notice error", role: "alert" },
                h("span", null, error),
                btn(
                  "重试",
                  async () => {
                    setError("");
                    await load();
                  },
                  "refresh",
                ),
              ),
            !state
              ? h(
                  "div",
                  { className: "psw-loading", role: "status" },
                  "正在读取本地账号…",
                )
              : view === "settings"
                ? h(
                    "div",
                    { className: "psw-settings" },
                    h(
                      "div",
                      { className: "psw-pagehead" },
                      h("h1", null, "设置"),
                      h("div", { className: "psw-actions" }, guideControl()),
                    ),
                    h(
                      "section",
                      { className: "psw-setting-block psw-setting-grid" },
                      h("div", null, h("h2", null, "浏览器连接")),
                      h(
                        "div",
                        { className: "psw-setting-body" },
                        h(ConnectionCard, { connection }, btn(
                          "管理连接", () => setModal("connection"), "browser",
                        )),
                      ),
                    ),
                    h(
                      "section",
                      { className: "psw-setting-block psw-setting-grid" },
                      h(
                        "div",
                        null,
                        h("h2", null, "平台与同步"),
                        h(
                          "p",
                          {
                            className: "psw-muted",
                            style: { fontSize: 12, marginTop: 9 },
                          },
                          "工作台运行且电脑唤醒时执行。",
                        ),
                      ),
                      h(
                        "div",
                        { className: "psw-setting-body" },
                        bound.length
                          ? bound.map((p) =>
                              h(Schedule, {
                                key: p.id,
                                platform: p,
                                config: ps(p.id),
                                account: state.accounts[p.id],
                                pending,
                                issueContent: h(React.Fragment, null,
                                  issues.filter(item => item.p.id === p.id).map(issue),
                                  operationError?.path === "settings" && operationError.platform === p.id &&
                                    h("div", { className: "psw-notice error", role: "alert" }, operationError.message)),
                                onSave: (body) => action("settings", body, { message: "visible" in body ? (body.visible ? "已在首页展示" : "已从首页隐藏，自动同步计划不变") : body.schedule ? `${p.label}同步计划已保存` : "" }),
                                onUnbind: (id) => {
                                  setOperationError(null);
                                  setSelected(id);
                                  setModal("unbind");
                                },
                              }),
                            )
                          : h("p", null, "添加账号后，可设置独立同步计划。"),
                        btn(
                          "添加平台",
                          () => {
                            setAddPlatform(null);
                            setModal("add");
                          },
                          "plus",
                        ),
                      ),
                    ),
                    AccessManagement && h(AccessManagement),
                    h(StorageSettings, { storage: state.storage, onNotice: setNotice }),
                    state.archives?.length > 0 &&
                      h(
                        "section",
                        { className: "psw-setting-block psw-setting-grid" },
                        h("h2", null, "历史档案"),
                        h(
                          "div",
                          { className: "psw-setting-body" },
                          state.archives.map((a, i) => {
                            const record = a.account || a, platformId = a.platform || record.platform;
                            return h("div", { className: "psw-archive-row", key: a.id || i },
                              h(Logo, { id: platformId }),
                              h("div", { className: "psw-archive-info" }, h("strong", null, platforms.find(p => p.id === platformId)?.label || platformId || "未知平台"), h("span", null, record.name || "账号", record.accountId ? " · @" + String(record.accountId).replace(/^@/, "") : ""), h("small", null, "归档于 ", a.archivedAt ? date(a.archivedAt) : "时间未记录")),
                              btn("查看历史", () => { setSelected("archive:" + i); setWorkKind("全部");
        setWorkPage(1); setView("detail"); }, "arrow", "psw-quiet"));
                          }),
                        ),
                      ),
                    h("section", { className: "psw-setting-block psw-setting-grid" },
                      h("h2", null, "帮助与反馈"),
                      h("div", { className: "psw-setting-body" },
                        h("div", { className: "psw-actions" }, feedbackLink(), btn("查看诊断信息", () => { setCopyError(""); setModal("help"); }, "code", "psw-quiet")),
                        h("p", { className: "psw-note" }, "遇到问题时，可查看诊断信息并按需附在反馈中。"),
                        h("div", { className: "psw-version-row" }, h("span", null, "当前版本 ", appVersion),
                          btn("查看更新记录", () => setModal("releases"), null, "psw-quiet psw-release-trigger")))),
                  )
                : view === "detail" && account
                  ? h(
                      React.Fragment,
                      null,
                      h(
                        "div",
                        { className: "psw-row" },
                        archived && btn("返回设置", goSettings, "back", "psw-quiet"),
                        !archived &&
                          h(
                            "a",
                            {
                              href: account.url,
                              target: "_blank",
                              rel: "noopener noreferrer",
                            },
                            "平台主页 ↗",
                          ),
                      ),
                      h(
                        "div",
                        { className: "psw-detail-head" },
                        h(
                          "div",
                          { className: "psw-account" },
                          h(Avatar, { account }),
                          h(
                            "div",
                            null,
                            h("h1", null, account.name),
                            h(
                              "small",
                              null,
                              platform?.label || account.platform,
                              " · ",
                              archived
                                ? "只读档案"
                                : `最近同步 ${date(account.syncedAt)}`,
                            ),
                            account.bio &&
                              h("p", { className: "psw-bio" }, account.bio),
                          ),
                        ),
                        !archived &&
                          h("button", {
                            type: "button",
                            className: "psw-primary",
                            onClick: () => sync(selected),
                            disabled: pending || selectedBusy,
                            "aria-busy": selectedBusy,
                          },
                            h(Icon, { name: "refresh", className: selectedBusy ? "psw-spin" : undefined }),
                            selectedBusy ? phaseLabel(selectedSync) : "同步账号",
                          ),
                      ),
                      issues.filter((i) => i.p.id === selected).map(issue),
                      h(
                        "div",
                        { className: "psw-metric-tabs" },
                        (
                          platform?.metrics || [
                            "fans",
                            "following",
                            "workCount",
                          ]
                        ).map((key) =>
                          h(
                            "button",
                            {
                              key,
                              "aria-pressed": metricKey === key,
                              onClick: () => chooseMetric(key),
                              disabled: collectedFallback(account, key),
                              title: collectedFallback(account, key) ? "本地累计收录量，不等于平台总数，不用于平台趋势" : platform?.metricInfo?.[key]?.description,
                            },
                            h(
                              "span",
                              { className: "psw-metriclabel" },
                              collectedFallback(account, key) ? collectedLabel(account) : platform?.metricInfo?.[key]?.label ||
                                labels[key] ||
                                key,
                            ),
                            h("b", null, collectedFallback(account, key) ? String(account.works.length) : metric(account[key])),
                          ),
                        ),
                      ),
                      collectedFallback(account, "workCount") && h("p", { className: "psw-note", style: { margin: "10px 0 14px" } }, "平台未提供作品总数，当前显示本地累计收录量；可能包含已删除的旧作品，不用于平台总数趋势。"),
                      h(
                        "section",
                        { className: "psw-chart-panel" },
                        h(
                          "div",
                          { className: "psw-row" },
                          h("h2", null, labels[metricKey], "趋势"),
                          h(
                            "div",
                            {
                              className: "psw-segment",
                              "aria-label": "趋势时间范围",
                            },
                            [7, 30, 90].map((n) =>
                              h(
                                "button",
                                {
                                  key: n,
                                  "aria-pressed": days === n,
                                  onClick: () => chooseDays(n),
                                },
                                `${n} 天`,
                              ),
                            ),
                          ),
                        ),
                        h(Chart, {
                          key: metricKey,
                          account,
                          metricKey,
                          days,
                          zone: ps(account.platform || selected).schedule
                            ?.timeZone,
                        }),
                      ),
                      h(
                        "section",
                        { className: "psw-section" },
                        h(
                          "div",
                          { className: "psw-row" },
                          h("h2", null, "作品库"),
                          h("span", { className: "psw-count" }, `累计保存 ${account.workLibrary?.total ?? (account.works || []).length} 条 · 此次新增 ${account.workLibrary?.added ?? 0} 条`),
                        ),
                        h("p", { className: "psw-snapshot-scope" },
                          account.workSync?.historyComplete
                            ? `历史曾确认读到末尾${account.workSync.historyCompletedAt ? " · " + date(account.workSync.historyCompletedAt) : ""}。`
                            : account.workSync ? "历史范围尚未确认，已保存的作品会持续累积。" : "旧记录已纳入作品库，历史范围尚未确认。",
                        ),
                        !archived && h("p", { className: "psw-note", style: { marginBottom: 10 } }, "日常同步更新指标和当前已加载作品；下方操作用于扫描更多作品或补齐历史。"),
                        !archived && h("div", { className: "psw-note", role: "status", "aria-live": "polite" },
                          h("p", null, account.workSync?.reason === "legacy_connector" || selectedSync?.reason === "legacy_connector" ? "请更新浏览器连接器后继续；已保存的作品仍保留，历史尚未补齐。" : selectedSync?.phase === "needs_login" || account.workSync?.reason === "needs_login" ? "请先在原浏览器登录，完成后继续；已保存的进度仍保留。" : selectedSync?.phase === "needs_attention" || account.workSync?.reason === "needs_attention" ? "请先在原浏览器完成验证或页面处理，再继续；已保存的进度仍保留。" : selectedBusy ? `${phaseLabel(selectedSync)} · 已保存 ${selectedSync?.progress?.saved ?? account.works?.length ?? 0} 条 · 已读取 ${selectedSync?.progress?.batches ?? 0} 批` : selectedSync?.error ? `同步未完成：${selectedSync.error} 已保存的作品和进度仍保留。` : unconfirmedHistory(selectedSync, account) ? historyExplanation(account) : account.workSync?.status === "paused" || selectedSync?.phase === "paused" ? account.workSync?.mode === "refresh" ? "本次同步已暂停，已保存的数据保留，可重新同步。" : account.workSync?.mode === "incremental" ? "已保存进度，等待继续增量同步。" : "已保存进度，等待继续补齐历史。" : account.workSync?.mode === "refresh" && account.workSync?.status === "incremental" ? "本次同步完成，账号指标和当前已加载作品已保存。补齐更早的作品请使用下方历史操作。" : account.workSync?.status === "incremental" ? "此次增量扫描已完成。" : account.workSync?.status === "complete" && account.workSync?.historyComplete ? "历史已读到末尾。" : "可继续补齐历史，或先更新近期作品。"),
                          h("div", { className: "psw-actions", style: { flexWrap: "wrap" } },
                            selectedBusy
                              ? btn("暂停", () => action("sync/pause", { platform: selected }), null, "", pending)
                              : h(React.Fragment, null,
                                  btn("增量同步", () => sync(selected, account.workSync?.mode === "incremental" && (account.workSync?.status === "paused" || selectedSync?.phase === "paused"), "sync", { mode: "incremental" }), "refresh", "", pending),
                                  btn(account.workSync?.historyCheckpoint || (account.workSync?.status === "paused" && account.workSync?.mode === "history") ? "继续补齐" : "补齐历史", () => sync(selected, true, "sync", { mode: "history" }), null, "", pending),
                                  btn("重新扫描", () => sync(selected, true, "sync", { mode: "history", restart: true }), null, "psw-quiet", pending),
                                ),
                          ),
                        ),
                        account.scope && h("details", { className: "psw-snapshot-details" }, h("summary", null, "查看平台采集范围"), h("p", { className: "psw-muted", style: { fontSize: 12 } }, account.scope)),
                        account.coverage && h("div", { className: "psw-coverage", "aria-label": "作品采集范围" },
                          [["video", "视频"], ["opus", "图文"], ["audio", "音频"]].map(([key, label]) => {
                            const item = account.coverage[key];
                            const reasons = { network_error: "网络未响应，可重新同步", parse_error: "未识别到本人内容", needs_login: "需要登录", needs_attention: "需要在浏览器处理", account_mismatch: "账号身份不符" };
                            return h("div", { key }, h("strong", null, label), h("span", null, "平台总量 ", metric(item?.total)), h("span", null, "已读 ", item?.loaded || 0, " 条"), h("small", { className: item?.status === "unavailable" ? "psw-danger" : "psw-muted" }, item?.status === "empty" ? "平台确认暂无内容" : item?.status === "unavailable" ? reasons[item.reason] || "本次未能读取，可重新同步" : item?.status === "complete" ? "此分类已确认读到末尾" : "此分类历史范围尚未确认"));
                          })),
                        account.coverage && h("div", { className: "psw-work-filters", "aria-label": "作品类型" }, ["全部", "视频", "图文", "音频"].map(kind => h("button", { key: kind, "aria-pressed": workKind === kind, onClick: () => { setWorkKind(kind); setWorkPage(1); } }, kind))),
                        shownWorks.length
                          ? h(
                              "div",
                              { className: "psw-works", ref: workGridRef, tabIndex: -1, "aria-label": `作品库第 ${currentPage} 页` },
                              pageWorks.map((w) =>
                                h(
                                  "article",
                                  { className: "psw-work", key: w.id },
                                  w.cover &&
                                    h(
                                      "a",
                                      {
                                        href: w.url,
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        tabIndex: -1,
                                        "aria-hidden": true,
                                      },
                                      h(
                                        "div",
                                        { className: "psw-cover" },
                                        h("img", {
                                          src: w.cover,
                                          alt: "",
                                          loading: "lazy",
                                          referrerPolicy: "no-referrer",
                                          onError: (e) => {
                                            e.currentTarget.style.display =
                                              "none";
                                          },
                                        }),
                                      ),
                                    ),
                                  h("small", null, w.kind || "作品"),
                                  h(
                                    "h3",
                                    null,
                                    h(
                                      "a",
                                      {
                                        href: w.url,
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                      },
                                      w.title || "查看作品",
                                      " ↗",
                                    ),
                                  ),
                                ),
                              ),
                            )
                          : h(
                              "p",
                              { className: "psw-note" },
                              workKind !== "全部"
                                ? `当前记录没有已读取的${workKind}，请参考上方分类状态。`
                                : account.worksStatus === "empty"
                                ? "平台确认暂无作品。"
                                : "作品库暂无已保存作品，账号总作品数以平台资料为准。",
                            ),
                        shownWorks.length > 0 && h("nav", { className: "psw-row", "aria-label": "作品库分页", style: { marginTop: 20 } },
                          btn("上一页", event => changeWorkPage(currentPage - 1, event), null, "", currentPage <= 1),
                          h("span", { className: "psw-muted", "aria-live": "polite" }, `第 ${currentPage} / ${pageCount} 页 · ${shownWorks.length} 条`),
                          btn("下一页", event => changeWorkPage(currentPage + 1, event), null, "", currentPage >= pageCount),
                        ),
                      ),
                    )
                  : h(
                      React.Fragment,
                      null,
                      h(
                        "div",
                        { className: "psw-pagehead" },
                        h(
                          "div",
                          { className: "psw-heading" },
                          h("h1", null, "我的账号"),
                          h(
                            "span",
                            { className: "psw-count" },
                            visible.length,
                            " 个平台",
                          ),
                        ),
                        h("div", { className: "psw-actions psw-home-actions" }, guideControl(), btn("添加平台", openAdd, "plus", "psw-primary")),
                      ),
                      guideOpen && h(Onboarding, { connected: guideConnected, chosen: guideChosen, synced: guideSynced, scheduled: guideScheduled, active: guideActive, description: guideDescription, action: guideAction, onCollapse: () => closeGuide("collapsed"), onSkip: () => closeGuide("skipped") }),
                      issues.filter(item => !visible.some(p => p.id === item.p.id)).map(issue),
                      platforms
                        .filter(
                          (p) =>
                            !state.accounts[p.id] &&
                            (localSync[p.id]?.running || status(p.id)?.running ||
                              ["queued", "reading"].includes(
                                status(p.id)?.phase,
                              )),
                        )
                        .map((p) =>
                          h(
                            "div",
                            {
                              className: "psw-notice",
                              key: p.id,
                              role: "status",
                            },
                            h(
                              "span",
                              { className: "psw-actions" },
                              h(Icon, {
                                name: "refresh",
                                className: "psw-spin",
                              }),
                              p.label + " · " + (phaseLabel(localSync[p.id] || status(p.id)) || "等待同步"),
                            ),
                            h("small", null, "首次成功后将添加到总览"),
                          ),
                        ),
                      !online &&
                        bound.length > 0 &&
                        h(
                          "div",
                          { className: "psw-notice" },
                          h(
                            "span",
                            null,
                            "浏览器暂未连接，当前显示最后成功同步的记录。",
                          ),
                          btn(
                            "检查连接",
                            () => setModal("connection"),
                            "browser",
                          ),
                        ),
                      visible.length
                        ? h("div", { className: "psw-grid" }, visible.map(card))
                        : (!guideOpen || bound.length > 0) && h(
                            "div",
                            { className: "psw-empty" },
                            h(
                              "svg",
                              {
                                className: "psw-empty-art",
                                viewBox: "0 0 90 72",
                                fill: "none",
                                "aria-hidden": true,
                              },
                              h("rect", {
                                x: 7,
                                y: 12,
                                width: 48,
                                height: 49,
                                rx: 7,
                                stroke: "currentColor",
                                strokeWidth: 1.5,
                                transform: "rotate(-9 30 36)",
                              }),
                              h("rect", {
                                x: 31,
                                y: 7,
                                width: 49,
                                height: 55,
                                rx: 7,
                                fill: "var(--card)",
                                stroke: "currentColor",
                                strokeWidth: 1.5,
                              }),
                              h("circle", {
                                cx: 55,
                                cy: 25,
                                r: 7,
                                fill: "var(--soft)",
                              }),
                              h("path", {
                                d: "M43 43h24M43 50h15",
                                stroke: "currentColor",
                                strokeWidth: 1.5,
                                strokeLinecap: "round",
                              }),
                            ),
                            h(
                              "h2",
                              null,
                              bound.length
                                ? "账号已在首页隐藏"
                                : "从一个账号开始",
                            ),
                            h(
                              "p",
                              null,
                              bound.length
                                ? "在设置中重新开启首页展示，历史与同步计划仍然保留。"
                                : "连接已登录的浏览器，把账号、每日变化与作品留在这里。",
                            ),
                            btn(
                              bound.length ? "管理平台" : "添加第一个平台",
                              () =>
                                bound.length
                                  ? goSettings()
                                  : (setAddPlatform(null), setModal("add")),
                              bound.length ? "settings" : "plus",
                              "psw-primary",
                            ),
                          ),
                      bound.length > visible.length &&
                        h(
                          "p",
                          { className: "psw-note" },
                          `${bound.length - visible.length} 个平台已隐藏`,
                          btn(
                            "管理展示",
                            goSettings,
                            null,
                            "psw-quiet",
                          ),
                        ),
                      visible.length > 0 &&
                        h(
                          "p",
                          { className: "psw-note" },
                          h(Icon, { name: "archive", size: 14 }),
                          "数据保存在本机 · “—”表示平台未提供或未识别",
                        ),
                    ),
          ),
        ),
        showTop && !modal && h("button", { type: "button", className: "psw-back-top", "aria-label": "回到顶部", onClick: () => {
          mainRef.current?.scrollTo?.({ top: 0, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
          mainRef.current?.focus?.({ preventScroll: true });
        } }, h(Icon, { name: "top", size: 23, strokeWidth: 2 }), h("span", { className: "psw-top-tooltip", "aria-hidden": true }, "回到顶部")),
        modal &&
          h(
            Modal,
            {
              key: modal,
              notification,
              scrollLabel: modal === "releases" ? "版本更新记录" : undefined,
              title:
                modal === "releases" ? "更新记录" : modal === "help" ? "诊断信息" : modal === "add"
                  ? "添加平台"
                  : modal === "developer"
                    ? "开发新平台接入"
                    : modal === "unbind"
                      ? "解除账号绑定"
                      : modal === "revoke"
                        ? "撤销浏览器授权"
                        : "浏览器连接",
              onClose: () => {
                setModal(null);
                setOperationError(null);
                setPair(null);
              },
            },
            error &&
              h("div", { className: "psw-notice error", role: "alert" }, error),
            modal === "unbind" && operationError?.path === "unbind" && operationError.platform === selected &&
              h("div", { className: "psw-notice error", role: "alert" }, operationError.message),
            modal === "add" && issues.filter(item => item.p.id === addPlatform).map(issue),
            issues.length > 0 && modal === "connection" && issues.map(issue),
            modal === "releases"
              ? h("div", { className: "psw-release-list" }, releaseNotes.map(release =>
                  h("article", { className: "psw-release", key: release.version },
                    h("div", { className: "psw-release-heading" }, h("h3", null, "v" + release.version),
                      release.version === appVersion && h("span", { className: "psw-current-version" }, "当前版本"),
                      h("span", { className: "psw-release-date" }, release.date)),
                    h("ul", null, release.items.map(([kind, message], i) => h("li", { key: i }, h("span", { className: "psw-release-kind" }, kind), h("span", null, message)))))))
              : modal === "help"
              ? h(React.Fragment, null,
                  h("p", { className: "psw-note" }, "以下信息仅包含版本与连接状态。点击复制后，可按需粘贴到反馈表单，不会自动上传。"),
                  h("label", { className: "psw-field" }, "诊断信息",
                    h("textarea", { className: "psw-diagnostics", readOnly: true, rows: 6, value: diagnosticText, onFocus: e => e.currentTarget.select() })),
                  copyError && h("p", { className: "psw-danger", role: "alert" }, copyError),
                  h("div", { className: "psw-dialogfooter" }, btn("复制诊断信息", async () => {
                    try { await navigator.clipboard.writeText(diagnosticText); setCopyError(""); setNotice("诊断信息已复制，可按需粘贴到反馈表单。"); }
                    catch { const message = "无法访问剪贴板，请选中上方诊断信息后手动复制。"; setCopyError(message); setNotice(message, "error"); }
                  }, "copy", "psw-primary")))
              : modal === "add"
              ? addPlatform
                ? h(
                    React.Fragment,
                    null,
                    btn(
                      "选择其他平台",
                      () => setAddPlatform(null),
                      "back",
                      "psw-quiet",
                    ),
                    h(
                      "div",
                      {
                        className: "psw-card-top",
                        style: { marginTop: 20, marginBottom: 15 },
                      },
                      h(Logo, { id: addPlatform }),
                      h(
                        "h2",
                        null,
                        platforms.find((p) => p.id === addPlatform)?.label,
                      ),
                    ),
                    h(
                      "p",
                      null,
                      "读取浏览器中已登录的个人账号，首次同步成功后完成绑定。",
                    ),
                    h(
                      "label",
                      { className: "psw-field" },
                      "个人主页链接（可选）",
                      h("input", {
                        type: "url",
                        value: url,
                        onChange: (e) => setUrl(e.target.value),
                        placeholder: "https://…",
                      }),
                    ),
                    h(
                      "p",
                      { className: "psw-note" },
                      "登录或验证请在浏览器中亲自完成。",
                    ),
                    h(
                      "div",
                      { className: "psw-dialogfooter" },
                      btn(
                        "连接浏览器",
                        () => setModal("connection"),
                        "browser",
                        "",
                        pending,
                      ),
                      btn(
                        pending ? "正在提交…" : "读取并绑定",
                        () => sync(addPlatform),
                        "arrow",
                        "psw-accent",
                        pending,
                      ),
                    ),
                  )
                : h(
                    React.Fragment,
                    null,
                    h(
                      "div",
                      { className: "psw-options" },
                      platforms.map((p) =>
                        h(
                          "button",
                          {
                            className: "psw-option",
                            key: p.id,
                            disabled: !!state?.accounts[p.id],
                            onClick: () => {
                              setAddPlatform(p.id);
                              setUrl("");
                            },
                          },
                          h(Logo, { id: p.id }),
                          p.label,
                          state?.accounts[p.id] &&
                            h("span", { className: "psw-muted" }, "已添加"),
                        ),
                      ),
                    ),
                    h(
                      "button",
                      {
                        className: "psw-developer psw-quiet",
                        onClick: () => setModal("developer"),
                      },
                      h(Icon, { name: "code" }),
                      h(
                        "span",
                        null,
                        "开发新平台接入",
                        h("small", null, "生成项目专属开发任务"),
                      ),
                      h(Icon, { name: "arrow", size: 16 }),
                    ),
                  )
              : modal === "developer"
                ? h(Developer)
                : modal === "unbind"
                  ? h(
                      React.Fragment,
                      null,
                      h(
                        "p",
                        null,
                        "解除 ",
                        state?.accounts[selected]?.name,
                        " 的绑定后，将停止该平台的自动同步。现有历史保留为只读档案，不影响平台账号与作品。",
                      ),
                      h(
                        "div",
                        { className: "psw-dialogfooter" },
                        btn("取消", () => setModal(null)),
                        btn(
                          "确认解除",
                          async () => {
                            if (
                              await action(
                                "unbind",
                                { platform: selected, confirm: true },
                                {
                                  close: true,
                                  message: "已解除绑定，历史已归档",
                                },
                              )
                            ) {
                              setSelected(null);
                              goSettings();
                            }
                          },
                          null,
                          "psw-danger",
                          pending,
                        ),
                      ),
                    )
                  : modal === "revoke"
                    ? h(
                        React.Fragment,
                        null,
                        h(
                          "p",
                          null,
                          "撤销后需要重新配对才能使用此浏览器同步。已有账号、作品和历史继续保留。",
                        ),
                        h(
                          "div",
                          { className: "psw-dialogfooter" },
                          btn("取消", () => setModal("connection")),
                          btn(
                            "确认撤销",
                            () =>
                              action(
                                "browser/revoke",
                                { confirm: true },
                                { close: true, message: "浏览器授权已撤销" },
                              ),
                            null,
                            "psw-danger",
                            pending,
                          ),
                        ),
                      )
                    : h(
                        React.Fragment,
                        null,
                        h(
                          React.Fragment,
                          null,
                          h(ConnectionCard, { connection }),
                          h("p", { className: "psw-note" }, "浏览器连接正常不代表各平台已登录；同步时会分别检查。"),
                          h(
                            "ol",
                            { className: "psw-instructions" },
                            h(
                              "li",
                              null,
                              h(
                                "a",
                                {
                                  className: "psw-download-extension",
                                  href: new URL(
                                    "api/personal-social/browser/download",
                                    document.baseURI,
                                  ).pathname,
                                  download:
                                    "personal-social-browser-connector.zip",
                                },
                                h(Icon, { name: "download", size: 17 }), "点击下载浏览器扩展",
                              ),
                              h("p", { className: "psw-install-hint" }, "下载 ZIP 安装包，解压后在 Chrome / Edge 扩展管理页加载 chromium 文件夹。"),
                            ),
                            h(
                              "li",
                              null,
                              "生成连接码，在浏览器工具栏的“跨平台账号看板 · 本机连接”中粘贴并授权。一次只连接一个浏览器，重新配对会替换旧授权。",
                            ),
                          ),
                          h(
                            "div",
                            { className: "psw-actions" },
                            btn(
                              "生成连接码",
                              async () => {
                                const result = await action(
                                  "browser/pair",
                                  {},
                                );
                                if (result) { pairingAttempt.current = result.id ? { id: result.id } : null; setPair(result); setNotice("连接码已生成，请在浏览器连接器中配对"); }
                              },
                              "browser",
                              "psw-primary",
                              pending || connection?.available === false,
                            ),
                            connection?.paired &&
                              btn(
                                "撤销授权",
                                () => setModal("revoke"),
                                null,
                                "psw-quiet psw-danger",
                                pending,
                              ),
                          ),
                          pair &&
                            h(
                              "div",
                              null,
                              h(
                                "label",
                                { className: "psw-field" },
                                "连接码 · 两分钟内有效，请勿分享",
                                h("textarea", {
                                  className: "psw-pair",
                                  readOnly: true,
                                  value: pair.code,
                                  rows: 3,
                                  onFocus: (e) => e.currentTarget.select(),
                                }),
                              ),
                              Date.now() > pair.expiresAt &&
                                h(
                                  "p",
                                  { className: "psw-danger" },
                                  "连接码已过期，请重新生成。",
                                ),
                            ),
                          h(
                            "details",
                            null,
                            h("summary", null, "其他浏览器与支持范围"),
                            h(
                              "p",
                              {
                                className: "psw-muted",
                                style: { fontSize: 12 },
                              },
                              "Firefox 可在 about:debugging 临时加载 firefox 文件夹内的 manifest.json，重启后需重新加载。Safari 和移动浏览器尚未适配。打开系统默认浏览器并不代表已授权读取。",
                            ),
                          ),
                        ),
                        addPlatform &&
                          h(
                            "div",
                            { className: "psw-dialogfooter" },
                            btn(
                              "返回添加平台",
                              () => setModal("add"),
                              "back",
                              "psw-primary",
                            ),
                          ),
                      ),
          ),
      );
    }
    let AccessManagement = null;
    function apply(ctx, { accessManagement = null } = {}) {
      // The standalone entry supplies this UI component; it is not a Cordis service.
      AccessManagement = accessManagement;
      ctx.effect(() =>
        ctx.desktopWorkbenches.register(
          {
            title: "跨平台账号看板",
            repository: "https://github.com/beianbai/cross-platform-account-dashboard",
            description: "小红书、抖音、哔哩哔哩、X，一个看板查看账号与作品。支持定时同步、每日趋势和本地历史记录，可扩展更多平台。",
            screenshot: "data:image/png;base64,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",
            icon: "◈",
            customFrame: true,
          },
          Panel,
        ),
      );
    }
    return { apply, inject: ["desktopWorkbenches"] };
  },
});
