(() => {
  "use strict";

  const STORAGE_KEYS = {
    orders: "dudeyue_ship_orders_v1",
    fuels: "dudeyue_ship_fuels_v1",
    theme: "dudeyue_ship_theme_v1"
  };

  const DEFAULT_FUEL = 50000;

  const ICONS = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 16 4-4 3 3 5-7"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
    receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v20l3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2Z"/><path d="M9 9h6M9 13h6"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>'
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const els = {
    pageTitle: $("#pageTitle"),
    todayLabel: $("#todayLabel"),
    liveClock: $("#liveClock"),
    themeBtn: $("#themeBtn"),
    quickFuelBtn: $("#quickFuelBtn"),

    pages: $$(".page"),
    navItems: $$(".nav-item"),

    todayProfit: $("#todayProfit"),
    todayRevenue: $("#todayRevenue"),
    todayOrders: $("#todayOrders"),
    todayAverage: $("#todayAverage"),
    todayFuel: $("#todayFuel"),

    orderForm: $("#orderForm"),
    amountInput: $("#amountInput"),
    fuelForm: $("#fuelForm"),
    fuelInput: $("#fuelInput"),

    recentOrderList: $("#recentOrderList"),
    recentEmptyState: $("#recentEmptyState"),

    metricTabs: $$("#metricTabs .segment"),
    periodTabs: $$("#periodTabs .segment"),
    barChart: $("#barChart"),
    chartTotal: $("#chartTotal"),
    statsRangeTitle: $("#statsRangeTitle"),
    statsRevenue: $("#statsRevenue"),
    statsFuel: $("#statsFuel"),
    statsProfit: $("#statsProfit"),
    statsOrders: $("#statsOrders"),
    statsAverageOrder: $("#statsAverageOrder"),
    statsAverageDay: $("#statsAverageDay"),
    statsBestDay: $("#statsBestDay"),

    historyGroups: $("#historyGroups"),
    historyEmptyState: $("#historyEmptyState"),
    clearAllBtn: $("#clearAllBtn"),
    exportBtn: $("#exportBtn"),
    importInput: $("#importInput"),
    toast: $("#toast")
  };

  let orders = loadJSON(STORAGE_KEYS.orders, []);
  let fuels = loadJSON(STORAGE_KEYS.fuels, {});
  let activePage = "home";
  let activeMetric = "revenue";
  let activePeriod = "7d";
  let toastTimer;

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveAll() {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
    localStorage.setItem(STORAGE_KEYS.fuels, JSON.stringify(fuels));
  }

  function nowParts(date = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    return {
      dateKey: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      displayDate: date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }),
      displayTime: date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    };
  }

  function formatMoney(value) {
    return `${Math.round(Number(value) || 0).toLocaleString("vi-VN")} ₫`;
  }

  function compactMoney(value) {
    const number = Math.abs(Number(value) || 0);
    if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(number >= 10_000_000 ? 0 : 1).replace(".", ",")}tr`;
    if (number >= 1_000) return `${Math.round(number / 1_000)}k`;
    return String(Math.round(number));
  }

  function parseAmount(value) {
    const digits = String(value ?? "").replace(/\D/g, "");
    const number = Number(digits);
    return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
  }

  function formatInputMoney(value) {
    const amount = parseAmount(value);
    return amount ? amount.toLocaleString("vi-VN") : "";
  }

  function dateKey(date) {
    return nowParts(date).dateKey;
  }

  function getFuel(key) {
    return Number(fuels[key] || 0);
  }

  function getTodayStats() {
    const today = dateKey(new Date());
    const todayOrders = orders.filter((order) => dateKey(new Date(order.createdAt)) === today);
    const revenue = todayOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const fuel = getFuel(today);
    const count = todayOrders.length;
    const profit = count ? revenue - fuel : 0;

    return {
      revenue,
      fuel,
      profit,
      count,
      average: count ? revenue / count : 0
    };
  }

  function switchPage(page) {
    activePage = page;

    els.pages.forEach((section) => {
      const active = section.dataset.page === page;
      section.hidden = !active;
      section.classList.toggle("active", active);
    });

    els.navItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.target === page);
    });

    const titles = {
      stats: "Thống kê",
      home: "Hôm nay",
      history: "Lịch sử"
    };

    els.pageTitle.textContent = titles[page];

    if (page === "stats") renderStatsPage();
    if (page === "history") renderHistory();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderToday() {
    const stats = getTodayStats();

    els.todayRevenue.textContent = formatMoney(stats.revenue);
    els.todayFuel.textContent = formatMoney(stats.fuel);
    els.todayProfit.textContent = formatMoney(stats.profit);
    els.todayOrders.textContent = String(stats.count);
    els.todayAverage.textContent = formatMoney(stats.average);
    els.fuelInput.value = stats.fuel ? stats.fuel.toLocaleString("vi-VN") : "";
  }

  function renderRecentOrders() {
    const recent = [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    els.recentOrderList.innerHTML = "";
    els.recentEmptyState.hidden = recent.length > 0;

    recent.forEach((order) => {
      els.recentOrderList.append(createOrderItem(order));
    });
  }

  function createOrderItem(order) {
    const item = document.createElement("article");
    item.className = "order-item";

    const main = document.createElement("div");
    main.className = "order-main";

    const amount = document.createElement("strong");
    amount.textContent = formatMoney(order.amount);

    const time = document.createElement("span");
    time.textContent = new Date(order.createdAt).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.type = "button";
    del.innerHTML = ICONS.trash;
    del.setAttribute("aria-label", "Xóa đơn");
    del.addEventListener("click", () => deleteOrder(order.id));

    main.append(amount, time);
    item.append(main, del);

    return item;
  }

  function periodBuckets(period) {
    const now = new Date();
    const buckets = [];

    if (period === "7d") {
      for (let i = 6; i >= 0; i--) {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - i);

        const end = new Date(start);
        end.setHours(23, 59, 59, 999);

        buckets.push({
          label: start.toLocaleDateString("vi-VN", { weekday: "short" }).replace("Th ", "T"),
          fullLabel: start.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
          start,
          end,
          dateKeys: [dateKey(start)],
          isToday: i === 0
        });
      }
    }

    if (period === "4w") {
      const current = new Date(now);
      current.setHours(0, 0, 0, 0);
      const mondayOffset = (current.getDay() + 6) % 7;
      current.setDate(current.getDate() - mondayOffset);

      for (let i = 3; i >= 0; i--) {
        const start = new Date(current);
        start.setDate(start.getDate() - i * 7);

        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        const keys = [];
        const cursor = new Date(start);
        while (cursor <= end) {
          keys.push(dateKey(cursor));
          cursor.setDate(cursor.getDate() + 1);
        }

        buckets.push({
          label: `T${4 - i}`,
          fullLabel: `${start.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} - ${end.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`,
          start,
          end,
          dateKeys: keys,
          isToday: i === 0
        });
      }
    }

    if (period === "6m") {
      for (let i = 5; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

        const keys = [];
        const cursor = new Date(start);
        while (cursor <= end) {
          keys.push(dateKey(cursor));
          cursor.setDate(cursor.getDate() + 1);
        }

        buckets.push({
          label: `T${start.getMonth() + 1}`,
          fullLabel: start.toLocaleDateString("vi-VN", { month: "long", year: "numeric" }),
          start,
          end,
          dateKeys: keys,
          isToday: i === 0
        });
      }
    }

    return buckets;
  }

  function bucketStats(bucket) {
    const bucketOrders = orders.filter((order) => {
      const date = new Date(order.createdAt);
      return date >= bucket.start && date <= bucket.end;
    });

    const revenue = bucketOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const fuel = bucket.dateKeys.reduce((sum, key) => sum + getFuel(key), 0);
    const count = bucketOrders.length;
    const profit = count ? revenue - fuel : 0;

    return { revenue, fuel, profit, count };
  }

  function renderStatsPage() {
    const buckets = periodBuckets(activePeriod).map((bucket) => ({
      ...bucket,
      ...bucketStats(bucket)
    }));

    const totals = buckets.reduce((acc, item) => {
      acc.revenue += item.revenue;
      acc.fuel += item.fuel;
      acc.profit += item.profit;
      acc.count += item.count;
      return acc;
    }, { revenue: 0, fuel: 0, profit: 0, count: 0 });

    const workedDays = new Set(
      orders
        .filter((order) => {
          if (!buckets.length) return false;
          const date = new Date(order.createdAt);
          return date >= buckets[0].start && date <= buckets[buckets.length - 1].end;
        })
        .map((order) => dateKey(new Date(order.createdAt)))
    );

    const best = [...buckets].sort((a, b) => b.revenue - a.revenue)[0];

    els.statsRevenue.textContent = formatMoney(totals.revenue);
    els.statsFuel.textContent = formatMoney(totals.fuel);
    els.statsProfit.textContent = formatMoney(totals.profit);
    els.statsOrders.textContent = String(totals.count);
    els.statsAverageOrder.textContent = formatMoney(totals.count ? totals.revenue / totals.count : 0);
    els.statsAverageDay.textContent = formatMoney(workedDays.size ? totals.revenue / workedDays.size : 0);
    els.statsBestDay.textContent = best && best.revenue ? `${best.fullLabel} · ${formatMoney(best.revenue)}` : "—";

    const titles = {
      "7d": "7 ngày gần nhất",
      "4w": "4 tuần gần nhất",
      "6m": "6 tháng gần nhất"
    };
    els.statsRangeTitle.textContent = titles[activePeriod];

    const metricTotals = {
      revenue: totals.revenue,
      profit: totals.profit,
      orders: totals.count
    };

    els.chartTotal.textContent = activeMetric === "orders"
      ? `${metricTotals.orders} đơn`
      : formatMoney(metricTotals[activeMetric]);

    renderChart(buckets);
  }

  function renderChart(buckets) {
    const svg = els.barChart;
    svg.innerHTML = "";

    const width = 360;
    const height = 230;
    const left = 34;
    const right = 12;
    const top = 18;
    const bottom = 34;
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;

    const values = buckets.map((item) => {
      if (activeMetric === "orders") return item.count;
      return item[activeMetric];
    });

    const maxValue = Math.max(...values, 0);

    for (let i = 0; i < 4; i++) {
      const y = top + (chartHeight / 3) * i;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", left);
      line.setAttribute("x2", width - right);
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      line.setAttribute("class", "chart-grid-line");
      svg.append(line);

      const value = maxValue ? maxValue * (1 - i / 3) : 0;
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", left - 6);
      label.setAttribute("y", y + 3);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("class", "chart-label");
      label.textContent = activeMetric === "orders" ? String(Math.round(value)) : compactMoney(value);
      svg.append(label);
    }

    if (!maxValue) {
      const empty = document.createElementNS("http://www.w3.org/2000/svg", "text");
      empty.setAttribute("x", width / 2);
      empty.setAttribute("y", height / 2);
      empty.setAttribute("text-anchor", "middle");
      empty.setAttribute("class", "chart-empty");
      empty.textContent = "Chưa có dữ liệu";
      svg.append(empty);
    }

    const slot = chartWidth / buckets.length;
    const barWidth = Math.min(28, slot * .56);
    const peak = Math.max(...values);

    buckets.forEach((item, index) => {
      const value = values[index];
      const barHeight = maxValue ? Math.max(value ? 5 : 0, (value / maxValue) * chartHeight) : 0;
      const x = left + index * slot + (slot - barWidth) / 2;
      const y = top + chartHeight - barHeight;

      const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bar.setAttribute("x", x);
      bar.setAttribute("y", y);
      bar.setAttribute("width", barWidth);
      bar.setAttribute("height", barHeight);
      bar.setAttribute("rx", Math.min(8, barWidth / 2));
      bar.setAttribute("class", `chart-bar${item.isToday ? " today" : ""}${value === peak && peak > 0 ? " peak" : ""}`);

      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `${item.fullLabel}: ${activeMetric === "orders" ? `${value} đơn` : formatMoney(value)}`;
      bar.append(title);
      svg.append(bar);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", x + barWidth / 2);
      label.setAttribute("y", height - 12);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("class", "chart-label");
      label.textContent = item.label;
      svg.append(label);

      if (value > 0) {
        const valueLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valueLabel.setAttribute("x", x + barWidth / 2);
        valueLabel.setAttribute("y", Math.max(top + 10, y - 6));
        valueLabel.setAttribute("text-anchor", "middle");
        valueLabel.setAttribute("class", "chart-value");
        valueLabel.textContent = activeMetric === "orders" ? String(value) : compactMoney(value);
        svg.append(valueLabel);
      }
    });
  }

  function renderHistory() {
    const groups = {};

    [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((order) => {
        const key = dateKey(new Date(order.createdAt));
        (groups[key] ||= []).push(order);
      });

    const keys = Object.keys(groups).sort().reverse();
    els.historyGroups.innerHTML = "";
    els.historyEmptyState.hidden = keys.length > 0;

    keys.forEach((key) => {
      const dayOrders = groups[key];
      const revenue = dayOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
      const fuel = getFuel(key);
      const profit = dayOrders.length ? revenue - fuel : 0;
      const date = new Date(`${key}T12:00:00`);

      const section = document.createElement("section");
      section.className = "history-day";

      const head = document.createElement("div");
      head.className = "history-day-head";

      const title = document.createElement("strong");
      title.textContent = date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });

      const summary = document.createElement("span");
      summary.textContent = `${dayOrders.length} đơn · ${formatMoney(revenue)} · Lãi ${formatMoney(profit)} · Xăng ${formatMoney(fuel)}`;

      head.append(title, summary);
      section.append(head);

      dayOrders.forEach((order) => section.append(createOrderItem(order)));
      els.historyGroups.append(section);
    });
  }

  function renderAll() {
    renderToday();
    renderRecentOrders();

    if (activePage === "stats") renderStatsPage();
    if (activePage === "history") renderHistory();
  }

  function addOrder(amount) {
    const createdAt = new Date();

    orders.push({
      id: `${createdAt.getTime()}-${Math.random().toString(16).slice(2)}`,
      createdAt: createdAt.toISOString(),
      amount
    });

    saveAll();
    renderAll();
    showToast("Đã lưu đơn");
  }

  function deleteOrder(id) {
    const target = orders.find((order) => order.id === id);
    if (!target) return;

    if (!confirm(`Xóa đơn ${formatMoney(target.amount)}?`)) return;

    orders = orders.filter((order) => order.id !== id);
    saveAll();
    renderAll();
    showToast("Đã xóa đơn");
  }

  function saveFuel(amount) {
    fuels[dateKey(new Date())] = amount;
    saveAll();
    renderAll();
    showToast("Đã lưu tiền xăng hôm nay");
  }

  function quickEditFuel() {
    const current = getFuel(dateKey(new Date()));
    const input = prompt("Nhập tiền xăng hôm nay:", current ? current.toLocaleString("vi-VN") : "");
    if (input === null) return;
    saveFuel(parseAmount(input));
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("show");

    toastTimer = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2200);
  }

  function updateClock() {
    const now = nowParts();
    els.todayLabel.textContent = now.displayDate;
    els.liveClock.textContent = now.displayTime;
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    els.themeBtn.innerHTML = theme === "light" ? ICONS.moon : ICONS.sun;
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  }

  function exportBackup() {
    const payload = {
      app: "Dudeyue Ship",
      version: 2,
      exportedAt: new Date().toISOString(),
      orders,
      fuels
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dudeyue-ship-backup-${dateKey(new Date())}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    showToast("Đã xuất bản sao lưu");
  }

  async function importBackup(file) {
    try {
      const payload = JSON.parse(await file.text());

      if (!Array.isArray(payload.orders) || typeof payload.fuels !== "object" || payload.fuels === null) {
        throw new Error("Dữ liệu không đúng định dạng");
      }

      if (!confirm("Nhập sao lưu sẽ thay thế toàn bộ dữ liệu hiện tại. Tiếp tục?")) return;

      orders = payload.orders;
      fuels = payload.fuels;
      saveAll();
      renderAll();
      showToast("Khôi phục dữ liệu thành công");
    } catch (error) {
      alert(`Không thể nhập dữ liệu: ${error.message}`);
    } finally {
      els.importInput.value = "";
    }
  }

  function clearAllData() {
    if (!orders.length && !Object.keys(fuels).length) {
      showToast("Không có dữ liệu để xóa");
      return;
    }

    if (!confirm("Xóa toàn bộ đơn và tiền xăng? Hành động này không thể hoàn tác.")) return;

    orders = [];
    fuels = {};
    saveAll();
    renderAll();
    showToast("Đã xóa toàn bộ dữ liệu");
  }

  function installIcons() {
    $$("[data-icon]").forEach((node) => {
      node.innerHTML = ICONS[node.dataset.icon] || "";
    });

    els.quickFuelBtn.innerHTML = ICONS.pencil;
  }

  els.navItems.forEach((item) => {
    item.addEventListener("click", () => switchPage(item.dataset.target));
  });

  els.amountInput.addEventListener("input", () => {
    els.amountInput.value = formatInputMoney(els.amountInput.value);
  });

  els.fuelInput.addEventListener("input", () => {
    els.fuelInput.value = formatInputMoney(els.fuelInput.value);
  });

  els.orderForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const amount = parseAmount(els.amountInput.value);
    if (amount <= 0) {
      alert("Hãy nhập giá ship lớn hơn 0.");
      els.amountInput.focus();
      return;
    }

    addOrder(amount);
    els.amountInput.value = "";
    els.amountInput.focus();
  });

  els.fuelForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveFuel(parseAmount(els.fuelInput.value));
  });

  els.metricTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeMetric = tab.dataset.metric;
      els.metricTabs.forEach((item) => item.classList.toggle("active", item === tab));
      renderStatsPage();
    });
  });

  els.periodTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activePeriod = tab.dataset.period;
      els.periodTabs.forEach((item) => item.classList.toggle("active", item === tab));
      renderStatsPage();
    });
  });

  els.themeBtn.addEventListener("click", toggleTheme);
  els.quickFuelBtn.addEventListener("click", quickEditFuel);
  els.exportBtn.addEventListener("click", exportBackup);
  els.clearAllBtn.addEventListener("click", clearAllData);

  els.importInput.addEventListener("change", () => {
    const file = els.importInput.files?.[0];
    if (file) importBackup(file);
  });

  installIcons();

  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "dark";
  applyTheme(savedTheme);

  const todayKey = dateKey(new Date());
  if (!(todayKey in fuels)) {
    fuels[todayKey] = DEFAULT_FUEL;
    saveAll();
  }

  updateClock();
  setInterval(updateClock, 1000);
  renderAll();
})();
