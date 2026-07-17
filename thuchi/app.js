const KEYS = {
  entries: "dudeyue_qlythuchi_entries_v2",
  settings: "dudeyue_qlythuchi_settings_v2",
  budget: "dudeyue_qlythuchi_budget_v2",
  theme: "dudeyue_qlythuchi_theme_v2",
  oil: "dudeyue_qlythuchi_oil_v2"
};

const defaults = {
  settings: {
    groupFee: 450000,
    dataFee: 70000,
    phoneFee: 100000,
    debtFee: 1900000,
    oilInterval: 1500,
    oilCost: 100000,
    debtDay: 5,
    debtEnd: `${new Date().getFullYear()}-12`
  },
  budget: {
    food: 2200000,
    cigarette: 350000,
    fuel: 1500000,
    other: 500000
  },
  oil: { lastChangedKm: 0, currentKm: 0 }
};

const $ = id => document.getElementById(id);
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const fmt = n => money.format(Math.round(Number(n) || 0));
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const save = () => {
  localStorage.setItem(KEYS.entries, JSON.stringify(state.entries));
  localStorage.setItem(KEYS.settings, JSON.stringify(state.settings));
  localStorage.setItem(KEYS.budget, JSON.stringify(state.budget));
  localStorage.setItem(KEYS.oil, JSON.stringify(state.oil));
};

const state = {
  entries: load(KEYS.entries, []),
  settings: { ...defaults.settings, ...load(KEYS.settings, {}) },
  budget: { ...defaults.budget, ...load(KEYS.budget, {}) },
  oil: { ...defaults.oil, ...load(KEYS.oil, {}) },
  type: "income",
  quickCategory: null
};

function localDate(d = new Date()) {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0,10);
}
function localMonth(d = new Date()) { return localDate(d).slice(0,7); }
function dateText(s) {
  return new Intl.DateTimeFormat("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric" })
    .format(new Date(`${s}T12:00:00`));
}
function categoryInfo(cat) {
  return {
    fuel:["⛽","Xăng xe"], food:["🍚","Ăn uống"], cigarette:["🚬","Thuốc lá"],
    phone:["📱","Điện thoại"], maintenance:["🔧","Sửa xe / dầu máy"],
    debt:["💳","Trả nợ"], group:["👥","Phí nhóm"], other:["📦","Chi khác"],
    income:["💰","Thu nhập"]
  }[cat] || ["📦","Khác"];
}
function monthEntries(month = $("monthPicker").value) {
  return state.entries.filter(e => e.date.startsWith(month));
}
function fixedTotal() {
  const s = state.settings;
  return s.groupFee + s.dataFee + s.phoneFee + s.debtFee;
}
function totals(month = $("monthPicker").value) {
  const list = monthEntries(month);
  const income = list.filter(e=>e.type==="income").reduce((a,e)=>a+e.amount,0);
  const variable = list.filter(e=>e.type==="expense").reduce((a,e)=>a+e.amount,0);
  return { list, income, variable, expense: variable + fixedTotal(), net: income - variable - fixedTotal() };
}
function showToast(text) {
  $("toast").textContent = text;
  $("toast").classList.add("show");
  setTimeout(()=>$("toast").classList.remove("show"),1600);
}
function n(id) { return Number($(id).value || 0); }

