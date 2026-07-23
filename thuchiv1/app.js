const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const STORAGE_KEY="dudeyue.finance.v3";
const APP_VERSION=6;
const icons={
food:'<path d="M7 3v8m3-8v8M7 7h3m-1.5 4v10M15 3v8a3 3 0 0 0 3 3h1V3m-1 11v7"/>',
fuel:'<path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 9h11M8 13h5"/><path d="m16 7 3 2v8a2 2 0 0 0 2 2"/>',
shopping:'<path d="M6 8h12l1 13H5Z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
entertainment:'<path d="M8 9h8a5 5 0 0 1 4.7 6.7l-.8 2.2a2 2 0 0 1-3.2.8L14 16h-4l-2.7 2.7a2 2 0 0 1-3.2-.8l-.8-2.2A5 5 0 0 1 8 9Z"/><path d="M8 12v4m-2-2h4m6-1h.01m2 2h.01"/>',
transport:'<path d="M5 17h14l-1-7-2-4H8l-2 4Z"/><path d="M7 17v2m10-2v2M6 12h12"/>',
salary:'<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M8 6V4h8v2m-5 6h2"/>',
bonus:'<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 13h18M7.5 8C5 8 5 4 7 4c2.5 0 5 4 5 4m4.5 0C19 8 19 4 17 4c-2.5 0-5 4-5 4"/>',
health:'<path d="M12 21S4 16.5 4 9.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 3.5C20 16.5 12 21 12 21Z"/><path d="M8 12h2l1-2 2 4 1-2h2"/>',
bills:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6m-6 4h6m-6 4h4"/>',
education:'<path d="m3 9 9-5 9 5-9 5Z"/><path d="M7 12v5c3 2 7 2 10 0v-5"/>',
home:'<path d="M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3Z"/>',
other:'<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>',
cash:'<path d="M4 7h16v10H4Z"/><circle cx="12" cy="12" r="2.5"/><path d="M7 7a3 3 0 0 1-3 3m13-3a3 3 0 0 0 3 3M7 17a3 3 0 0 0-3-3m13 3a3 3 0 0 1 3-3"/>',
bank:'<path d="m3 9 9-5 9 5"/><path d="M5 10h14M6 10v8m4-8v8m4-8v8m4-8v8M4 21h16"/>',
card:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/>',
ewallet:'<path d="M4 7.5A3.5 3.5 0 0 1 7.5 4H18a2 2 0 0 1 2 2v2H7.5a3.5 3.5 0 0 0 0 7H20v3a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3Z"/><path d="M7.5 8H21v7H7.5a3.5 3.5 0 0 1 0-7Z"/><circle cx="17" cy="11.5" r="1"/>'
};
const categories=[
{id:'food',name:'Ăn uống',type:'expense'},{id:'fuel',name:'Xăng xe',type:'expense'},{id:'shopping',name:'Mua sắm',type:'expense'},
{id:'entertainment',name:'Giải trí',type:'expense'},{id:'transport',name:'Di chuyển',type:'expense'},{id:'health',name:'Sức khỏe',type:'expense'},
{id:'bills',name:'Hóa đơn',type:'expense'},{id:'education',name:'Giáo dục',type:'expense'},{id:'home',name:'Nhà ở',type:'expense'},
{id:'salary',name:'Lương',type:'income'},{id:'bonus',name:'Thưởng',type:'income'},{id:'other',name:'Khác',type:'both'}];
const walletIcons=['cash','bank','card','ewallet','other'];

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function seed(){
 const now=new Date(), iso=d=>d.toISOString();
 const cashId=uid(),bankId=uid();
 return {version:APP_VERSION,budget:500000,categoryBudgets:{food:250000,fuel:150000,shopping:100000},budgetAlerts:[80,100],wallets:[
  {id:cashId,name:'Tiền mặt',balance:0,icon:'cash'},
  {id:bankId,name:'MB Bank',balance:0,icon:'bank'}
 ],transactions:[],fixedCosts:[
  {id:uid(),name:'Phí nhóm ship',amount:450000,cycle:'monthly',dueDay:1,category:'bills',walletId:bankId,trigger:'manual',paidMonths:[],statusMonths:{}},
  {id:uid(),name:'Data',amount:70000,cycle:'monthly',dueDay:5,category:'bills',walletId:bankId,trigger:'date',paidMonths:[],statusMonths:{}},
  {id:uid(),name:'Điện thoại',amount:100000,cycle:'monthly',dueDay:10,category:'bills',walletId:bankId,trigger:'date',paidMonths:[],statusMonths:{}}
 ],debts:[],setup:{completed:false,completedAt:null},settings:{hideBalance:false}};
}
let state=loadState(), ui={page:'overview',period:'month',typeFilter:'all',walletFilter:null,categoryFilter:null,editingId:null,selectedType:'expense',selectedCategory:'food',selectedWallet:null,selectedToWallet:null,selectedWalletIcon:'bank',editingWalletId:null,contextId:null,financePanel:'wallets',editingFixedId:null,fixedCycle:'monthly',fixedWalletId:null,editingDebtId:null,debtType:'payable',debtWalletId:null,setupWalletId:null,setupPaidIds:new Set()};

