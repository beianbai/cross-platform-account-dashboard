/* Built single-file module; no runtime compiler required. */
window.__ModuleLoader__.load({
  id: "dsh-workbench-personal-social-local",

  factory(require) {
    const React = require("react"),
      h = React.createElement;
    const FEEDBACK_URL = "https://my.feishu.cn/share/base/shrcn3QhjgppqaD3vnhVP4KUWXf";
    const appVersion = typeof "0.6.2" === "string" ? "0.6.2" : "开发预览（未构建）";
    const runtimeMode = typeof "桌面工作台" === "string" ? "桌面工作台" : "开发预览";
    const providerNames = { auto: "自动选择", browser: "浏览器扩展", ego: "Ego Lite 专用连接" };
    const autoProviderHelp = "优先使用已配对的浏览器扩展；未配对时尝试 Ego Lite。";
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
.psw .psw-detail-head{margin:22px 0 26px;display:flex;align-items:center;justify-content:space-between;gap:20px}.psw .psw-detail-head .psw-avatar{width:55px;height:55px;font-size:23px}.psw .psw-detail-head .psw-account h3{font-size:22px}.psw .psw-bio{margin-top:8px;color:var(--muted);max-width:650px;overflow-wrap:anywhere}.psw .psw-metric-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--card);margin-bottom:18px}.psw .psw-metric-tabs button{display:block;text-align:left;min-height:92px;border-radius:0;border:0;border-right:1px solid var(--line);padding:17px 20px;position:relative}.psw .psw-metric-tabs button:last-child{border-right:0}.psw .psw-metric-tabs button[aria-pressed=true]{background:linear-gradient(145deg,#254245,#213238)}.psw .psw-metric-tabs button[aria-pressed=true]:after{position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--accent);content:''}.psw .psw-metric-tabs b{font-size:25px;display:block;font-weight:580;font-variant-numeric:tabular-nums}.psw .psw-chart-panel{padding:24px;border:1px solid var(--line);border-radius:14px;background:var(--card)}.psw .psw-segment{display:flex;gap:3px;padding:3px;border-radius:8px;background:#10171e;border:1px solid #303c48}.psw .psw-segment button{padding:6px 12px;font-size:12px;min-height:34px;border:0;background:transparent;border-radius:5px;color:var(--muted)}.psw .psw-segment button[aria-pressed=true]{background:#30424a;color:var(--accent);box-shadow:0 1px 5px #00000020}.psw .psw-chart-summary{margin-top:18px;min-height:25px;display:flex;gap:10px;align-items:center;font-size:12px;color:var(--muted)}.psw .psw-chart-summary strong{font-size:15px;color:var(--ink);font-variant-numeric:tabular-nums}.psw .psw-chart{width:100%;height:250px;display:block;overflow:visible;animation:psw-chart .28s var(--ease)}.psw .psw-chart text,.psw .psw-delta-chart text{font:11px -apple-system,sans-serif;fill:var(--muted)}.psw .psw-chart circle{cursor:pointer;transition:r .12s}.psw .psw-chart circle:hover,.psw .psw-chart circle:focus{r:6}.psw .psw-chart-empty{min-height:160px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--muted)}.psw .psw-chart-empty svg{color:var(--accent)}.psw .psw-daily-chart{border-top:1px solid var(--line);margin-top:22px;padding-top:18px}.psw .psw-delta-chart{width:100%;height:160px;display:block;margin-top:10px}.psw .psw-delta-chart rect{cursor:pointer;transition:opacity .15s}.psw .psw-delta-chart rect:hover,.psw .psw-delta-chart rect:focus{opacity:.75}
.psw details{margin-top:12px}.psw summary{cursor:pointer;color:var(--muted);font-size:12px;padding:8px 0}.psw .psw-table-scroll{max-height:240px;overflow:auto;margin-top:8px}.psw table{border-collapse:collapse;width:100%;font-size:12px;text-align:left;font-variant-numeric:tabular-nums}.psw th,.psw td{padding:9px 12px;border-bottom:1px solid var(--line)}.psw th{font-weight:550;color:var(--muted);position:sticky;top:0;background:var(--card)}.psw .psw-section{margin-top:28px}.psw .psw-works{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px;margin-top:18px}.psw .psw-work{min-width:0;border-bottom:1px solid var(--line);padding-bottom:16px}.psw .psw-cover{height:165px;border-radius:10px;background:var(--soft);overflow:hidden;margin-bottom:12px;display:grid;place-items:center;color:var(--muted)}.psw .psw-cover img{width:100%;height:100%;object-fit:cover;transition:transform .35s var(--ease)}.psw .psw-work a:hover img{transform:scale(1.025)}.psw .psw-work h3{font-size:14px;font-weight:550;margin:6px 0;overflow-wrap:anywhere}.psw .psw-work a{color:var(--ink)}.psw .psw-work small{font-size:11px;color:var(--muted)}.psw .psw-coverage{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px}.psw .psw-coverage>div{display:grid;gap:5px;padding:14px;border:1px solid var(--line);border-radius:10px;background:var(--card)}.psw .psw-coverage strong{font-size:13px}.psw .psw-coverage span,.psw .psw-coverage small{font-size:12px}.psw .psw-work-filters{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.psw .psw-work-filters button{font-size:12px;padding:6px 14px;min-height:38px}.psw .psw-work-filters button[aria-pressed=true]{color:var(--accent);background:#244044;border-color:#527f80}
.psw .psw-settings{max-width:980px}.psw .psw-setting-block{border-top:1px solid var(--line);padding:24px 0}.psw .psw-setting-grid{display:grid;grid-template-columns:180px minmax(0,1fr);gap:28px}.psw .psw-setting-body{min-width:0}.psw .psw-setting-body>p{color:var(--muted);font-size:12px;margin:7px 0}.psw .psw-field{display:block;font-size:12px;font-weight:550;margin:15px 0 0;color:#cbd6df}.psw input:not([type=checkbox]),.psw select,.psw textarea{width:100%;border:1px solid #42505e;border-radius:8px;min-height:44px;background:#131b22;padding:10px 12px;color:var(--ink);margin-top:7px;min-width:0;transition:border-color .16s,box-shadow .16s}.psw input::placeholder,.psw textarea::placeholder{color:#8695a2}.psw input:hover:not(:disabled),.psw select:hover:not(:disabled),.psw textarea:hover{border-color:#69828f}.psw input[aria-invalid=true]{border-color:var(--danger)}.psw .psw-field-error{display:block;color:var(--danger);font-size:12px;font-weight:400;margin-top:6px}.psw textarea{resize:vertical;line-height:1.6}.psw .psw-formrow{display:grid;grid-template-columns:1fr 1fr;gap:14px}.psw .psw-check{display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px;min-height:32px}.psw input[type=checkbox]{width:18px;height:18px;accent-color:var(--accent);flex-shrink:0}.psw .psw-toggle-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0}.psw .psw-toggle-row+.psw-toggle-row{border-top:1px solid var(--line)}.psw .psw-schedule{margin:10px 0 18px;padding:0 18px 18px;border:1px solid var(--line);border-radius:10px;background:#121b22}.psw .psw-runtime{font-size:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px;color:var(--muted);margin-top:16px}.psw .psw-runtime b{display:block;font-weight:450;color:var(--ink);margin-top:3px}.psw .psw-platformsetting{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:22px;margin-bottom:16px}.psw .psw-platformsetting .psw-card-top{margin-bottom:12px}.psw .psw-hidden{font-size:11px;background:var(--soft);color:var(--muted);padding:3px 8px;border-radius:4px}.psw .psw-timezone{position:relative}.psw .psw-zone-hint{display:flex;align-items:center;justify-content:space-between;gap:6px;color:var(--muted);font-size:11px;flex-wrap:wrap;margin-top:5px}.psw .psw-zone-hint button{font-size:11px;min-height:32px;padding:4px 6px;color:var(--accent)}.psw .psw-zone-options{position:absolute;top:72px;left:0;right:0;max-height:240px;overflow:auto;z-index:5;padding:6px;background:#202c36;border:1px solid #607786;border-radius:10px;box-shadow:0 15px 35px #0008}.psw .psw-zone-options button{width:100%;text-align:left;justify-content:flex-start;border:0;background:transparent;white-space:normal;font-size:12px;padding:10px;min-height:42px}.psw .psw-zone-options button[aria-selected=true]{background:#35565b;color:#ddfffb}.psw .psw-zone-options p{font-size:12px;padding:12px;color:var(--muted)}.psw .psw-archive-row{display:flex;align-items:center;gap:12px;padding:16px;border:1px solid var(--line);border-radius:10px;background:var(--card);margin-bottom:10px}.psw .psw-archive-info{display:grid;gap:3px;flex:1;min-width:0}.psw .psw-archive-info strong{font-size:13px;font-weight:550}.psw .psw-archive-info span{font-size:12px;overflow-wrap:anywhere}.psw .psw-archive-info small{font-size:11px;color:var(--muted)}
.psw .psw-dialog{color:var(--ink);width:min(620px,100%);max-height:100%;margin:auto;flex-shrink:0;padding:0;background:linear-gradient(150deg,#23303aea,#192129f5);backdrop-filter:blur(24px);border:1px solid #58707c80;border-radius:16px;box-shadow:0 25px 100px #0008,inset 0 1px #ffffff0a;overflow:auto;animation:psw-dialog .22s var(--ease)}.psw .psw-modal-overlay{position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:#050a10aa;backdrop-filter:blur(5px);overflow:hidden}.psw .psw-dialoghead{padding:18px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);position:sticky;top:0;background:#202b35f2;backdrop-filter:blur(14px);z-index:6}.psw .psw-dialogbody{padding:22px 24px 26px}.psw .psw-dialogbody>p{color:var(--muted);font-size:13px;margin-bottom:18px}.psw .psw-options{display:grid;grid-template-columns:1fr 1fr;gap:12px}.psw .psw-option{padding:17px 15px;justify-content:flex-start;gap:12px;font-weight:550;min-height:72px;background:#19232c}.psw .psw-option .psw-muted{margin-left:auto;font-size:11px}.psw .psw-developer{display:flex;align-items:center;gap:12px;width:100%;margin-top:18px;text-align:left;border-top:1px solid var(--line);border-radius:0;padding-top:18px}.psw .psw-developer small{display:block;font-size:11px;color:var(--muted);font-weight:400;margin-top:3px;white-space:normal}.psw .psw-dialogfooter{display:flex;gap:10px;justify-content:flex-end;margin-top:24px;flex-wrap:wrap}.psw .psw-instructions{padding-left:20px;font-size:13px;color:var(--muted)}.psw .psw-instructions li{margin-bottom:12px}.psw .psw-pair{font-family:monospace!important;font-size:12px!important;word-break:break-all}.psw .psw-prompt{font-size:12px!important;min-height:235px}.psw .psw-loading{padding:70px 20px;text-align:center;color:var(--muted)}
.psw .psw-spin{animation:psw-spin 1.2s linear infinite}@keyframes psw-spin{to{transform:rotate(360deg)}}@keyframes psw-scan{from{transform:translateX(-110%)}to{transform:translateX(330%)}}@keyframes psw-dialog{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}@keyframes psw-result{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}@keyframes psw-chart{from{opacity:.4}to{opacity:1}}@keyframes psw-complete{0%{border-color:#93dbb8;background:#93dbb814}100%{border-color:transparent;background:transparent}}

.psw[data-theme=dark]{--ink:#edf0f6;--muted:#a3adbf;--line:#343b4b;--paper:#14171e;--card:#1e232e;--accent:#9baeff;--soft:#2b3240;--green:#93dbb8;--danger:#ffb1a6;--field:#191e28;--hover-border:#607194;--accent-soft:#2a3455;--accent-hover:#b0beff;--success-bg:#20372d;--success-line:#3f6855;--warning-bg:#332d23;--warning-line:#6b583b;--warning-ink:#ead3a9;--error-bg:#38282c;--error-line:#715056;--shadow:0 5px 20px #0002;color-scheme:dark}
.psw .psw-topbar{background:var(--card);border-bottom:1px solid var(--line);backdrop-filter:none}.psw main{background:var(--paper)}.psw button:hover:not(:disabled){border-color:var(--hover-border)}.psw .psw-primary,.psw .psw-accent{color:#fff;box-shadow:0 3px 9px #4d6bfe18}.psw .psw-primary:hover:not(:disabled),.psw .psw-accent:hover:not(:disabled){background:var(--accent-hover);border-color:var(--accent-hover);box-shadow:0 4px 12px #4d6bfe25}.psw[data-theme=dark] .psw-primary,.psw[data-theme=dark] .psw-accent{color:#1b2544}.psw .psw-connection{background:transparent;border-color:transparent}.psw .psw-dot.online{box-shadow:0 0 0 3px var(--accent-soft)}
.psw .psw-card{background:var(--card);border-color:var(--line);box-shadow:var(--shadow);cursor:pointer}.psw .psw-card:hover{border-color:var(--hover-border);box-shadow:0 8px 24px #25345710}.psw .psw-card.is-syncing{border-color:var(--accent)}.psw .is-syncing .psw-status{color:var(--accent);border-color:var(--hover-border);background:var(--accent-soft)}.psw .psw-avatar{background:var(--accent-soft);color:var(--accent);border-color:var(--line)}.psw .psw-accumulation{background-image:none;padding-right:2px}.psw .psw-accumulation strong,.psw .psw-accumulation svg{color:var(--muted)}.psw .psw-logo{background:#ffedf0;color:#bc2846;box-shadow:none}.psw .psw-douyin,.psw .psw-x{background:#222630;color:#fff}.psw .psw-bilibili{background:#e5f5fd;color:#16749b}.psw[data-theme=dark] .psw-logo{background:#59313a;color:#ffd0d4}.psw[data-theme=dark] .psw-douyin,.psw[data-theme=dark] .psw-x{background:#10171d;color:#eef4f9}.psw[data-theme=dark] .psw-bilibili{background:#183d50;color:#91d8ef}
.psw .psw-notice{background:var(--warning-bg);border-color:var(--warning-line);color:var(--warning-ink)}.psw .psw-notice p{color:inherit}.psw .psw-notice.error{background:var(--error-bg);border-color:var(--error-line);color:var(--danger)}.psw .psw-platform-issue{cursor:default;align-items:flex-start;flex-wrap:wrap;font-size:12px;padding:12px;gap:10px}.psw .psw-platform-issue .psw-actions{margin-left:auto}.psw .psw-platform-issue button{font-size:12px;min-height:36px;padding:6px 10px}.psw .psw-empty{border-color:var(--hover-border);background:var(--card)}.psw .psw-result{background:var(--success-bg);border-color:var(--success-line);animation:psw-notice-expire 4s linear both}.psw .psw-result button{background:transparent}.psw .psw-metric-tabs button[aria-pressed=true]{background:var(--accent-soft)}.psw .psw-segment{background:var(--paper);border-color:var(--line)}.psw .psw-segment button[aria-pressed=true]{background:var(--card);box-shadow:var(--shadow)}.psw .psw-work-filters button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--hover-border)}
.psw .psw-field{color:var(--ink)}.psw input:not([type=checkbox]),.psw textarea{background:var(--field);border-color:var(--line)}.psw input::placeholder,.psw textarea::placeholder{color:var(--muted)}.psw input:hover:not(:disabled),.psw textarea:hover{border-color:var(--hover-border)}.psw input[aria-invalid=true]{border-color:var(--danger)}.psw .psw-schedule{background:var(--paper)}.psw .psw-zone-options{background:var(--card);border-color:var(--hover-border);box-shadow:0 12px 28px #17244820}.psw .psw-zone-options button[aria-selected=true]{background:var(--accent-soft);color:var(--accent)}.psw .psw-dialog{background:var(--card);border-color:var(--line);backdrop-filter:none;box-shadow:0 24px 80px #1c29463d}.psw .psw-dialoghead{background:var(--card);backdrop-filter:none}.psw .psw-modal-overlay{background:#26345155;backdrop-filter:blur(4px)}.psw[data-theme=dark] .psw-modal-overlay{background:#050a10aa}.psw .psw-option{background:var(--field)}
.psw .psw-theme-toggle{position:relative;width:38px;height:38px;min-height:38px;padding:0;border-radius:50%;background:var(--paper);border-color:var(--line);overflow:hidden}.psw .psw-theme-toggle svg{position:absolute;transition:transform .32s var(--ease),opacity .2s;color:var(--muted)}.psw .psw-theme-toggle svg{opacity:0;transform:rotate(-70deg) scale(.5)}.psw .psw-theme-toggle[data-mode=light] .psw-theme-sun,.psw .psw-theme-toggle[data-mode=dark] .psw-theme-moon,.psw .psw-theme-toggle[data-mode=system] .psw-theme-system{opacity:1;transform:rotate(0) scale(1)}.psw .psw-theme-toggle[data-mode=dark] .psw-theme-moon,.psw .psw-theme-toggle[data-mode=system] .psw-theme-system{color:var(--accent)}.psw .psw-theme-toggle:hover{background:var(--accent-soft)}
.psw .psw-select{position:relative;display:block;min-width:0;margin-top:7px}.psw .psw-select-trigger{display:flex;width:100%;justify-content:space-between;min-height:44px;text-align:left;background:var(--field);padding:10px 12px;border-color:var(--line);font-size:13px;font-weight:400;white-space:normal}.psw .psw-select-trigger>span{min-width:0;overflow-wrap:anywhere}.psw .psw-select-trigger[aria-expanded=true]{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}.psw .psw-select-trigger>svg{color:var(--muted);transition:transform .18s var(--ease)}.psw .psw-select-trigger[aria-expanded=true]>svg{transform:rotate(180deg)}.psw .psw-select-options{position:absolute;left:0;right:0;display:block;z-index:8;padding:5px;overflow:auto;overscroll-behavior:contain;background:var(--card);border:1px solid var(--hover-border);border-radius:10px;box-shadow:0 12px 28px #17244820}.psw .psw-select-options button{width:100%;justify-content:space-between;text-align:left;font-size:13px;font-weight:400;white-space:normal;padding:10px;border:0;border-radius:6px;background:transparent}.psw .psw-select-options button[data-active=true]{background:var(--soft)}.psw .psw-select-options button[aria-selected=true]{color:var(--accent);background:var(--accent-soft)}
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
    function Modal({ title, onClose, notification, children }) {
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
          h("div", { className: "psw-dialogbody" }, children),
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
      mayOpenWindow,
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
        mayOpenWindow &&
          h(
            "p",
            {
              className: "psw-muted",
              style: { fontSize: 12, marginBottom: 12 },
            },
            "此连接执行计划时可能打开浏览器任务窗口；宿主与浏览器需保持运行。需要登录时会暂停。",
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
          `请为当前 personal-social-workbench 项目增加 ${form.name} 的只读账号接入。先阅读项目现状、docs/PLATFORM-DEVELOPMENT.md 与 docs/superpowers/specs/2026-10-11-cross-platform-v04-design.md，保持包身份 dsh-workbench-personal-social-local 与 DSH customFrame。\n\n平台信息\n- 官方域名：${official.hostname}\n- 个人主页示例：${parsed.origin}${parsed.pathname}\n- 指标与定义：${form.metrics}\n- 登录要求：${form.login}\n\n请检查并扩展 src/platforms.mjs 的平台定义与指标、src/collector.mjs 的可见 DOM 提取、extension/adapter.mjs 与 extension/background.mjs 的受限域名连接，以及 src/browser-runner.mjs 的现有 browser / ego 通路。仅增加精确必要域名权限，并在 scripts/build.mjs 中保持连接器构建一致。\n\n通过 src/core.mjs 与 src/store.mjs 的 v2 持久化入口保存账号身份、快照和 daily 日记录；成功写入前核对稳定账号身份，账号不符拒绝覆盖。未知指标为 null，保留 display / value / approximate；没有观测的日期留空，仅相邻自然日可计算每日净变化。作品列表要注明当前页面范围，不将列表长度当作品总数。\n\n沿用 dsh/index.js 的 state、sync、login、settings、unbind 接口以及 src/scheduler.mjs 的独立计划和串行队列。恢复登录沿用原平台与浏览器，不复制登录态、不导出 Cookie 或凭据，不发布、不点赞、不执行任意用户脚本。自动任务不可抢焦点；等待登录、验证、离线、网络失败、解析失败和身份不符应给出准确可恢复状态，失败保留最后成功快照。\n\nsrc/client.js 从 platforms 元数据展示新平台，复用总览、7/30/90 天缺口趋势、每日变化、作品与设置；首次同步成功才绑定。保持宿主共享 React 单文件加载方式与 石墨冷光 / 银白文字 / 冰青强调设计。\n\n先增加有效与缺失指标、约数、中英文数字、身份校验、本人内容边界、错误恢复和自动后台任务的测试，再实现。运行测试、构建和包检查，并进行真实浏览器与窄容器验证；清楚标记尚未验证的真实账号读取。请勿自动安装、执行第三方脚本或将未经验证的接入标记为可用。`,
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
      const noticeSerial = React.useRef(0);
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
        provider = settings.provider || "auto",
        connection = state?.browserConnection,
        environment = state?.environment;
      const online =
        provider === "browser"
          ? !!connection?.online
          : provider === "ego"
            ? environment?.status === "ready"
            : !!connection?.online || environment?.status === "ready";
      const mayOpenWindow =
        provider === "ego" || (provider === "auto" && !connection?.paired);
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
              } else if (outcome.phase === "paused") {
                const reason = s.accounts[id]?.workSync?.reason;
                setNotice(`${s.platforms?.find(p => p.id === id)?.label || id}已暂停 · 已保存进度 · ${reason === "legacy_connector" ? "请更新浏览器连接器后继续" : reason === "needs_login" ? "请先在浏览器登录" : reason === "needs_attention" ? "请先在浏览器完成验证" : s.accounts[id]?.workSync?.mode === "incremental" ? "可继续增量同步" : "可继续补齐历史"}`, "warning");
                delete manualJobs.current[id];
              } else if (outcome.error || ["needs_login", "needs_attention", "connection_offline", "parse_error", "account_mismatch", "network_error", "error"].includes(outcome.phase)) {
                if (outcome.automatic !== true) setNotice(`${s.platforms?.find(p => p.id === id)?.label || id}同步未完成：${outcome.error || outcome.lastResult || "请检查账号旁的提示后重试。"}`, ["needs_login", "needs_attention"].includes(outcome.phase) ? "warning" : "error");
                delete manualJobs.current[id];
              }
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
          ...(path === "sync" ? { mode: options.mode || (resume ? status(id)?.progress?.mode || a?.workSync?.mode : null) || (a?.workSync?.historyComplete ? "incremental" : "history"), ...(options.restart ? { restart: true } : {}) } : {}),
          ...(resume && status(id)?.url ? { url: status(id).url } : url && addPlatform === id ? { url } : {}),
          provider: resume && status(id)?.provider ? status(id).provider : provider,
          ...(resume ? { resume: true } : {}),
        }, { close: true });
        if (!result) { delete manualJobs.current[id]; setLocalSync(old => { const next = { ...old }; delete next[id]; return next; }); }
        return result;
      };
      const phaseLabel = s => ({ queued: "排队中", waiting: "等待浏览器", opening: "等待浏览器", connecting: "等待浏览器", reading: "正在读取", collecting: "正在读取", needs_login: "需要登录", needs_attention: "等待处理", complete: "同步完成", paused: "已暂停 · 可继续" }[s?.phase] || (s?.running ? "正在同步" : ""));
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
      const guideConnected = provider === "browser" ? !!connection?.paired : provider === "ego" ? environment?.status === "ready" : !!connection?.paired || environment?.status === "ready";
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
        `连接选择：${providerNames[provider] || "未知"}`,
        `浏览器扩展：${connection?.online ? "ready" : "offline"}`,
        `Ego Lite：${environment?.status === "ready" ? "ready" : "offline"}`,
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
              phaseLabel(s) || (ps(p.id).schedule?.enabled ? "自动同步" : "已绑定"),
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
                h("b", null, metric(a[key])),
                h("span", null, labels[key]),
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
          h(
            "div",
            { className: "psw-brand" },
            h(
              "span",
              { className: "psw-mark" },
              h(BrandMark),
            ),
            "跨平台账号看板",
          ),
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
            view !== "overview" && btn("返回账号总览", back, "back", "psw-quiet psw-header-back"),
            view !== "settings" && btn("设置", goSettings, "settings", "psw-quiet psw-settings-button"),
            btn("帮助", () => { setCopyError(""); setModal("help"); }, null, "psw-quiet psw-settings-button"),
          ),
        ),
        h("style", null, styles),
        !modal && notification,
        h(
          "main",
          { ref: mainRef, onScroll: e => setShowTop(e.currentTarget.scrollTop >= e.currentTarget.clientHeight) },
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
                        h(
                          "div",
                          { className: "psw-field", style: { marginTop: 0 } },
                          "采集通路",
                          h(
                            Select,
                            {
                              "aria-label": "采集通路",
                              value: provider,
                              disabled: pending,
                              onChange: (e) =>
                                action(
                                  "settings",
                                  { provider: e.target.value },
                                  { message: "连接偏好已保存" },
                                ),
                            },
                            h(
                              "option",
                              { value: "auto" },
                              providerNames.auto,
                            ),
                            h(
                              "option",
                              { value: "browser" },
                              providerNames.browser,
                            ),
                            h("option", { value: "ego" }, providerNames.ego),
                          ),
                          provider === "auto" && h("p", { className: "psw-note" }, autoProviderHelp),
                        ),
                        h(
                          "p",
                          null,
                          connection?.paired
                            ? `${connection.label || "已授权浏览器"} · ${connection.online ? "在线" : "离线"}`
                            : "尚未授权常用浏览器",
                        ),
                        btn(
                          "管理连接",
                          () => setModal("connection"),
                          "browser",
                        ),
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
                                mayOpenWindow,
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
                    h("section", { className: "psw-setting-block psw-setting-grid" },
                      h("h2", null, "帮助与反馈"),
                      h("div", { className: "psw-setting-body" },
                        h("div", { className: "psw-actions" }, feedbackLink(), btn("复制诊断信息", () => { setCopyError(""); setModal("help"); }, "copy")),
                        h("p", { className: "psw-note" }, "先预览诊断信息，再决定是否复制到反馈表单。"))),
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
                            onClick: () => sync(selected, account.workSync?.status === "paused" || selectedSync?.phase === "paused"),
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
                              title: platform?.metricInfo?.[key]?.description,
                            },
                            h(
                              "span",
                              { className: "psw-metriclabel" },
                              platform?.metricInfo?.[key]?.label ||
                                labels[key] ||
                                key,
                            ),
                            h("b", null, metric(account[key])),
                          ),
                        ),
                      ),
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
                            : account.workSync ? "历史尚未补齐，已保存的作品会持续累积。" : "旧记录已纳入作品库，历史范围尚未确认。",
                        ),
                        !archived && h("div", { className: "psw-note", role: "status", "aria-live": "polite" },
                          h("p", null, account.workSync?.reason === "legacy_connector" || selectedSync?.reason === "legacy_connector" ? "请更新浏览器连接器后继续；已保存的作品仍保留，历史尚未补齐。" : selectedSync?.phase === "needs_login" || account.workSync?.reason === "needs_login" ? "请先在原浏览器登录，完成后继续；已保存的进度仍保留。" : selectedSync?.phase === "needs_attention" || account.workSync?.reason === "needs_attention" ? "请先在原浏览器完成验证或页面处理，再继续；已保存的进度仍保留。" : selectedBusy ? `${phaseLabel(selectedSync)} · 已保存 ${selectedSync?.progress?.saved ?? account.works?.length ?? 0} 条 · 已读取 ${selectedSync?.progress?.batches ?? 0} 批` : selectedSync?.error ? `同步未完成：${selectedSync.error} 已保存的作品和进度仍保留。` : account.workSync?.status === "paused" || selectedSync?.phase === "paused" ? account.workSync?.mode === "incremental" ? "已保存进度，等待继续增量同步。" : "已保存进度，等待继续补齐历史。" : account.workSync?.status === "incremental" ? "此次增量扫描已完成。" : account.workSync?.status === "complete" && account.workSync?.historyComplete ? "历史已读到末尾。" : "可继续补齐历史，或先更新近期作品。"),
                          h("div", { className: "psw-actions", style: { flexWrap: "wrap" } },
                            selectedBusy
                              ? btn("暂停", () => action("sync/pause", { platform: selected }), null, "", pending)
                              : h(React.Fragment, null,
                                  btn("增量同步", () => sync(selected, account.workSync?.mode === "incremental" && (account.workSync?.status === "paused" || selectedSync?.phase === "paused"), "sync", { mode: "incremental" }), "refresh", "", pending),
                                  btn(account.workSync?.historyCheckpoint || (account.workSync?.status === "paused" && account.workSync?.mode !== "incremental") ? "继续补齐" : "补齐历史", () => sync(selected, true, "sync", { mode: "history" }), null, "", pending),
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
        } }, "↑", "回到顶部"),
        modal &&
          h(
            Modal,
            {
              key: modal,
              notification,
              title:
                modal === "help" ? "帮助与反馈" : modal === "add"
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
            modal === "help"
              ? h(React.Fragment, null,
                  h("div", { className: "psw-help-links" }, guideControl(), feedbackLink()),
                  h("p", { className: "psw-note" }, "意见反馈将在新标签页打开飞书表单。诊断信息仅在你点击复制后写入剪贴板，不会自动上传。"),
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
                          "div",
                          { className: "psw-field", style: { marginTop: 0 } },
                          "采集通路",
                          h(
                            Select,
                            {
                              "aria-label": "采集通路",
                              value: provider,
                              disabled: pending,
                              onChange: (e) =>
                                action("settings", {
                                  provider: e.target.value,
                                }, { message: "采集通路已保存" }),
                            },
                            h(
                              "option",
                              { value: "auto" },
                              providerNames.auto,
                            ),
                            h(
                              "option",
                              { value: "browser" },
                              providerNames.browser,
                            ),
                            h("option", { value: "ego" }, providerNames.ego),
                          ),
                          provider === "auto" && h("p", { className: "psw-note" }, autoProviderHelp),
                        ),
                        provider !== "ego" &&
                          h(
                            React.Fragment,
                            null,
                            h(
                              "p",
                              { style: { marginTop: 18 } },
                              connection?.paired
                                ? `${connection.label || "已授权浏览器"} · ${connection.online ? "连接正常" : "暂未连接，请打开浏览器与连接器"}`
                                : "授权后，使用浏览器已有的登录状态读取账号。",
                            ),
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
                                    href: new URL(
                                      "api/personal-social/browser/download",
                                      document.baseURI,
                                    ).pathname,
                                    download:
                                      "personal-social-browser-connector.zip",
                                  },
                                  "下载本地连接器",
                                ),
                                "，解压后在 Chrome / Edge 的扩展管理页加载 chromium 文件夹。",
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
                                  if (result) { setPair(result); setNotice("连接码已生成，请在浏览器连接器中配对"); }
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
                        provider !== "browser" &&
                          h(
                            "div",
                            { className: "psw-section" },
                            h("h3", null, "Ego Lite"),
                            h(
                              "p",
                              {
                                className: "psw-muted",
                                style: { fontSize: 12, margin: "9px 0 12px" },
                              },
                              environment?.message ||
                                "可以检测本机已有的 Ego Lite 连接。",
                            ),
                            btn(
                              "检测连接",
                              async () => {
                                const result = await action("environment", {});
                                if (!result) return;
                                if (result.environment?.status === "ready") setNotice("连接检测通过");
                                else {
                                  const message = result.environment?.message || "尚未检测到可用连接，请打开浏览器后重新检测。";
                                  setError(message); setNotice(message, "error");
                                }
                              },
                              "refresh",
                              "",
                              pending,
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
    function apply(ctx) {
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