function renderDashboard() {
  const t = totals();
  $("dashIncome").textContent = fmt(t.income);
  $("dashExpense").textContent = fmt(t.expense);
  $("dashFixed").textContent = fmt(fixedTotal());
  $("dashNet").textContent = fmt(t.net);

  const uniqueDays = new Set(t.list.filter(e=>e.type==="income").map(e=>e.date)).size;
  const avgIncome = uniqueDays ? t.income / uniqueDays : 0;
  const picked = new Date(`${$("monthPicker").value}-01T12:00:00`);
  const days = new Date(picked.getFullYear(), picked.getMonth()+1, 0).getDate();
  const forecast = avgIncome * days - t.variable / Math.max(uniqueDays,1) * days - fixedTotal();
  $("dashForecast").textContent = uniqueDays ? fmt(forecast) : "Chưa đủ dữ liệu";

  let advice = "Nhập dữ liệu để xem tình hình tài chính.";
  if (t.income > 0) {
    const ratio = t.expense / t.income;
    if (t.net < 0) advice = "Tháng này đang âm. Hạn chế chi không cần thiết và ưu tiên tiền nợ.";
    else if (ratio > .8) advice = "Bạn đã dùng hơn 80% thu nhập. Nên siết chi những ngày tới.";
    else if (ratio > .6) advice = "Tài chính đang trong vùng cần theo dõi.";
    else advice = "Tình hình đang ổn. Giữ phần còn lại làm quỹ dự phòng.";
  }
  $("dashAdvice").textContent = advice;

  renderCategoryBars(t.list);
  renderDebt();
}

function renderCategoryBars(list) {
  const expense = list.filter(e=>e.type==="expense");
  const grouped = {};
  expense.forEach(e=>grouped[e.category]=(grouped[e.category]||0)+e.amount);
  const max = Math.max(...Object.values(grouped),1);
  const order = Object.entries(grouped).sort((a,b)=>b[1]-a[1]).slice(0,6);
  $("categoryBars").innerHTML = order.length ? order.map(([cat,val]) => {
    const [icon,name] = categoryInfo(cat);
    return `<div class="bar-row">
      <div class="bar-meta"><span>${icon} ${name}</span><strong>${fmt(val)}</strong></div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(3,val/max*100)}%"></div></div>
    </div>`;
  }).join("") : `<div class="empty-state">Chưa có khoản chi trong tháng.</div>`;
}

function renderDebt() {
  const end = state.settings.debtEnd ? new Date(`${state.settings.debtEnd}-01T12:00:00`) : new Date();
  const now = new Date();
  const months = Math.max(0, (end.getFullYear()-now.getFullYear())*12 + end.getMonth()-now.getMonth()+1);
  $("debtMonths").textContent = `${months} tháng`;
  $("debtRemaining").textContent = fmt(months * state.settings.debtFee);
}

function renderHistory() {
  const type = $("filterType").value;
  const month = $("filterMonth").value;
  const list = [...state.entries]
    .filter(e => (!month || e.date.startsWith(month)) && (type==="all" || e.type===type))
    .sort((a,b)=>b.date.localeCompare(a.date) || b.createdAt-a.createdAt);

  $("emptyState").style.display = list.length ? "none" : "block";
  $("historyList").innerHTML = list.map(e => {
    const [icon,name] = categoryInfo(e.type==="income" ? "income" : e.category);
    return `<article class="history-item">
      <div class="history-icon">${icon}</div>
      <div class="history-main">
        <strong>${name}</strong>
        <span>${dateText(e.date)}${e.note ? " · "+escapeHtml(e.note) : ""}</span>
      </div>
      <div class="history-money ${e.type==="income" ? "income" : ""}">
        <strong>${e.type==="income" ? "+" : "-"}${fmt(e.amount)}</strong>
        <div class="history-actions">
          <button class="mini-btn edit-entry" data-id="${e.id}">Sửa</button>
          <button class="mini-btn delete-entry" data-id="${e.id}">Xóa</button>
        </div>
      </div>
    </article>`;
  }).join("");

  document.querySelectorAll(".delete-entry").forEach(btn => btn.onclick = () => {
    state.entries = state.entries.filter(e=>e.id!==btn.dataset.id);
    save(); renderAll(); showToast("Đã xóa giao dịch");
  });
  document.querySelectorAll(".edit-entry").forEach(btn => btn.onclick = () => editEntry(btn.dataset.id));
}

function escapeHtml(s) {
  const d=document.createElement("div"); d.textContent=s; return d.innerHTML;
}

