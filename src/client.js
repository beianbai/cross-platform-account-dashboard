window.__ModuleLoader__.load({
  id: "dsh-workbench-personal-social-local",

  factory(require) {
    const React = require("react"),
      h = React.createElement;
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
      try { return window.localStorage.getItem(themeKey) === "dark" ? "dark" : "light"; }
      catch { return "light"; }
    }
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
    function SuccessNotice({ message, onClose }) {
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
      return h("div", { className: "psw-feedback psw-result", role: "status", "aria-live": "polite",
        style: { animationPlayState: paused ? "paused" : "running" },
        onPointerEnter: () => pause("pointer"), onPointerLeave: () => resume("pointer"),
        onFocus: () => pause("focus"), onBlur: e => { if (!e.currentTarget.contains(e.relatedTarget)) resume("focus"); } },
        h(Icon, { name: "check", size: 17 }), h("span", null, message),
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
.psw .psw-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}.psw .psw-card{background:linear-gradient(135deg,#202a32 0,var(--card) 55%);border:1px solid #36434e;border-radius:14px;padding:20px;min-width:0;position:relative;overflow:hidden;box-shadow:inset 0 1px #ffffff04,0 7px 20px #0000000d;transition:border-color .2s,box-shadow .2s,transform .24s var(--ease)}.psw .psw-card:hover{border-color:#536775;box-shadow:0 12px 30px #00000020;transform:translateY(-2px)}.psw .psw-card.is-syncing{border-color:#79dfda70}.psw .psw-card.is-syncing:before{content:'';position:absolute;top:0;left:0;width:45%;height:2px;background:linear-gradient(90deg,transparent,var(--accent),transparent);animation:psw-scan 1.8s ease-in-out infinite}.psw .psw-sync-flash{position:absolute;inset:0;pointer-events:none;border:1px solid transparent;border-radius:inherit;animation:psw-complete 1.5s var(--ease) both}.psw .psw-card-top{display:flex;align-items:center;gap:9px;min-width:0}.psw .psw-logo{width:33px;height:33px;display:grid;place-items:center;border-radius:9px;background:#59313a;color:#ffd0d4;flex-shrink:0;box-shadow:inset 0 0 0 1px #ffffff0a}.psw .psw-logo>span{font-size:10px;font-weight:800;letter-spacing:-1px}.psw .psw-douyin,.psw .psw-x{background:#10171d;color:#eef4f9}.psw .psw-bilibili{background:#183d50;color:#91d8ef}.psw .psw-status{margin-left:auto;color:var(--muted);font-size:11px;display:flex;align-items:center;gap:5px;border:1px solid var(--line);border-radius:20px;padding:3px 8px;white-space:nowrap}.psw .is-syncing .psw-status{color:var(--accent);border-color:#79dfda40;background:#79dfda08}
.psw .psw-account{display:flex;align-items:center;gap:10px;min-width:0}.psw .psw-card .psw-account{margin-top:18px}.psw .psw-avatar{width:37px;height:37px;border-radius:50%;object-fit:cover;background:linear-gradient(130deg,#39505a,#26343c);color:#c4e7e9;display:grid;place-items:center;font-size:15px;flex-shrink:0;border:1px solid #52717b50}.psw .psw-account>div{min-width:0}.psw .psw-account h3{font-size:15px;overflow-wrap:anywhere;line-height:1.4}.psw .psw-account small{display:block;color:var(--muted);margin-top:3px;font-size:11px}.psw .psw-mainmetric{display:flex;justify-content:space-between;gap:14px;margin-top:18px;align-items:center}.psw .psw-big{font-family:ui-sans-serif,-apple-system,sans-serif;font-size:38px;line-height:1.1;letter-spacing:-1.6px;font-weight:580;font-variant-numeric:tabular-nums;display:block}.psw .psw-metriclabel{display:block;color:var(--muted);font-size:12px;margin-bottom:6px}.psw .psw-delta{display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap;color:var(--green);font-size:12px;margin-top:7px}.psw .psw-delta.negative{color:var(--danger)}.psw .psw-delta small{color:var(--muted);font-size:11px}.psw .psw-spark{width:40%;max-width:180px}.psw .psw-spark svg{width:100%;height:55px;display:block}.psw .psw-spark span{font-size:11px;color:var(--muted);display:block;text-align:right;margin-top:5px}.psw .psw-accumulation{display:grid;justify-items:end;gap:4px;color:var(--muted);padding:12px 0 6px 12px;max-width:47%;text-align:right;background-image:radial-gradient(#9fbfcd20 .8px,transparent .8px);background-size:8px 8px}.psw .psw-accumulation svg{color:#8faebc;margin-bottom:3px}.psw .psw-accumulation strong{font-size:12px;font-weight:500;color:#bccbd5;background:var(--card)}.psw .psw-accumulation span{font-size:11px;background:var(--card)}
.psw .psw-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:14px 0;margin-top:16px;border-top:1px solid var(--line)}.psw .psw-stats b{font-weight:550;font-size:18px;font-variant-numeric:tabular-nums;letter-spacing:-.25px}.psw .psw-stats span{color:var(--muted);font-size:11px;display:block;margin-top:2px}.psw .psw-cardfooter{display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:9px;border-top:1px solid var(--line)}.psw .psw-cardfooter small{font-size:11px;color:var(--muted)}.psw .psw-cardfooter button{min-height:40px;font-size:12px;padding:8px}.psw .psw-cardfooter .psw-actions{gap:2px}.psw .psw-cardfooter .psw-icon-button{width:40px}.psw .psw-note{font-size:12px;color:var(--muted);margin-top:20px;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
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
.psw .psw-theme-toggle{position:relative;width:38px;height:38px;min-height:38px;padding:0;border-radius:50%;background:var(--paper);border-color:var(--line);overflow:hidden}.psw .psw-theme-toggle svg{position:absolute;transition:transform .32s var(--ease),opacity .2s;color:var(--muted)}.psw .psw-theme-sun{opacity:1;transform:rotate(0) scale(1)}.psw .psw-theme-moon{opacity:0;transform:rotate(-70deg) scale(.5)}.psw[data-theme=dark] .psw-theme-sun{opacity:0;transform:rotate(70deg) scale(.5)}.psw[data-theme=dark] .psw-theme-moon{opacity:1;transform:rotate(0) scale(1);color:var(--accent)}.psw .psw-theme-toggle:hover{background:var(--accent-soft)}
.psw .psw-select{position:relative;display:block;min-width:0;margin-top:7px}.psw .psw-select-trigger{display:flex;width:100%;justify-content:space-between;min-height:44px;text-align:left;background:var(--field);padding:10px 12px;border-color:var(--line);font-size:13px;font-weight:400;white-space:normal}.psw .psw-select-trigger>span{min-width:0;overflow-wrap:anywhere}.psw .psw-select-trigger[aria-expanded=true]{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}.psw .psw-select-trigger>svg{color:var(--muted);transition:transform .18s var(--ease)}.psw .psw-select-trigger[aria-expanded=true]>svg{transform:rotate(180deg)}.psw .psw-select-options{position:absolute;left:0;right:0;display:block;z-index:8;padding:5px;overflow:auto;overscroll-behavior:contain;background:var(--card);border:1px solid var(--hover-border);border-radius:10px;box-shadow:0 12px 28px #17244820}.psw .psw-select-options button{width:100%;justify-content:space-between;text-align:left;font-size:13px;font-weight:400;white-space:normal;padding:10px;border:0;border-radius:6px;background:transparent}.psw .psw-select-options button[data-active=true]{background:var(--soft)}.psw .psw-select-options button[aria-selected=true]{color:var(--accent);background:var(--accent-soft)}
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
    function Modal({ title, onClose, children }) {
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
        [notice, setNotice] = React.useState(""),
        [localSync, setLocalSync] = React.useState({}),
        [highlighted, setHighlighted] = React.useState({}),
        [workKind, setWorkKind] = React.useState("全部"),
        [workPage, setWorkPage] = React.useState(1),
        [theme, setTheme] = React.useState(savedTheme),
        [platformErrors, setPlatformErrors] = React.useState({}),
        [operationError, setOperationError] = React.useState(null),
        [guideMode, setGuideMode] = React.useState(savedGuide);
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
                const ws = s.accounts[id]?.workSync;
                const result = ws?.status === "incremental" ? "增量扫描完成" : ws?.status === "complete" && ws?.historyComplete ? "历史已读到末尾" : "记录已保存，历史范围尚未确认";
                setNotice(`${label}同步成功 · ${result} · ${unchanged ? "数据无变化，已核对最新记录" : "最新记录已保存"}`);
                setHighlighted(old => ({ ...old, [id]: outcome.completedAt || outcome.jobId || Date.now() }));
                delete manualJobs.current[id];
              } else if (outcome.phase === "paused") {
                const reason = s.accounts[id]?.workSync?.reason;
                setNotice(`${s.platforms?.find(p => p.id === id)?.label || id}已暂停 · 已保存进度 · ${reason === "legacy_connector" ? "请更新浏览器连接器后继续" : reason === "needs_login" ? "请先在浏览器登录" : reason === "needs_attention" ? "请先在浏览器完成验证" : s.accounts[id]?.workSync?.mode === "incremental" ? "可继续增量同步" : "可继续补齐历史"}`);
                delete manualJobs.current[id];
              } else if (outcome.error || ["needs_login", "needs_attention", "connection_offline", "parse_error", "account_mismatch", "network_error", "error"].includes(outcome.phase)) {
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
      const goDetail = (id) => {
        scrollRef.current = mainRef.current?.scrollTop || 0;
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
        requestAnimationFrame(() =>
          mainRef.current?.scrollTo?.(0, scrollRef.current),
        );
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
        : btn(guideScheduled ? "查看同步计划" : "设置自动同步", () => setView("settings"), "clock", "psw-primary");
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
              h(Delta, { rows: a.daily }),
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
            h("button", { type: "button", className: "psw-theme-toggle psw-icon-button", "aria-label": theme === "light" ? "切换为深色" : "切换为浅色", title: theme === "light" ? "切换为深色" : "切换为浅色",
              onClick: () => { const next = theme === "light" ? "dark" : "light"; setTheme(next); try { window.localStorage.setItem(themeKey, next); } catch {} } },
              h(Icon, { name: "sun", size: 19, className: "psw-theme-sun" }), h(Icon, { name: "moon", size: 19, className: "psw-theme-moon" })),
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
            h(
              "button",
              {
                className: "psw-quiet psw-settings-button",
                "aria-label": view === "settings" ? "返回账号总览" : "设置",
                onClick: () => {
                  setView(view === "settings" ? "overview" : "settings");
                  setNotice("");
                },
              },
              h(Icon, { name: view === "settings" ? "grid" : "settings" }),
              view === "settings" ? "账号总览" : "设置",
            ),
          ),
        ),
        h("style", null, styles),
        h(
          "main",
          { ref: mainRef },
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
            notice && !modal && h(SuccessNotice, { key: notice, message: notice, onClose: () => setNotice("") }),
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
                      h("div", { className: "psw-actions" }, guideControl(), btn("返回账号", back, "back", "psw-quiet")),
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
                              "自动 · 优先已保存的可用连接",
                            ),
                            h(
                              "option",
                              { value: "browser" },
                              "常用浏览器 · 扩展连接",
                            ),
                            h("option", { value: "ego" }, "Ego Lite"),
                          ),
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
                                onSave: (body) => action("settings", body, { message: "visible" in body ? (body.visible ? "已在首页展示" : "已从首页隐藏，自动同步计划不变") : "" }),
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
                        btn(
                          archived ? "返回设置" : "全部账号",
                          () => (archived ? setView("settings") : back()),
                          "back",
                          "psw-quiet",
                        ),
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
                                  ? setView("settings")
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
                            () => setView("settings"),
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
        modal &&
          h(
            Modal,
            {
              key: modal,
              title:
                modal === "add"
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
            notice && h(SuccessNotice, { key: notice, message: notice, onClose: () => setNotice("") }),
            modal === "unbind" && operationError?.path === "unbind" && operationError.platform === selected &&
              h("div", { className: "psw-notice error", role: "alert" }, operationError.message),
            modal === "add" && issues.filter(item => item.p.id === addPlatform).map(issue),
            issues.length > 0 && modal === "connection" && issues.map(issue),
            modal === "add"
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
                              setView("settings");
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
                              "自动 · 优先已保存的可用连接",
                            ),
                            h(
                              "option",
                              { value: "browser" },
                              "常用浏览器 · 扩展连接",
                            ),
                            h("option", { value: "ego" }, "Ego Lite"),
                          ),
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
                                else setError(result.environment?.message || "尚未检测到可用连接，请打开浏览器后重新检测。");
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
            repository: "https://github.com/dsh-local-5bb86301/personal-social",
            description: "小红书、抖音、哔哩哔哩、X，一个看板查看账号与作品。支持定时同步、每日趋势和本地历史记录，可扩展更多平台。",
            screenshot: "__WORKBENCH_COVER__",
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
