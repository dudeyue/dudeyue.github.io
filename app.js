(() => {
  "use strict";

  const STORAGE_KEYS = {
    orders: "dudeyue_ship_orders_v1",
    fuels: "dudeyue_ship_fuels_v1",
    theme: "dudeyue_ship_theme_v1"
  };

  const DEFAULT_FUEL = 50000;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const els = {
    todayLabel: $("#todayLabel"),
    liveClock: $("#liveClock"),
    themeBtn: $("#themeBtn"),

    todayProfit: $("#todayProfit"),
    todayRevenue: $("#todayRevenue"),
    todayOrders: $("#todayOrders"),
    todayAverage: $("#todayAverage"),
    todayFuel: $("#todayFuel"),

    orderForm: $("#orderForm"),
    amountInput: $("#amountInput"),

    fuelForm: $("#fuelForm"),
    fuelInput: $("#fuelInput"),

    tabs: $$(".tab"),
    rangeLabel: $("#rangeLabel"),
    rangeRevenue: $("#rangeRevenue"),
    rangeFuel: $("#rangeFuel"),
    rangeProfit: $("#rangeProfit"),
    rangeOrders: $("#rangeOrders"),
    rangeAverageOrder: $("#rangeAverageOrder"),
    rangeAverageDay: $("#rangeAverageDay"),

    orderList: $("#orderList"),
    emptyState: $("#emptyState"),
    clearAllBtn: $("#clearAllBtn"),

    exportBtn: $("#exportBtn"),
    importInput: $("#importInput"),
    toast: $("#toast")
  };

  let orders = loadJSON(STORAGE_KEYS.orders, []);
  let fuels = loadJSON(STORAGE_KEYS.fuels, {});
  let activeRange = "day";
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

  function nowLocalParts(date = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    return {
      dateKey: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      iso: date.toISOString(),
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

  function parseAmount(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
  }

  function orderDate(order) {
    return new Date(order.createdAt);
  }

  function getTodayKey() {
    return nowLocalParts().dateKey;
  }

  function getFuel(dateKey) {
    return Number(fuels[dateKey] || 0);
  }

  function getRangeBounds(range) {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (range === "week") {
      const mondayOffset = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - mondayOffset);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    }

    if (range === "month") {
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }

  function dateKeyFromDate(date) {
    return nowLocalParts(date).dateKey;
  }

  function calculateStats(range) {
    const { start, end } = getRangeBounds(range);

    const rangeOrders = orders.filter((order) => {
      const date = orderDate(order);
      return date >= start && date <= end;
    });

    const revenue = rangeOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);

    const dateKeys = [];
    const cursor = new Date(start);
    cursor.setHours(12, 0, 0, 0);

    while (cursor <= end) {
      dateKeys.push(dateKeyFromDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const fuel = dateKeys.reduce((sum, key) => sum + getFuel(key), 0);
    const profit = revenue - fuel;
    const count = rangeOrders.length;
    const averageOrder = count ? revenue / count : 0;

    const workedDays = new Set(rangeOrders.map((order) => dateKeyFromDate(orderDate(order))));
    const averageDay = workedDays.size ? revenue / workedDays.size : 0;

    return {
      revenue,
      fuel,
      profit,
      count,
      averageOrder,
      averageDay,
      start,
      end
    };
  }

  function rangeText(range, stats) {
    if (range === "day") return "Hôm nay";

    if (range === "week") {
      const start = stats.start.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      const end = stats.end.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      return `${start} - ${end}`;
    }

    return stats.start.toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric"
    });
  }

  function renderToday() {
    const stats = calculateStats("day");

    els.todayRevenue.textContent = formatMoney(stats.revenue);
    els.todayFuel.textContent = formatMoney(stats.fuel);
    els.todayProfit.textContent = formatMoney(stats.profit);
    els.todayOrders.textContent = String(stats.count);
    els.todayAverage.textContent = formatMoney(stats.averageOrder);

    els.fuelInput.value = stats.fuel || "";
  }

  function renderRange() {
    const stats = calculateStats(activeRange);

    els.rangeLabel.textContent = rangeText(activeRange, stats);
    els.rangeRevenue.textContent = formatMoney(stats.revenue);
    els.rangeFuel.textContent = formatMoney(stats.fuel);
    els.rangeProfit.textContent = formatMoney(stats.profit);
    els.rangeOrders.textContent = String(stats.count);
    els.rangeAverageOrder.textContent = formatMoney(stats.averageOrder);
    els.rangeAverageDay.textContent = formatMoney(stats.averageDay);

    els.tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.range === activeRange);
    });
  }

  function renderOrders() {
    const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recent = sorted.slice(0, 100);

    els.orderList.innerHTML = "";
    els.emptyState.hidden = recent.length > 0;

    recent.forEach((order) => {
      const date = orderDate(order);
      const item = document.createElement("article");
      item.className = "order-item";

      const main = document.createElement("div");
      main.className = "order-main";

      const amount = document.createElement("strong");
      amount.textContent = formatMoney(order.amount);

      const time = document.createElement("span");
      time.textContent = date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      const del = document.createElement("button");
      del.className = "delete-btn";
      del.type = "button";
      del.textContent = "🗑️";
      del.setAttribute("aria-label", "Xóa đơn");
      del.addEventListener("click", () => deleteOrder(order.id));

      main.append(amount, time);
      item.append(main, del);
      els.orderList.append(item);
    });
  }

  function renderAll() {
    renderToday();
    renderRange();
    renderOrders();
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

    const accepted = confirm(`Xóa đơn ${formatMoney(target.amount)}?`);
    if (!accepted) return;

    orders = orders.filter((order) => order.id !== id);
    saveAll();
    renderAll();
    showToast("Đã xóa đơn");
  }

  function saveFuel(amount) {
    fuels[getTodayKey()] = amount;
    saveAll();
    renderAll();
    showToast("Đã lưu tiền xăng hôm nay");
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
    const now = nowLocalParts();
    els.todayLabel.textContent = now.displayDate;
    els.liveClock.textContent = now.displayTime;
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    els.themeBtn.textContent = theme === "light" ? "🌙" : "☀️";
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  }

  function exportBackup() {
    const payload = {
      app: "Dudeyue Ship",
      version: 1,
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
    anchor.download = `dudeyue-ship-backup-${getTodayKey()}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    showToast("Đã xuất bản sao lưu");
  }

  async function importBackup(file) {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      if (!Array.isArray(payload.orders) || typeof payload.fuels !== "object" || payload.fuels === null) {
        throw new Error("Dữ liệu không đúng định dạng");
      }

      const accepted = confirm("Nhập bản sao lưu sẽ thay thế toàn bộ dữ liệu hiện tại. Tiếp tục?");
      if (!accepted) return;

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

    const accepted = confirm("Xóa toàn bộ đơn và tiền xăng? Hành động này không thể hoàn tác.");
    if (!accepted) return;

    orders = [];
    fuels = {};
    saveAll();
    renderAll();
    showToast("Đã xóa toàn bộ dữ liệu");
  }

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

  els.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activeRange = tab.dataset.range;
      renderRange();
    });
  });

  els.themeBtn.addEventListener("click", toggleTheme);
  els.exportBtn.addEventListener("click", exportBackup);
  els.importInput.addEventListener("change", () => {
    const file = els.importInput.files?.[0];
    if (file) importBackup(file);
  });
  els.clearAllBtn.addEventListener("click", clearAllData);

  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "dark";
  applyTheme(savedTheme);

  const todayKey = getTodayKey();
  if (!(todayKey in fuels)) {
    fuels[todayKey] = DEFAULT_FUEL;
    saveAll();
  }

  updateClock();
  setInterval(updateClock, 1000);
  renderAll();
})();