function editEntry(id) {
  const e = state.entries.find(x=>x.id===id);
  if (!e) return;
  switchPage("add");
  setType(e.type);
  $("entryDate").value = e.date;
  $("amount").value = e.amount;
  $("category").value = e.category || "fuel";
  $("note").value = e.note || "";
  state.entries = state.entries.filter(x=>x.id!==id);
  save();
  showToast("Sửa rồi bấm Lưu giao dịch");
}

function renderBudget() {
  const list = monthEntries().filter(e=>e.type==="expense");
  const cats = [
    ["food","🍚 Ăn uống"],["cigarette","🚬 Thuốc lá"],
    ["fuel","⛽ Xăng xe"],["other","📦 Chi khác"]
  ];
  $("budgetProgress").innerHTML = cats.map(([cat,name])=>{
    const spent = list.filter(e=>e.category===cat).reduce((a,e)=>a+e.amount,0);
    const limit = state.budget[cat] || 0;
    const pct = limit ? Math.min(100, spent/limit*100) : 0;
    return `<div class="bar-row">
      <div class="bar-meta"><span>${name}</span><strong>${fmt(spent)} / ${fmt(limit)}</strong></div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join("");
}

function renderOil() {
  const driven = Math.max(0, state.oil.currentKm - state.oil.lastChangedKm);
  const left = Math.max(0, state.settings.oilInterval - driven);
  $("oilDriven").textContent = `${driven.toLocaleString("vi-VN")} km`;
  $("oilLeft").textContent = left ? `${left.toLocaleString("vi-VN")} km` : "Nên thay dầu";
}

function renderAll() {
  renderDashboard();
  renderHistory();
  renderBudget();
  renderOil();
}

function switchPage(target) {
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.dataset.page===target));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.target===target));
  const names={dashboard:"Tổng quan",add:"Ghi thu chi",budget:"Ngân sách",history:"Lịch sử",settings:"Cài đặt"};
  $("pageTitle").textContent=names[target];
  window.scrollTo({top:0,behavior:"smooth"});
}

function setType(type) {
  state.type=type;
  document.querySelectorAll(".type-btn").forEach(b=>b.classList.toggle("active",b.dataset.type===type));
  $("categoryWrap").classList.toggle("hidden",type==="income");
  $("kmWrap").classList.add("hidden");
}

document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>switchPage(b.dataset.target));
document.querySelectorAll(".type-btn").forEach(b=>b.onclick=()=>setType(b.dataset.type));

$("category").onchange = () => $("kmWrap").classList.toggle("hidden",$("category").value!=="maintenance");

$("entryForm").onsubmit = e => {
  e.preventDefault();
  const amount=n("amount");
  if (!amount) return showToast("Hãy nhập số tiền");
  const category=state.type==="income" ? "income" : $("category").value;
  const odometer=n("odometer");
  if (odometer) state.oil.currentKm=Math.max(state.oil.currentKm,odometer);
  state.entries.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type:state.type, category, amount,
    date:$("entryDate").value, note:$("note").value.trim(), createdAt:Date.now()
  });
  $("amount").value=""; $("note").value=""; $("odometer").value="";
  save(); renderAll(); showToast("Đã lưu giao dịch");
};

document.querySelectorAll(".quick-add").forEach(btn=>btn.onclick=()=>{
  state.quickCategory=btn.dataset.quick;
  const [,name]=categoryInfo(state.quickCategory);
  $("quickTitle").textContent=state.quickCategory==="income" ? "Thêm thu nhập" : `Thêm ${name}`;
  $("quickAmount").value="";
  $("quickModal").classList.remove("hidden");
  setTimeout(()=>$("quickAmount").focus(),100);
});
$("closeModal").onclick=()=> $("quickModal").classList.add("hidden");
$("saveQuick").onclick=()=>{
  const amount=n("quickAmount");
  if(!amount) return;
  state.entries.push({
    id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type:state.quickCategory==="income" ? "income":"expense",
    category:state.quickCategory, amount, date:localDate(), note:"", createdAt:Date.now()
  });
  save(); renderAll(); $("quickModal").classList.add("hidden"); showToast("Đã nhập nhanh");
};

$("saveSettings").onclick=()=>{
  ["groupFee","dataFee","phoneFee","debtFee","oilInterval","oilCost","debtDay"].forEach(k=>state.settings[k]=n(k));
  state.settings.debtEnd=$("debtEnd").value;
  save(); renderAll(); showToast("Đã lưu cài đặt");
};
$("saveBudget").onclick=()=>{
  state.budget={food:n("budgetFood"),cigarette:n("budgetCigarette"),fuel:n("budgetFuel"),other:n("budgetOther")};
  save(); renderAll(); showToast("Đã lưu ngân sách");
};
$("markOilChanged").onclick=()=>{
  const km=state.oil.currentKm;
  if(!km && !confirm("Bạn chưa nhập số km hiện tại. Vẫn đánh dấu đã thay dầu?")) return;
  state.oil.lastChangedKm=km;
  state.entries.push({
    id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    type:"expense",category:"maintenance",amount:state.settings.oilCost,date:localDate(),
    note:"Thay dầu máy",createdAt:Date.now()
  });
  save(); renderAll(); showToast("Đã ghi nhận thay dầu");
};

$("prevMonth").onclick=()=>moveMonth(-1);
$("nextMonth").onclick=()=>moveMonth(1);
function moveMonth(delta){
  const d=new Date(`${$("monthPicker").value}-01T12:00:00`);
  d.setMonth(d.getMonth()+delta);
  $("monthPicker").value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  $("filterMonth").value=$("monthPicker").value;
  renderAll();
}
$("monthPicker").onchange=()=>{ $("filterMonth").value=$("monthPicker").value; renderAll(); };
$("filterMonth").onchange=renderHistory;
$("filterType").onchange=renderHistory;

$("themeBtn").onclick=()=>{
  document.body.classList.toggle("light");
  const light=document.body.classList.contains("light");
  localStorage.setItem(KEYS.theme,light?"light":"dark");
  $("themeBtn").textContent=light?"🌙":"☀️";
};

$("exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify({version:2,exportedAt:new Date().toISOString(),...state},null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`qlythuchi-backup-${localDate()}.json`;
  a.click(); URL.revokeObjectURL(a.href);
};
$("importFile").onchange=async e=>{
  const file=e.target.files[0]; if(!file)return;
  try{
    const data=JSON.parse(await file.text());
    state.entries=Array.isArray(data.entries)?data.entries:state.entries;
    state.settings={...state.settings,...data.settings};
    state.budget={...state.budget,...data.budget};
    state.oil={...state.oil,...data.oil};
    save(); fillInputs(); renderAll(); showToast("Khôi phục thành công");
  }catch{ showToast("File sao lưu không hợp lệ"); }
};
$("clearAll").onclick=()=>{
  if(confirm("Xóa toàn bộ giao dịch và thiết lập đã lưu?")){
    Object.values(KEYS).forEach(k=>localStorage.removeItem(k));
    location.reload();
  }
};

function fillInputs(){
  Object.entries(state.settings).forEach(([k,v])=>{if($(k))$(k).value=v});
  $("budgetFood").value=state.budget.food;
  $("budgetCigarette").value=state.budget.cigarette;
  $("budgetFuel").value=state.budget.fuel;
  $("budgetOther").value=state.budget.other;
}

(function init(){
  const today=localDate(), month=localMonth();
  $("entryDate").value=today;
  $("todayText").textContent=dateText(today);
  $("monthPicker").value=month;
  $("filterMonth").value=month;
  fillInputs();
  if(localStorage.getItem(KEYS.theme)==="light"){
    document.body.classList.add("light"); $("themeBtn").textContent="🌙";
  }
  renderAll();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(()=>{});
})();