function loadState(){
 try{const raw=localStorage.getItem(STORAGE_KEY);return raw?normalize(JSON.parse(raw)):seed()}catch{return seed()}
}
function normalize(data){
 const base=seed();
 const wallets=(data.wallets||data.accounts||data.vi||[]).map((w,i)=>({id:String(w.id||uid()),name:w.name||w.ten||w.title||`Ví ${i+1}`,balance:Number(w.balance??w.amount??w.soDu??0)||0,icon:w.icon||w.type||'bank'}));
 const txs=(data.transactions||data.records||data.giaoDich||data.entries||[]).map(t=>({
  id:String(t.id||uid()),type:mapType(t.type||t.loai),amount:Number(t.amount??t.money??t.soTien??t.value??0)||0,
  note:t.note||t.description||t.noiDung||'',category:t.category||t.categoryId||t.danhMuc||'other',
  walletId:String(t.walletId||t.accountId||t.viId||wallets[0]?.id||''),toWalletId:t.toWalletId?String(t.toWalletId):null,
  date:t.date||t.datetime||t.ngayGio||new Date().toISOString()
 }));
 const fixedCosts=(data.fixedCosts||data.recurringCosts||[]).map(x=>({id:String(x.id||uid()),name:x.name||'Khoản cố định',amount:Number(x.amount||0),cycle:x.cycle||'monthly',dueDay:Number(x.dueDay||1),category:x.category||'bills',walletId:String(x.walletId||wallets[0]?.id||base.wallets[0].id),trigger:x.trigger||(/nhóm/i.test(x.name||'')?'manual':'date'),paidMonths:Array.isArray(x.paidMonths)?x.paidMonths:[],statusMonths:{...(x.statusMonths||{})}}));
 const debts=(data.debts||[]).map(x=>({id:String(x.id||uid()),name:x.name||'Khoản nợ',type:x.type==='receivable'?'receivable':'payable',amount:Number(x.amount||0),paid:Number(x.paid||0),dueDate:x.dueDate||new Date().toISOString().slice(0,10),walletId:String(x.walletId||wallets[0]?.id||base.wallets[0].id)}));
 return {version:APP_VERSION,budget:Number(data.budget??data.monthlyBudget??data.nganSach??500000)||0,categoryBudgets:data.categoryBudgets||{},budgetAlerts:data.budgetAlerts||[80,100],wallets:wallets.length?wallets:base.wallets,transactions:txs,fixedCosts:fixedCosts.length?fixedCosts:base.fixedCosts,debts,setup:{completed:!!data.setup?.completed,completedAt:data.setup?.completedAt||null},settings:{hideBalance:!!(data.settings?.hideBalance)}};
}
function mapType(t){t=String(t||'expense').toLowerCase();if(['income','thu','thu nhập','thu_nhap'].includes(t))return'income';if(['transfer','chuyen','chuyển khoản','chuyen_vi'].includes(t))return'transfer';return'expense'}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function money(v){return new Intl.NumberFormat('vi-VN').format(Math.round(v))+' ₫'}
function num(s){return Number(String(s).replace(/\D/g,''))||0}
function svg(id){return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[id]||icons.other}</svg>`}
function category(id){return categories.find(c=>c.id===id)||categories.at(-1)}
function wallet(id){return state.wallets.find(w=>w.id===id)}
function haptic(ms=10){try{navigator.vibrate?.(ms)}catch{}}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800)}
function getRange(){
 const now=new Date(), start=new Date(now), end=new Date(now);
 if(ui.period==='week'){const d=(now.getDay()+6)%7;start.setDate(now.getDate()-d);start.setHours(0,0,0,0);end.setDate(start.getDate()+7)}
 if(ui.period==='month'){start.setDate(1);start.setHours(0,0,0,0);end.setMonth(start.getMonth()+1)}
 if(ui.period==='year'){start.setMonth(0,1);start.setHours(0,0,0,0);end.setFullYear(start.getFullYear()+1)}
 return [start,end]
}
function filteredPeriod(){const [a,b]=getRange();return state.transactions.filter(t=>{const d=new Date(t.date);return d>=a&&d<b})}
function totals(){
 const tx=filteredPeriod();return {income:tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0),expense:tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)}
}
function actualWalletBalance(w){
 let v=w.balance;state.transactions.forEach(t=>{if(t.type==='income'&&t.walletId===w.id)v+=t.amount;if(t.type==='expense'&&t.walletId===w.id)v-=t.amount;if(t.type==='transfer'){if(t.walletId===w.id)v-=t.amount;if(t.toWalletId===w.id)v+=t.amount}});return v
}

function dayBounds(d=new Date()){const a=new Date(d);a.setHours(0,0,0,0);const b=new Date(a);b.setDate(b.getDate()+1);return[a,b]}
function sumRange(a,b){const t=state.transactions.filter(x=>{const d=new Date(x.date);return d>=a&&d<b});return{income:t.filter(x=>x.type==='income').reduce((s,x)=>s+x.amount,0),expense:t.filter(x=>x.type==='expense').reduce((s,x)=>s+x.amount,0)}}
function monthData(offset=0){const n=new Date(),a=new Date(n.getFullYear(),n.getMonth()+offset,1),b=new Date(n.getFullYear(),n.getMonth()+offset+1,1);return sumRange(a,b)}
function activeDays(){return new Set(state.transactions.map(t=>new Date(t.date).toISOString().slice(0,10))).size}
function streak(){
 const days=new Set(state.transactions.map(t=>new Date(t.date).toISOString().slice(0,10))), d=new Date();let count=0;
 for(let i=0;i<365;i++){const k=d.toISOString().slice(0,10);if(days.has(k))count++;else if(i>0)break;d.setDate(d.getDate()-1)}return count
}
function gameStats(){
 const tx=state.transactions.length, days=activeDays(), st=streak(), totalIncome=state.transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
 const month=monthData(), xp=tx*8+days*12+st*20+(month.expense<=state.budget&&month.expense>0?120:0), level=Math.floor(xp/250)+1, current=xp%250;
 const ranks=['Tân binh','Người giữ ví','Kỷ luật thép','Finance Master','Bậc thầy dòng tiền','Huyền thoại tài chính'];
 return {xp,level,current,next:250,rank:ranks[Math.min(ranks.length-1,Math.floor((level-1)/2))],tx,days,st,totalIncome}
}
function renderQuickStats(){
 const [ta,tb]=dayBounds(), today=sumRange(ta,tb);
 const n=new Date(), wd=(n.getDay()+6)%7, wa=new Date(n);wa.setDate(n.getDate()-wd);wa.setHours(0,0,0,0);const wb=new Date(wa);wb.setDate(wb.getDate()+7), week=sumRange(wa,wb), month=monthData();
 const rows=[['today',today],['week',week],['month',month]];
 rows.forEach(([id,v])=>{const net=v.income-v.expense,el=$('#'+id+'Net');el.textContent=(net>=0?'+':'-')+money(Math.abs(net));el.className=net>=0?'positive':'negative';$('#'+id+'Breakdown').textContent=`+${compact(v.income)} · -${compact(v.expense)}`})
}
function compact(v){return new Intl.NumberFormat('vi-VN',{notation:'compact',maximumFractionDigits:1}).format(v)}
function renderAI(){
 const month=monthData(), prev=monthData(-1), n=new Date(), daysIn=new Date(n.getFullYear(),n.getMonth()+1,0).getDate(), day=n.getDate(), forecast=day?month.expense/day*daysIn:month.expense;
 const tx=state.transactions, avg=tx.length?tx.reduce((s,t)=>s+t.amount,0)/tx.length:0, latest=[...tx].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
 let face='🤖',mood='Đang học thói quen của mày',text='Thêm vài giao dịch để tao phân tích chính xác hơn.',tags=[];
 if(tx.length){
  if(month.expense>state.budget&&state.budget){face='🥲';mood='Ví đang khóc';text=`Mày đã vượt ngân sách ${money(month.expense-state.budget)}. Khoản chi lớn nhất tháng nên được xem lại.`}
  else if(forecast>state.budget&&state.budget){face='🤔';mood='Cảnh báo sớm';text=`Theo tốc độ hiện tại, cuối tháng mày có thể chi khoảng ${money(forecast)}, cao hơn ngân sách ${money(Math.max(0,forecast-state.budget))}.`}
  else if(month.income>month.expense){face=month.income>=10000000?'😎':'😊';mood='Dòng tiền ổn';text=`Tháng này đang dương ${money(month.income-month.expense)}. Nếu giữ nhịp này, cuối tháng vẫn nằm trong ngân sách.`}
  else{text=`Tháng này chi nhiều hơn thu ${money(month.expense-month.income)}. Tao sẽ theo dõi để cảnh báo khi có khoản bất thường.`}
  if(prev.expense>0)tags.push(`Chi ${month.expense<=prev.expense?'giảm':'tăng'} ${Math.abs(Math.round((month.expense-prev.expense)/prev.expense*100))}% so tháng trước`);
  if(latest&&latest.amount>avg*2&&tx.length>3)tags.push('Giao dịch mới cao bất thường');
  const top=topCategories()[0];if(top)tags.push(`${top.name} chiếm ${Math.round(top.amount/month.expense*100)||0}%`);
 }
 const dueFixed=fixedForCurrentMonth().filter(x=>x.status==='due').length,dueDebt=state.debts.filter(x=>x.type==='payable'&&x.amount>x.paid&&new Date(x.dueDate)-new Date()<4*86400000).length;if(dueFixed||dueDebt){face='⏰';mood='Có nghĩa vụ sắp đến hạn';text=`${dueFixed?dueFixed+' khoản cố định':''}${dueFixed&&dueDebt?' và ':''}${dueDebt?dueDebt+' khoản nợ':''} cần xử lý trong vài ngày tới. Tiền khả dụng hiện là ${money(availableMoney())}.`;tags.unshift('Chỉ trừ khoản đang phải thanh toán')} $('#aiFace').textContent=face;$('#aiMood').textContent=mood;$('#aiInsight').textContent=text;$('#aiTags').innerHTML=tags.slice(0,3).map(x=>`<span>${x}</span>`).join('')
}
function topCategories(){
 const map={};monthData();const n=new Date();state.transactions.filter(t=>t.type==='expense'&&new Date(t.date).getMonth()===n.getMonth()&&new Date(t.date).getFullYear()===n.getFullYear()).forEach(t=>map[t.category]=(map[t.category]||0)+t.amount);
 return Object.entries(map).map(([id,amount])=>({id,name:category(id).name,amount})).sort((a,b)=>b.amount-a.amount)
}
function renderBudgetExtras(monthExpense){
 const n=new Date(), days=n.getDate(), daysIn=new Date(n.getFullYear(),n.getMonth()+1,0).getDate(), remaining=Math.max(0,state.budget-monthExpense), avg=days?monthExpense/days:0, forecast=avg*daysIn;
 $('#budgetRemaining').textContent=money(remaining);$('#budgetDailyAvg').textContent=money(avg);$('#budgetForecast').textContent=money(forecast);
 const tops=topCategories().slice(0,3);$('#budgetCategoryBars').innerHTML=tops.map(x=>{const lim=state.categoryBudgets?.[x.id]||Math.max(x.amount,1),p=Math.min(100,x.amount/lim*100);return `<div class="budget-cat-line"><span>${x.name}</span><span class="budget-cat-track"><i class="budget-cat-fill" style="width:${p}%"></i></span><b>${Math.round(p)}%</b></div>`}).join('')
}
function renderHeatmap(){
 const box=$('#heatmap'), days=[];let max=1;
 for(let i=27;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const [a,b]=dayBounds(d),v=sumRange(a,b).expense;max=Math.max(max,v);days.push({d,v})}
 box.innerHTML=days.map(x=>{const ratio=x.v/max,l=x.v===0?0:ratio<.25?1:ratio<.5?2:ratio<.75?3:4,today=x.d.toDateString()===new Date().toDateString();return `<button class="heat-day l${l} ${today?'today':''}" data-heat-date="${x.d.toISOString()}">${x.d.getDate()}</button>`}).join('');
 $$('[data-heat-date]').forEach(b=>b.onclick=()=>{const d=new Date(b.dataset.heatDate),[a,z]=dayBounds(d),s=sumRange(a,z);$('#heatmapDetail').textContent=`${d.toLocaleDateString('vi-VN')}: thu ${money(s.income)} · chi ${money(s.expense)}`})
}
function renderGame(){
 const g=gameStats();$('#levelTitle').textContent=`Level ${g.level} · ${g.rank}`;$('#levelBadge').textContent=g.level;$('#xpText').textContent=`${g.current} / ${g.next} XP`;$('#streakText').textContent=`🔥 ${g.st} ngày`;$('#xpProgress').style.width=(g.current/g.next*100)+'%';
 $('#profileRank').textContent=g.rank;$('#profileTx').textContent=g.tx;$('#profileIncome').textContent=compact(g.totalIncome);$('#profileDays').textContent=g.days;
 const ach=[
  ['💰','1 triệu đầu tiên',g.totalIncome>=1000000,'Tổng thu đạt 1M'],
  ['🔥','Chuỗi 7 ngày',g.st>=7,'Nhập 7 ngày liên tiếp'],
  ['⚡','100 giao dịch',g.tx>=100,'Ghi đủ 100 lần'],
  ['💎','Đúng ngân sách',monthData().expense>0&&monthData().expense<=state.budget,'Không vượt tháng này'],
  ['👑','10 triệu doanh thu',g.totalIncome>=10000000,'Tổng thu đạt 10M'],
  ['🤖','Bạn thân Robot',g.days>=30,'Hoạt động 30 ngày']
 ];const unlocked=ach.filter(x=>x[2]).length;$('#achievementCount').textContent=`${unlocked}/${ach.length}`;$('#achievementGrid').innerHTML=ach.map(x=>`<div class="achievement ${x[2]?'unlocked':''}"><span class="emoji">${x[0]}</span><strong>${x[1]}</strong><small>${x[2]?'Đã mở khóa':x[3]}</small></div>`).join('')
}
function renderCategoryBudgetEditor(){
 const list=categories.filter(c=>c.type==='expense'||c.type==='both').slice(0,8);
 $('#categoryBudgetEditor').innerHTML=list.map(c=>`<label class="cat-budget-row"><span class="cat-mini-icon">${svg(c.id)}</span><strong>${c.name}</strong><input inputmode="numeric" data-cat-budget="${c.id}" value="${state.categoryBudgets?.[c.id]?new Intl.NumberFormat('vi-VN').format(state.categoryBudgets[c.id]):''}" placeholder="Không giới hạn"></label>`).join('');
 $$('[data-cat-budget]').forEach(i=>i.oninput=e=>{const n=num(e.target.value);e.target.value=n?new Intl.NumberFormat('vi-VN').format(n):''})
}


function monthKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function allAssets(){return state.wallets.reduce((s,w)=>s+actualWalletBalance(w),0)}
function fixedStatus(x,key=monthKey()){const e=x.statusMonths?.[key];if(e)return e;if((x.paidMonths||[]).includes(key))return 'paid_tx';if(x.trigger==='manual')return 'waiting';const n=new Date(),d=new Date(n.getFullYear(),n.getMonth(),Math.min(28,Math.max(1,x.dueDay||1)));return n>=d?'due':'waiting'}
function setFixedStatus(x,s,key=monthKey()){x.statusMonths=x.statusMonths||{};x.statusMonths[key]=s}
function fixedForCurrentMonth(){const k=monthKey(),n=new Date();return state.fixedCosts.map(x=>({...x,status:fixedStatus(x,k),paid:['paid_prior','paid_tx'].includes(fixedStatus(x,k)),dueDate:new Date(n.getFullYear(),n.getMonth(),Math.min(28,Math.max(1,x.dueDay||1)))}))}
function fixedRemainingThisMonth(){return fixedForCurrentMonth().filter(x=>x.status==='due').reduce((s,x)=>s+x.amount,0)}
function debtRemaining(type='payable'){return state.debts.filter(x=>x.type===type).reduce((s,x)=>s+Math.max(0,x.amount-x.paid),0)}
function availableMoney(){return allAssets()-fixedRemainingThisMonth()-debtRemaining('payable')}
function fixedStatusLabel(x){if(x.status==='paid_prior')return 'Đã trả trước khi dùng app';if(x.status==='paid_tx')return 'Đã thanh toán trong app';if(x.status==='due')return 'Đang phải thanh toán';return x.trigger==='manual'?'Chờ bên thu thông báo':'Chưa đến hạn'}
function dueLabel(date,paid=false){if(paid)return 'Đã thanh toán';const t=new Date();t.setHours(0,0,0,0);const d=new Date(date);d.setHours(0,0,0,0);const diff=Math.round((d-t)/86400000);if(diff<0)return `Quá hạn ${Math.abs(diff)} ngày`;if(diff===0)return 'Đến hạn hôm nay';if(diff===1)return 'Đến hạn ngày mai';return `Còn ${diff} ngày`}
function renderMoneyLayers(){const assets=allAssets(),fixed=fixedRemainingThisMonth(),debt=debtRemaining('payable');$('#assetSnapshot').textContent=money(assets);$('#fixedSnapshot').textContent='−'+money(fixed);$('#debtSnapshot').textContent='−'+money(debt);const av=availableMoney(),el=$('#availableMoney');el.textContent=money(av);el.classList.toggle('negative',av<0)}
function showFinancePanel(name){ui.financePanel=name;$$('#financeSwitch button').forEach(b=>b.classList.toggle('active',b.dataset.finance===name));$$('[data-finance-panel]').forEach(p=>p.classList.toggle('active',p.dataset.financePanel===name))}
function renderFixed(){const items=fixedForCurrentMonth(),total=items.reduce((s,x)=>s+x.amount,0),paid=items.filter(x=>x.paid).reduce((s,x)=>s+x.amount,0),due=items.filter(x=>x.status==='due').reduce((s,x)=>s+x.amount,0);$('#fixedMonthTotal').textContent=money(total);$('#fixedPaidText').textContent=`Đã trả ${money(paid)}`;$('#fixedRemainingText').textContent=`Cần giữ ${money(due)}`;$('#fixedProgress').style.width=(total?paid/total*100:0)+'%';const list=$('#fixedList');if(!items.length){list.innerHTML='<div class="empty-state"><span>📅</span><strong>Chưa có khoản cố định</strong></div>';return}list.innerHTML=items.sort((a,b)=>a.dueDay-b.dueDay).map(x=>{const paid=x.paid,due=x.status==='due',waiting=x.status==='waiting',icon=x.status==='paid_prior'?'🛡️':x.status==='paid_tx'?'✅':due?'🟡':'⚪';let actions=`<button data-edit-fixed="${x.id}">Chỉnh sửa</button>`;if(waiting)actions+=`<button data-mark-due="${x.id}">Đã được thông báo thu</button><button class="primary" data-mark-prior="${x.id}">Đã trả trước</button>`;if(due)actions+=`<button data-mark-prior="${x.id}">Chỉ đánh dấu đã trả</button><button class="primary" data-pay-fixed="${x.id}">Thanh toán ngay</button>`;if(paid)actions+=`<button data-unpay-fixed="${x.id}">Hoàn tác trạng thái</button>`;return `<article class="obligation-item ${paid?'paid':''} ${due?'overdue':''}"><div class="obligation-top"><div class="obligation-icon">${icon}</div><div class="obligation-copy"><strong>${x.name}</strong><span>Ngày ${x.dueDay} hàng tháng · ${wallet(x.walletId)?.name||'Chưa chọn ví'}</span></div><div class="obligation-amount"><strong>${money(x.amount)}</strong><small>${fixedStatusLabel(x)}</small></div></div><div class="obligation-actions">${actions}</div></article>`}).join('');$$('[data-edit-fixed]').forEach(b=>b.onclick=()=>openFixed(b.dataset.editFixed));$$('[data-pay-fixed]').forEach(b=>b.onclick=()=>payFixed(b.dataset.payFixed));$$('[data-mark-prior]').forEach(b=>b.onclick=()=>markFixedPaidPrior(b.dataset.markPrior));$$('[data-mark-due]').forEach(b=>b.onclick=()=>markFixedDue(b.dataset.markDue));$$('[data-unpay-fixed]').forEach(b=>b.onclick=()=>unpayFixed(b.dataset.unpayFixed))}
function openFixed(id=null){ui.editingFixedId=id;const x=id?state.fixedCosts.find(v=>v.id===id):null;ui.fixedCycle=x?.cycle||'monthly';ui.fixedWalletId=x?.walletId||state.wallets[0]?.id;$('#fixedSheetTitle').textContent=id?'Sửa khoản cố định':'Thêm khoản cố định';$('#fixedNameInput').value=x?.name||'';$('#fixedAmountInput').value=x?new Intl.NumberFormat('vi-VN').format(x.amount):'';$('#fixedDueDayInput').value=x?.dueDay||1;$('#fixedCategoryInput').value=category(x?.category||'bills').name;$$('#fixedCycleChips .chip').forEach(b=>b.classList.toggle('active',b.dataset.cycle===ui.fixedCycle));$('#deleteFixed').classList.toggle('hidden',!id);renderFinanceWalletPicks();openSheet('#fixedSheet')}
function saveFixed(){const name=$('#fixedNameInput').value.trim(),amount=num($('#fixedAmountInput').value);if(!name||!amount)return toast('Nhập tên và số tiền');const text=$('#fixedCategoryInput').value.toLowerCase(),cat=categories.find(c=>c.name.toLowerCase()===text)?.id||'bills',old=ui.editingFixedId?state.fixedCosts.find(x=>x.id===ui.editingFixedId):null,data={id:ui.editingFixedId||uid(),name,amount,cycle:ui.fixedCycle,dueDay:Math.min(28,Math.max(1,Number($('#fixedDueDayInput').value)||1)),category:cat,walletId:ui.fixedWalletId,trigger:old?.trigger||(/nhóm/i.test(name)?'manual':'date'),paidMonths:old?.paidMonths||[],statusMonths:old?.statusMonths||{}};if(ui.editingFixedId)state.fixedCosts[state.fixedCosts.findIndex(x=>x.id===ui.editingFixedId)]=data;else state.fixedCosts.push(data);save();closeSheets();render();toast('Đã lưu khoản cố định')}
function markFixedDue(id){const x=state.fixedCosts.find(v=>v.id===id);if(!x)return;setFixedStatus(x,'due');save();render();toast('Đã chuyển sang khoản cần thanh toán')}
function markFixedPaidPrior(id){const x=state.fixedCosts.find(v=>v.id===id);if(!x)return;setFixedStatus(x,'paid_prior');save();render();toast('Chỉ đánh dấu đã trả — ví không bị trừ')}
function payFixed(id){const x=state.fixedCosts.find(v=>v.id===id),key=monthKey();if(!x||fixedStatus(x,key)==='paid_tx')return;setFixedStatus(x,'paid_tx',key);x.paidMonths=x.paidMonths||[];if(!x.paidMonths.includes(key))x.paidMonths.push(key);state.transactions.push({id:uid(),type:'expense',amount:x.amount,note:x.name,category:x.category||'bills',walletId:x.walletId,toWalletId:null,date:new Date().toISOString(),source:'fixed',sourceId:x.id,sourceMonth:key});save();render();toast('Đã thanh toán và trừ đúng một lần')}
function unpayFixed(id){const x=state.fixedCosts.find(v=>v.id===id),key=monthKey();if(!x)return;const old=fixedStatus(x,key);delete x.statusMonths?.[key];x.paidMonths=(x.paidMonths||[]).filter(k=>k!==key);if(old==='paid_tx')state.transactions=state.transactions.filter(t=>!(t.source==='fixed'&&t.sourceId===id&&t.sourceMonth===key));save();render();toast(old==='paid_tx'?'Đã hoàn tác giao dịch thanh toán':'Đã hoàn tác trạng thái')}
function renderDebts(){
 const assets=allAssets(),pay=debtRemaining('payable'),rec=debtRemaining('receivable');
 $('#debtAsset').textContent=money(assets);$('#totalDebt').textContent=money(pay);$('#netWorth').textContent=money(assets-pay);$('#payableTotal').textContent=money(pay);$('#receivableTotal').textContent=money(rec);
 const now=new Date();$('#payableDue').textContent=`${state.debts.filter(x=>x.type==='payable'&&x.amount>x.paid&&new Date(x.dueDate)-now<7*86400000).length} khoản sắp hạn`;$('#receivableDue').textContent=`${state.debts.filter(x=>x.type==='receivable'&&x.amount>x.paid).length} khoản cần thu`;
 const list=$('#debtList');if(!state.debts.length){list.innerHTML='<div class="empty-state"><span>💳</span><strong>Chưa có khoản nợ</strong><small>Quản lý tiền phải trả và tiền người khác còn nợ mày.</small></div>';return}
 list.innerHTML=[...state.debts].sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)).map(x=>{const remain=Math.max(0,x.amount-x.paid),pct=x.amount?Math.min(100,x.paid/x.amount*100):0,done=remain===0;
  return `<article class="obligation-item ${done?'paid':''} ${!done&&new Date(x.dueDate)<new Date(new Date().setHours(0,0,0,0))?'overdue':''}">
   <div class="obligation-top"><div class="obligation-icon">${x.type==='payable'?'💸':'💰'}</div><div class="obligation-copy"><strong>${x.name}</strong><span>${x.type==='payable'?'Mình phải trả':'Người khác nợ'} · ${dueLabel(x.dueDate,done)}</span></div><div class="obligation-amount"><strong>${money(remain)}</strong><small>Còn lại</small></div></div>
   <div class="debt-progress ${x.type==='receivable'?'receivable':''}"><i style="width:${pct}%"></i></div>
   <div class="obligation-actions"><button data-edit-debt="${x.id}">Chi tiết</button>${done?'':`<button class="primary" data-pay-debt="${x.id}">${x.type==='payable'?'Trả một phần':'Đã thu một phần'}</button>`}</div>
  </article>`}).join('');
 $$('[data-edit-debt]').forEach(b=>b.onclick=()=>openDebt(b.dataset.editDebt));$$('[data-pay-debt]').forEach(b=>b.onclick=()=>quickDebtPayment(b.dataset.payDebt))
}
function openDebt(id=null){
 ui.editingDebtId=id;const x=id?state.debts.find(v=>v.id===id):null;ui.debtType=x?.type||'payable';ui.debtWalletId=x?.walletId||state.wallets[0]?.id;
 $('#debtSheetTitle').textContent=id?'Sửa khoản nợ':'Thêm khoản nợ';$('#debtNameInput').value=x?.name||'';$('#debtAmountInput').value=x?new Intl.NumberFormat('vi-VN').format(x.amount):'';$('#debtPaidInput').value=x?new Intl.NumberFormat('vi-VN').format(x.paid):'';$('#debtDueInput').value=x?.dueDate||new Date().toISOString().slice(0,10);
 $$('#debtTypeSwitch button').forEach(b=>b.classList.toggle('active',b.dataset.debtType===ui.debtType));$('#deleteDebt').classList.toggle('hidden',!id);renderFinanceWalletPicks();openSheet('#debtSheet')
}
function saveDebt(){
 const name=$('#debtNameInput').value.trim(),amount=num($('#debtAmountInput').value),paid=Math.min(amount,num($('#debtPaidInput').value));if(!name||!amount)return toast('Nhập tên và tổng số tiền');
 const data={id:ui.editingDebtId||uid(),name,type:ui.debtType,amount,paid,dueDate:$('#debtDueInput').value,walletId:ui.debtWalletId};
 if(ui.editingDebtId)state.debts[state.debts.findIndex(x=>x.id===ui.editingDebtId)]=data;else state.debts.push(data);save();closeSheets();render();toast('Đã lưu khoản nợ')
}
function quickDebtPayment(id){
 const x=state.debts.find(v=>v.id===id),remain=Math.max(0,x.amount-x.paid);if(!x||!remain)return;
 const raw=prompt(`${x.type==='payable'?'Số tiền đã trả':'Số tiền đã thu'} (còn ${money(remain)}):`,String(remain));if(raw===null)return;const amount=Math.min(remain,num(raw));if(!amount)return toast('Số tiền không hợp lệ');
 x.paid+=amount;state.transactions.push({id:uid(),type:x.type==='payable'?'expense':'income',amount,note:x.name,category:x.type==='payable'?'bills':'other',walletId:x.walletId,toWalletId:null,date:new Date().toISOString(),source:'debt',sourceId:x.id});save();render();toast(x.type==='payable'?'Đã ghi nhận trả nợ':'Đã ghi nhận thu nợ')
}
function renderFinanceWalletPicks(){
 const make=(id,selected,key)=>{$(id).innerHTML=state.wallets.map(w=>`<button class="wallet-pick ${selected===w.id?'active':''}" data-fin-wallet="${key}" data-id="${w.id}">${svg(w.icon)}<span>${w.name}</span></button>`).join('')};
 make('#fixedWalletPicks',ui.fixedWalletId,'fixed');make('#debtWalletPicks',ui.debtWalletId,'debt');
 $$('[data-fin-wallet]').forEach(b=>b.onclick=()=>{if(b.dataset.finWallet==='fixed')ui.fixedWalletId=b.dataset.id;else ui.debtWalletId=b.dataset.id;renderFinanceWalletPicks()})
}

function openSetup(){ui.setupWalletId=ui.setupWalletId||state.wallets.find(w=>/mb/i.test(w.name))?.id||state.wallets[0]?.id;ui.setupPaidIds=new Set(fixedForCurrentMonth().filter(x=>x.paid).map(x=>x.id));$('#setupBalanceInput').value=new Intl.NumberFormat('vi-VN').format(Math.max(0,allAssets()));renderSetup();const b=$('#onboarding');b.classList.add('show');b.setAttribute('aria-hidden','false');document.body.classList.add('setup-open')}
function closeSetup(){const b=$('#onboarding');b.classList.remove('show');b.setAttribute('aria-hidden','true');document.body.classList.remove('setup-open')}
function renderSetup(){$('#setupWalletPicks').innerHTML=state.wallets.map(w=>`<button class="wallet-pick ${ui.setupWalletId===w.id?'active':''}" data-setup-wallet="${w.id}"><strong>${escapeHtml(w.name)}</strong><small>${money(actualWalletBalance(w))}</small></button>`).join('');$('#setupFixedList').innerHTML=state.fixedCosts.map(x=>`<button class="setup-fixed-row ${ui.setupPaidIds.has(x.id)?'active':''}" data-setup-fixed="${x.id}"><span>${ui.setupPaidIds.has(x.id)?'✓':'○'}</span><div><strong>${escapeHtml(x.name)}</strong><small>${money(x.amount)} · đã trả trước khi dùng app</small></div></button>`).join('');$$('[data-setup-wallet]').forEach(b=>b.onclick=()=>{ui.setupWalletId=b.dataset.setupWallet;renderSetup()});$$('[data-setup-fixed]').forEach(b=>b.onclick=()=>{const id=b.dataset.setupFixed;ui.setupPaidIds.has(id)?ui.setupPaidIds.delete(id):ui.setupPaidIds.add(id);renderSetup()})}
function finishSetup(){const target=num($('#setupBalanceInput').value);if(!ui.setupWalletId)return toast('Chọn ví đang giữ tiền');const chosen=wallet(ui.setupWalletId);if(!chosen)return;chosen.balance+=target-allAssets();const key=monthKey();state.fixedCosts.forEach(x=>{x.statusMonths=x.statusMonths||{};x.statusMonths[key]=ui.setupPaidIds.has(x.id)?'paid_prior':'waiting'});state.setup={completed:true,completedAt:new Date().toISOString()};save();closeSetup();render();toast('Đã bắt đầu từ số dư hiện tại, không trừ lại khoản cũ')}

function render(){renderMoneyLayers();renderFixed();renderDebts();showFinancePanel(ui.financePanel);
 const t=totals(), allBalance=state.wallets.reduce((s,w)=>s+actualWalletBalance(w),0);
 $('#totalBalance').textContent=state.settings.hideBalance?'••••••':money(allBalance);
 $('#incomeTotal').textContent=state.settings.hideBalance?'••••':money(t.income);
 $('#expenseTotal').textContent=state.settings.hideBalance?'••••':money(t.expense);
 const monthExpense=(()=>{const n=new Date();return state.transactions.filter(x=>x.type==='expense'&&new Date(x.date).getMonth()===n.getMonth()&&new Date(x.date).getFullYear()===n.getFullYear()).reduce((s,x)=>s+x.amount,0)})();renderQuickStats();renderAI();renderBudgetExtras(monthExpense);renderHeatmap();renderGame();
 const pct=state.budget?Math.round(monthExpense/state.budget*100):0;
 $('#budgetSpent').textContent=money(monthExpense);$('#budgetLimit').textContent=money(state.budget);$('#budgetPercent').textContent=pct+'%';$('#budgetProgress').style.width=Math.min(pct,100)+'%';
 $('#budgetProgress').style.background=pct>100?'linear-gradient(90deg,#ff718c,#ff9a6b)':'linear-gradient(90deg,#7767ff,#9c85ff)';
 renderTransactions();renderWallets();renderChart();renderPicks();
}
function renderTransactions(){
 const recent=[...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
 $('#recentTransactions').innerHTML=recent.length?recent.map(txRow).join(''):empty('Chưa có giao dịch');
 const q=$('#transactionSearch')?.value?.trim().toLowerCase()||'';
 let list=[...state.transactions].sort((a,b)=>new Date(b.date)-new Date(a.date));
 list=list.filter(t=>(ui.typeFilter==='all'||t.type===ui.typeFilter)&&(!ui.walletFilter||t.walletId===ui.walletFilter||t.toWalletId===ui.walletFilter)&&(!ui.categoryFilter||t.category===ui.categoryFilter));
 if(q)list=list.filter(t=>`${t.note} ${category(t.category).name} ${wallet(t.walletId)?.name||''}`.toLowerCase().includes(q));
 $('#allTransactions').innerHTML=list.length?list.map(txRow).join(''):empty('Không tìm thấy giao dịch');
 bindTransactionGestures();
}
function txRow(t){
 const c=t.type==='transfer'?{id:'ewallet',name:'Chuyển ví'}:category(t.category), d=new Date(t.date), sign=t.type==='income'?'+':t.type==='expense'?'-':'';
 const sub=t.type==='transfer'?`${wallet(t.walletId)?.name||'Ví'} → ${wallet(t.toWalletId)?.name||'Ví'}`:`${c.name} · ${wallet(t.walletId)?.name||'Không rõ ví'}`;
 return `<article class="transaction-row" data-id="${t.id}">
 <span class="category-icon">${svg(c.id)}</span><span class="transaction-main"><strong>${escapeHtml(t.note||c.name)}</strong><small>${sub} · ${d.toLocaleDateString('vi-VN')}</small></span>
 <span class="transaction-amount ${t.type}">${sign}${money(t.amount)}</span></article>`
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function empty(msg){return `<div class="empty-state">${svg('bills')}<div>${msg}</div></div>`}
function renderWallets(){
 const total=state.wallets.reduce((s,w)=>s+actualWalletBalance(w),0);$('#walletTotal').textContent=money(total);$('#walletCount').textContent=`${state.wallets.length} ví đang hoạt động`;
 $('#walletList').innerHTML=state.wallets.map(w=>`<button class="wallet-card" data-wallet-edit="${w.id}"><span class="wallet-symbol">${svg(w.icon)}</span><span><strong>${escapeHtml(w.name)}</strong><small>Chạm để chỉnh sửa</small></span><span class="wallet-balance">${money(actualWalletBalance(w))}</span></button>`).join('');
 $$('[data-wallet-edit]').forEach(b=>b.onclick=()=>openWallet(b.dataset.walletEdit));
}
function renderPicks(){
 const wp=state.wallets.map(w=>`<button class="wallet-pick ${ui.selectedWallet===w.id?'active':''}" data-wallet="${w.id}"><strong>${escapeHtml(w.name)}</strong><small>${money(actualWalletBalance(w))}</small></button>`).join('');
 $('#walletPicks').innerHTML=wp;$('#toWalletPicks').innerHTML=state.wallets.map(w=>`<button class="wallet-pick ${ui.selectedToWallet===w.id?'active':''}" data-to-wallet="${w.id}"><strong>${escapeHtml(w.name)}</strong><small>${money(actualWalletBalance(w))}</small></button>`).join('');
 $('#filterWalletPicks').innerHTML=`<button class="wallet-pick ${!ui.walletFilter?'active':''}" data-filter-wallet="">Tất cả ví</button>`+state.wallets.map(w=>`<button class="wallet-pick ${ui.walletFilter===w.id?'active':''}" data-filter-wallet="${w.id}"><strong>${escapeHtml(w.name)}</strong></button>`).join('');
 $$('[data-wallet]').forEach(b=>b.onclick=()=>{ui.selectedWallet=b.dataset.wallet;renderPicks()});$$('[data-to-wallet]').forEach(b=>b.onclick=()=>{ui.selectedToWallet=b.dataset.toWallet;renderPicks()});$$('[data-filter-wallet]').forEach(b=>b.onclick=()=>{ui.walletFilter=b.dataset.filterWallet||null;renderPicks();renderTransactions()});
 const cats=categories.filter(c=>c.type===ui.selectedType||c.type==='both').map(c=>`<button class="icon-choice ${ui.selectedCategory===c.id?'active':''}" data-category="${c.id}">${svg(c.id)}<span>${c.name}</span></button>`).join('');
 $('#categoryGrid').innerHTML=cats;$$('[data-category]').forEach(b=>b.onclick=()=>{ui.selectedCategory=b.dataset.category;renderPicks()});
 $('#filterCategoryGrid').innerHTML=`<button class="icon-choice ${!ui.categoryFilter?'active':''}" data-filter-category="">${svg('other')}<span>Tất cả</span></button>`+categories.map(c=>`<button class="icon-choice ${ui.categoryFilter===c.id?'active':''}" data-filter-category="${c.id}">${svg(c.id)}<span>${c.name}</span></button>`).join('');
 $$('[data-filter-category]').forEach(b=>b.onclick=()=>{ui.categoryFilter=b.dataset.filterCategory||null;renderPicks();renderTransactions()})
}
function renderChart(){
 const tx=filteredPeriod(), points=ui.period==='week'?7:ui.period==='month'?6:12, buckets=Array.from({length:points},()=>({i:0,e:0})), [start,end]=getRange(), span=end-start;
 tx.forEach(t=>{let idx=Math.min(points-1,Math.floor((new Date(t.date)-start)/span*points));if(idx>=0)buckets[idx][t.type==='income'?'i':'e']+=t.amount});
 const max=Math.max(1,...buckets.flatMap(x=>[x.i,x.e])), W=360,H=150,pad=8;
 const path=k=>buckets.map((b,i)=>`${i?'L':'M'} ${pad+i*(W-2*pad)/(points-1)} ${H-(b[k]/max)*(H-25)}`).join(' ');
 const area=k=>path(k)+` L ${W-pad} ${H} L ${pad} ${H} Z`;
 $('#cashflowChart').innerHTML=`<defs><linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#35e6ad" stop-opacity=".24"/><stop offset="1" stop-color="#35e6ad" stop-opacity="0"/></linearGradient><linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff718c" stop-opacity=".18"/><stop offset="1" stop-color="#ff718c" stop-opacity="0"/></linearGradient></defs>
 ${[35,75,115,150].map(y=>`<line class="chart-grid" x1="8" x2="352" y1="${y}" y2="${y}"/>`).join('')}
 <path class="chart-area-income" d="${area('i')}"/><path class="chart-area-expense" d="${area('e')}"/><path class="chart-income" d="${path('i')}"/><path class="chart-expense" d="${path('e')}"/>`;
 $('#chartSubtitle').textContent=ui.period==='week'?'Tuần này':ui.period==='month'?'Tháng này':'Năm nay'
}
function showPage(name){ui.page=name;$$('.page').forEach(p=>p.classList.toggle('active',p.dataset.page===name));$$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===name));$('#fab').style.display=name==='settings'?'none':'grid';scrollTo({top:0,behavior:'smooth'});render()}
function openSheet(id){$('#scrim').classList.add('show');$(id).classList.add('open');$(id).setAttribute('aria-hidden','false');haptic()}
function closeSheets(){$$('.sheet').forEach(s=>{s.classList.remove('open');s.setAttribute('aria-hidden','true')});$('#scrim').classList.remove('show')}
function openTransaction(id=null){
 ui.editingId=id;const t=id?state.transactions.find(x=>x.id===id):null;ui.selectedType=t?.type||'expense';ui.selectedCategory=t?.category||'food';ui.selectedWallet=t?.walletId||state.wallets[0]?.id||null;ui.selectedToWallet=t?.toWalletId||state.wallets[1]?.id||state.wallets[0]?.id||null;
 $('#transactionSheetTitle').textContent=id?'Sửa giao dịch':'Thêm giao dịch';$('#amountInput').value=t?new Intl.NumberFormat('vi-VN').format(t.amount):'';$('#noteInput').value=t?.note||'';
 const d=t?new Date(t.date):new Date();$('#dateInput').value=d.toISOString().slice(0,10);$('#timeInput').value=d.toTimeString().slice(0,5);setType(ui.selectedType);openSheet('#transactionSheet')
}
function setType(type){ui.selectedType=type;$$('#transactionType button').forEach(b=>b.classList.toggle('active',b.dataset.type===type));$('#categoryBlock').classList.toggle('hidden',type==='transfer');$('#toWalletBlock').classList.toggle('hidden',type!=='transfer');$('#walletLabel').textContent=type==='transfer'?'Chuyển từ ví':'Ví thanh toán';if(!categories.some(c=>(c.type===type||c.type==='both')&&c.id===ui.selectedCategory))ui.selectedCategory=type==='income'?'salary':'food';renderPicks()}
function saveTransaction(){
 const amount=num($('#amountInput').value);if(!amount)return toast('Nhập số tiền trước');if(!ui.selectedWallet)return toast('Hãy tạo hoặc chọn một ví');if(ui.selectedType==='transfer'&&ui.selectedWallet===ui.selectedToWallet)return toast('Hai ví phải khác nhau');
 const date=new Date(`${$('#dateInput').value}T${$('#timeInput').value||'00:00'}`).toISOString(), data={id:ui.editingId||uid(),type:ui.selectedType,amount,note:$('#noteInput').value.trim(),category:ui.selectedType==='transfer'?'ewallet':ui.selectedCategory,walletId:ui.selectedWallet,toWalletId:ui.selectedType==='transfer'?ui.selectedToWallet:null,date};
 if(ui.editingId){const i=state.transactions.findIndex(x=>x.id===ui.editingId);state.transactions[i]=data}else state.transactions.push(data);save();closeSheets();render();toast(ui.editingId?'Đã cập nhật':'Đã thêm giao dịch')
}
function openWallet(id=null){ui.editingWalletId=id;const w=id?wallet(id):null;$('#walletSheetTitle').textContent=id?'Sửa ví':'Thêm ví';$('#walletNameInput').value=w?.name||'';$('#walletBalanceInput').value=w?new Intl.NumberFormat('vi-VN').format(w.balance):'';ui.selectedWalletIcon=w?.icon||'bank';renderWalletIcons();openSheet('#walletSheet')}
function renderWalletIcons(){$('#walletIconGrid').innerHTML=walletIcons.map(i=>`<button class="icon-choice ${ui.selectedWalletIcon===i?'active':''}" data-wallet-icon="${i}">${svg(i)}</button>`).join('');$$('[data-wallet-icon]').forEach(b=>b.onclick=()=>{ui.selectedWalletIcon=b.dataset.walletIcon;renderWalletIcons()})}
function saveWallet(){const name=$('#walletNameInput').value.trim();if(!name)return toast('Nhập tên ví');const data={id:ui.editingWalletId||uid(),name,balance:num($('#walletBalanceInput').value),icon:ui.selectedWalletIcon};if(ui.editingWalletId)state.wallets[state.wallets.findIndex(w=>w.id===ui.editingWalletId)]=data;else state.wallets.push(data);save();closeSheets();render();toast('Đã lưu ví')}
function bindTransactionGestures(){
 $$('.transaction-row').forEach(row=>{let timer,x0=0,moved=false;row.onpointerdown=e=>{x0=e.clientX;moved=false;timer=setTimeout(()=>{if(!moved)openContext(row.dataset.id,e.clientX,e.clientY)},480)};row.onpointermove=e=>{if(Math.abs(e.clientX-x0)>10){moved=true;clearTimeout(timer)}if(e.clientX-x0<-55)row.style.transform='translateX(-8px)'};row.onpointerup=e=>{clearTimeout(timer);row.style.transform='';if(!moved&&e.pointerType==='mouse')openContext(row.dataset.id,e.clientX,e.clientY)};row.onpointercancel=()=>clearTimeout(timer)})
}
function openContext(id,x,y){ui.contextId=id;const m=$('#contextMenu');m.style.left=Math.min(x,innerWidth-180)+'px';m.style.top=Math.min(y,innerHeight-170)+'px';m.classList.add('show');haptic(20)}
function closeContext(){$('#contextMenu').classList.remove('show')}
function exportData(){const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`dudeyue-thu-chi-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);toast('Đã xuất bản sao')}
async function importData(file){try{state=normalize(JSON.parse(await file.text()));save();render();toast('Khôi phục thành công')}catch{toast('File JSON không hợp lệ')}}
function init(){
 const h=new Date().getHours();$('#greeting').textContent=h<11?'Chào buổi sáng':h<18?'Chào buổi chiều':'Chào buổi tối';
 $$('.tab').forEach(b=>b.onclick=()=>showPage(b.dataset.tab));$$('[data-go]').forEach(b=>b.onclick=()=>showPage(b.dataset.go));$$('#periodSwitch button').forEach(b=>b.onclick=()=>{ui.period=b.dataset.period;$$('#periodSwitch button').forEach(x=>x.classList.toggle('active',x===b));render()});
 $('#toggleBalance').onclick=()=>{state.settings.hideBalance=!state.settings.hideBalance;save();render()};$('#openBudget').onclick=()=>{$('#budgetInput').value=new Intl.NumberFormat('vi-VN').format(state.budget);renderCategoryBudgetEditor();$$('#budgetAlertChips .chip').forEach(b=>b.classList.toggle('active',(state.budgetAlerts||[]).includes(Number(b.dataset.alert))));openSheet('#budgetSheet')};$('#saveBudget').onclick=()=>{state.budget=num($('#budgetInput').value);state.categoryBudgets={};$$('[data-cat-budget]').forEach(i=>{const v=num(i.value);if(v)state.categoryBudgets[i.dataset.catBudget]=v});state.budgetAlerts=$$('#budgetAlertChips .chip.active').map(b=>Number(b.dataset.alert));save();closeSheets();render();toast('Đã cập nhật ngân sách')};$$('#budgetAlertChips .chip').forEach(b=>b.onclick=()=>b.classList.toggle('active'));
  $('#financeAddBtn').onclick=()=>{if(ui.financePanel==='wallets')openWallet();else if(ui.financePanel==='fixed')openFixed();else openDebt()};$$('#financeSwitch button').forEach(b=>b.onclick=()=>showFinancePanel(b.dataset.finance));
 $('#saveFixed').onclick=saveFixed;$('#finishSetup').onclick=finishSetup;$('#reopenSetup').onclick=openSetup;$('#saveDebt').onclick=saveDebt;$$('#fixedCycleChips .chip').forEach(b=>b.onclick=()=>{ui.fixedCycle=b.dataset.cycle;$$('#fixedCycleChips .chip').forEach(x=>x.classList.toggle('active',x===b))});$$('#debtTypeSwitch button').forEach(b=>b.onclick=()=>{ui.debtType=b.dataset.debtType;$$('#debtTypeSwitch button').forEach(x=>x.classList.toggle('active',x===b))});
 $('#deleteFixed').onclick=()=>{if(ui.editingFixedId&&confirm('Xóa khoản cố định này?')){state.fixedCosts=state.fixedCosts.filter(x=>x.id!==ui.editingFixedId);save();closeSheets();render();toast('Đã xóa')}};$('#deleteDebt').onclick=()=>{if(ui.editingDebtId&&confirm('Xóa khoản nợ này?')){state.debts=state.debts.filter(x=>x.id!==ui.editingDebtId);save();closeSheets();render();toast('Đã xóa')}};

 $('#fab').onclick=()=>openTransaction();$('#saveTransaction').onclick=saveTransaction;$$('#transactionType button').forEach(b=>b.onclick=()=>setType(b.dataset.type));$('#saveWallet').onclick=saveWallet;
 $('#openFilter').onclick=()=>openSheet('#filterSheet');$('#clearFilters').onclick=()=>{ui.walletFilter=ui.categoryFilter=null;renderPicks();renderTransactions();toast('Đã xóa bộ lọc')};$('#openSearch').onclick=()=>{showPage('transactions');setTimeout(()=>$('#transactionSearch').focus(),350)};
 $$('.sheet-close,[data-close]').forEach(b=>b.onclick=closeSheets);$('#scrim').onclick=()=>{closeSheets();closeContext()};$('#transactionSearch').oninput=renderTransactions;
 $$('#transactionTypeChips .chip').forEach(b=>b.onclick=()=>{ui.typeFilter=b.dataset.filter;$$('#transactionTypeChips .chip').forEach(x=>x.classList.toggle('active',x===b));renderTransactions()});
 $('#exportData').onclick=exportData;$('#importData').onclick=()=>$('#importFile').click();$('#importFile').onchange=e=>e.target.files[0]&&importData(e.target.files[0]);
 $('#resetData').onclick=()=>{if(confirm('Xóa toàn bộ dữ liệu?')){state=seed();save();render();openSetup();toast('Đã xóa dữ liệu')}};
 $('#contextMenu').onclick=e=>{const btn=e.target.closest('button');if(!btn)return;const id=ui.contextId;if(btn.dataset.action==='edit')openTransaction(id);if(btn.dataset.action==='duplicate'){const t=state.transactions.find(x=>x.id===id);state.transactions.push({...t,id:uid(),date:new Date().toISOString()});save();render();toast('Đã nhân bản')}if(btn.dataset.action==='delete'&&confirm('Xóa giao dịch này?')){state.transactions=state.transactions.filter(x=>x.id!==id);save();render();toast('Đã xóa')}closeContext()};
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('#contextMenu')&&!e.target.closest('.transaction-row'))closeContext()});
 ['amountInput','budgetInput','walletBalanceInput','fixedAmountInput','debtAmountInput','debtPaidInput','setupBalanceInput'].forEach(id=>$('#'+id).addEventListener('input',e=>{const n=num(e.target.value);e.target.value=n?new Intl.NumberFormat('vi-VN').format(n):''}));
 $$('.sheet').forEach(sheet=>{let y=0;sheet.addEventListener('touchstart',e=>{if(e.target.closest('.sheet-handle,.sheet-header'))y=e.touches[0].clientY},{passive:true});sheet.addEventListener('touchend',e=>{if(y&&e.changedTouches[0].clientY-y>90)closeSheets();y=0},{passive:true})});
 if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
 render();
 if(!state.setup?.completed)setTimeout(openSetup,120);
}
init();