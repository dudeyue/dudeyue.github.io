const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const money=n=>new Intl.NumberFormat('vi-VN').format(Math.round(Number(n)||0))+' đ';
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);

const categories={
 income:[['Lương','💼'],['Thưởng','🎁'],['Làm tự do','💻'],['Cho thuê','🏢'],['Khác','➕']],
 expense:[['Ăn uống','🍴'],['Di chuyển','🚗'],['Nhà ở','🏠'],['Hóa đơn','📄'],['Mua sắm','🛍️'],['Giải trí','🎮'],['Sức khỏe','🩺'],['Giáo dục','📚'],['Khác','•••']],
 transfer:[['Chuyển khoản','↔️']]
};

const defaults={
 wallets:[
  {id:'cash',name:'Tiền mặt',kind:'Tiền mặt',balance:0},
  {id:'mb',name:'MB Bank',kind:'Ngân hàng',balance:82000},
  {id:'vcb',name:'Vietcombank',kind:'Ngân hàng',balance:0}
 ],
 transactions:[],
 budgets:[{id:'b1',category:'Di chuyển',limit:1500000}],
 settings:{theme:'dark',hideBalance:false}
};

let state=load();
let period='month', transactionFilter='all', chartMode='cashflow';

function load(){
 try{
  const saved=JSON.parse(localStorage.getItem('aiFinanceData'));
  return saved?{...structuredClone(defaults),...saved}:structuredClone(defaults);
 }catch{return structuredClone(defaults)}
}
function save(){localStorage.setItem('aiFinanceData',JSON.stringify(state));render()}
function walletBalance(id){
 const w=state.wallets.find(x=>x.id===id); if(!w)return 0;
 let bal=Number(w.balance)||0;
 state.transactions.forEach(t=>{
  if(t.type==='income'&&t.wallet===id)bal+=t.amount;
  if(t.type==='expense'&&t.wallet===id)bal-=t.amount;
  if(t.type==='transfer'){
    if(t.wallet===id)bal-=t.amount;
    if(t.toWallet===id)bal+=t.amount;
  }
 }); return bal;
}
function rangeStart(){
 const d=new Date();
 if(period==='week'){const day=d.getDay()||7;d.setDate(d.getDate()-day+1)}
 if(period==='month')d.setDate(1);
 if(period==='year'){d.setMonth(0);d.setDate(1)}
 d.setHours(0,0,0,0);return d;
}
function inPeriod(t){return new Date(t.date+'T00:00:00')>=rangeStart()}
function totals(){
 const ts=state.transactions.filter(inPeriod);
 return {
  income:ts.filter(t=>t.type==='income').reduce((a,b)=>a+b.amount,0),
  expense:ts.filter(t=>t.type==='expense').reduce((a,b)=>a+b.amount,0)
 }
}
function totalAssets(){return state.wallets.reduce((a,w)=>a+walletBalance(w.id),0)}
function iconFor(cat){for(const arr of Object.values(categories)){const x=arr.find(c=>c[0]===cat);if(x)return x[1]}return '•'}
function titleFor(page){return {home:'Tổng quan',transactions:'Giao dịch',wallets:'Ví & Tài khoản',budgets:'Ngân sách',settings:'Cài đặt'}[page]}
function nav(page){
 $$('.page').forEach(p=>p.classList.toggle('active',p.dataset.page===page));
 $$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===page));
 $('#pageTitle').textContent=titleFor(page); window.scrollTo({top:0,behavior:'smooth'});
}
function render(){
 document.body.classList.toggle('light',state.settings.theme==='light');
 $('#themeLabel').textContent=state.settings.theme==='light'?'Sáng':'Tối';
 const t=totals(), hidden=state.settings.hideBalance;
 $('#totalBalance').textContent=hidden?'••••••':money(totalAssets());
 $('#periodIncome').textContent=money(t.income); $('#periodExpense').textContent=money(t.expense);
 $('#walletTotal').textContent=money(totalAssets()); $('#walletCount').textContent=state.wallets.length+' tài khoản';
 renderTransactions(); renderWallets(); renderBudgets(); renderChart(); updateAI();
}
function txHtml(t){
 const cls=t.type, sign=t.type==='income'?'+':t.type==='expense'?'-':'';
 const wallet=state.wallets.find(w=>w.id===t.wallet)?.name||'Không rõ';
 return `<div class="transaction-item" data-id="${t.id}">
  <div class="tx-icon">${iconFor(t.category)}</div>
  <div class="tx-main"><b>${t.category}</b><span>${t.note||wallet} • ${new Date(t.date).toLocaleDateString('vi-VN')}</span></div>
  <div class="tx-amount ${cls}">${sign}${money(t.amount)}<small>${t.type==='transfer'?'Chuyển khoản':''}</small></div>
 </div>`
}
function renderTransactions(){
 let list=[...state.transactions].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt);
 const recent=list.slice(0,5);
 $('#recentTransactions').innerHTML=recent.length?recent.map(txHtml).join(''):`<div class="empty"><b>Chưa có giao dịch</b>Nhấn dấu + để thêm giao dịch đầu tiên.</div>`;
 const q=$('#transactionSearch').value.trim().toLowerCase();
 list=list.filter(t=>(transactionFilter==='all'||t.type===transactionFilter)&&(!q||`${t.category} ${t.note||''}`.toLowerCase().includes(q)));
 $('#allTransactions').innerHTML=list.length?list.map(txHtml).join(''):`<div class="empty"><b>Không có giao dịch</b>Hãy thử bộ lọc khác.</div>`;
}
function renderWallets(){
 const q=$('#walletSearch').value.trim().toLowerCase();
 const list=state.wallets.filter(w=>w.name.toLowerCase().includes(q));
 $('#walletList').innerHTML=list.map(w=>`<div class="wallet-card">
  <div class="wallet-icon">${w.kind==='Ngân hàng'?'🏦':w.kind==='Ví điện tử'?'📱':'💵'}</div>
  <div><b>${w.name}</b><span>${w.kind}</span></div><strong>${money(walletBalance(w.id))}</strong>
 </div>`).join('');
}
function monthExpenseFor(cat){
 const d=new Date(), m=d.getMonth(), y=d.getFullYear();
 return state.transactions.filter(t=>t.type==='expense'&&t.category===cat&&new Date(t.date).getMonth()===m&&new Date(t.date).getFullYear()===y).reduce((a,b)=>a+b.amount,0)
}
function renderBudgets(){
 const total=state.budgets.reduce((a,b)=>a+b.limit,0), spent=state.budgets.reduce((a,b)=>a+monthExpenseFor(b.category),0);
 const pct=total?Math.round(spent/total*100):0, score=Math.max(0,Math.min(100,100-Math.max(0,pct-50)));
 $('#budgetTotal').textContent=money(total);$('#budgetSpent').textContent=money(spent);
 $('#budgetRemaining').textContent=money(Math.max(0,total-spent));$('#budgetPercent').textContent=pct+'%';
 $('#budgetScore').textContent=score;$('#scoreBar').style.width=score+'%';
 $('#budgetList').innerHTML=state.budgets.length?state.budgets.map(b=>{
  const s=monthExpenseFor(b.category), p=Math.min(100,b.limit?Math.round(s/b.limit*100):0);
  return `<div class="budget-item"><div class="budget-row"><div class="left"><div class="tx-icon">${iconFor(b.category)}</div><div><b>${b.category}</b><small>Tháng này</small></div></div><strong>${money(s)}</strong></div>
  <div class="progress"><i style="width:${p}%;background:${p>=100?'var(--red)':p>=80?'var(--orange)':'var(--green)'}"></i></div>
  <div class="budget-meta"><span>${p}%</span><span>Tổng: ${money(b.limit)}</span></div></div>`
 }).join(''):`<div class="empty"><b>Chưa có ngân sách</b>Nhấn + để tạo ngân sách đầu tiên.</div>`;
}
function updateAI(){
 const t=totals(), net=t.income-t.expense;
 let text='Thêm giao dịch để robot AI phân tích thu chi cho bạn.';
 if(state.transactions.length){
  if(t.expense===0) text=`Bạn đã ghi nhận ${money(t.income)} thu nhập trong kỳ này và chưa có chi tiêu.`;
  else if(net>=0) text=`Bạn đang dư ${money(net)} trong kỳ này. Tỷ lệ chi tiêu bằng ${Math.round(t.expense/Math.max(1,t.income)*100)}% thu nhập.`;
  else text=`Chi tiêu đang vượt thu nhập ${money(Math.abs(net))}. Hãy kiểm tra các danh mục lớn nhất và điều chỉnh ngân sách.`;
 }
 $('#aiInsight').textContent=text;$('#aiModalText').textContent=text;
}
function renderChart(){
 const c=$('#financeChart'),ctx=c.getContext('2d'),w=c.width=c.clientWidth*2,h=c.height=c.clientHeight*2;
 ctx.clearRect(0,0,w,h);ctx.scale(2,2);const W=c.clientWidth,H=c.clientHeight;
 ctx.font='12px -apple-system';ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--muted');
 if(chartMode==='cashflow'){
  const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d});
  const vals=days.map(d=>{
   const ds=d.toISOString().slice(0,10), ts=state.transactions.filter(t=>t.date===ds);
   return [ts.filter(t=>t.type==='income').reduce((a,b)=>a+b.amount,0),ts.filter(t=>t.type==='expense').reduce((a,b)=>a+b.amount,0)]
  });
  const max=Math.max(1,...vals.flat()), base=H-34, graphH=H-56, group=W/7;
  ctx.strokeStyle='#3a3b40';ctx.setLineDash([4,4]);for(let i=0;i<4;i++){const y=18+i*graphH/3;ctx.beginPath();ctx.moveTo(34,y);ctx.lineTo(W-8,y);ctx.stroke()}ctx.setLineDash([]);
  vals.forEach((v,i)=>{const x=i*group+group*.34,bw=Math.min(16,group*.23);
   ctx.fillStyle='#49bd58';ctx.fillRect(x,base-v[0]/max*graphH,bw,v[0]/max*graphH);
   ctx.fillStyle='#ff4f45';ctx.fillRect(x+bw+4,base-v[1]/max*graphH,bw,v[1]/max*graphH);
   ctx.fillStyle='#55bdb7';ctx.fillText(['CN','T2','T3','T4','T5','T6','T7'][days[i].getDay()],x, H-10)
  });
 }else{
  const expenses=state.transactions.filter(t=>t.type==='expense'&&inPeriod(t));
  const sums={};expenses.forEach(t=>sums[t.category]=(sums[t.category]||0)+t.amount);
  const arr=Object.entries(sums).sort((a,b)=>b[1]-a[1]),total=arr.reduce((a,b)=>a+b[1],0);
  if(!arr.length){ctx.fillText('Chưa có dữ liệu chi tiêu',W/2-70,H/2);return}
  const colors=['#9c27b0','#ff5722','#03a9f4','#4caf50','#ffc107','#e91e63'];
  let start=-Math.PI/2;arr.forEach(([k,v],i)=>{const a=v/total*Math.PI*2;ctx.beginPath();ctx.strokeStyle=colors[i%colors.length];ctx.lineWidth=38;ctx.arc(W*.28,H*.52,65,start,start+a);ctx.stroke();start+=a});
  arr.slice(0,5).forEach(([k,v],i)=>{ctx.fillStyle=colors[i%colors.length];ctx.beginPath();ctx.arc(W*.55,40+i*30,6,0,Math.PI*2);ctx.fill();ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--text');ctx.fillText(`${k} ${Math.round(v/total*100)}%`,W*.58,44+i*30)})
 }
}
function fillTransactionForm(type='income'){
 $('#transactionForm [name=type]').value=type;
 $$('.type-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.type===type));
 $('#toWalletWrap').hidden=type!=='transfer';
 const cats=categories[type];$('#categorySelect').innerHTML=cats.map(c=>`<option>${c[0]}</option>`).join('');
 const opts=state.wallets.map(w=>`<option value="${w.id}">${w.name}</option>`).join('');
 $('#walletSelect').innerHTML=opts;$('#toWalletSelect').innerHTML=opts;
 $('#transactionForm [name=date]').value=today();
}

$$('[data-nav]').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.nav)));
$$('[data-period]').forEach(b=>b.addEventListener('click',()=>{$$('[data-period]').forEach(x=>x.classList.remove('active'));b.classList.add('active');period=b.dataset.period;render()}));
$$('[data-chart]').forEach(b=>b.addEventListener('click',()=>{$$('[data-chart]').forEach(x=>x.classList.remove('active'));b.classList.add('active');chartMode=b.dataset.chart;renderChart()}));
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{$$('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');transactionFilter=b.dataset.filter;renderTransactions()}));
$$('.type-tabs button').forEach(b=>b.addEventListener('click',()=>fillTransactionForm(b.dataset.type)));
$('#transactionSearch').addEventListener('input',renderTransactions);$('#walletSearch').addEventListener('input',renderWallets);
$('#openTransactionModal').onclick=()=>{fillTransactionForm();$('#transactionModal').showModal()};
$('#openWalletModal').onclick=()=>$('#walletModal').showModal();
$('#openBudgetModal').onclick=()=>{const used=state.budgets.map(b=>b.category);$('#budgetCategorySelect').innerHTML=categories.expense.filter(c=>!used.includes(c[0])).map(c=>`<option>${c[0]}</option>`).join('');$('#budgetModal').showModal()};
$('#transactionForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),amount=Number(String(f.get('amount')).replace(/\D/g,''));if(!amount)return alert('Nhập số tiền hợp lệ');
 state.transactions.push({id:uid(),type:f.get('type'),amount,category:f.get('category'),wallet:f.get('wallet'),toWallet:f.get('toWallet'),date:f.get('date'),note:f.get('note'),createdAt:Date.now()});
 e.currentTarget.reset();$('#transactionModal').close();save()
});
$('#walletForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.wallets.push({id:uid(),name:f.get('name'),kind:f.get('kind'),balance:Number(String(f.get('balance')).replace(/\D/g,''))||0});e.currentTarget.reset();$('#walletModal').close();save()});
$('#budgetForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),limit=Number(String(f.get('limit')).replace(/\D/g,''));if(!limit)return;state.budgets.push({id:uid(),category:f.get('category'),limit});e.currentTarget.reset();$('#budgetModal').close();save()});
$('#toggleBalance').onclick=()=>{state.settings.hideBalance=!state.settings.hideBalance;save()};
$('#themeBtn').onclick=()=>{state.settings.theme=state.settings.theme==='dark'?'light':'dark';save()};
$('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`ai-finance-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href)};
$('#importInput').onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(!data.wallets||!data.transactions)throw 0;state={...structuredClone(defaults),...data};save();alert('Khôi phục dữ liệu thành công')}catch{alert('File JSON không hợp lệ')}e.target.value=''};
$('#resetBtn').onclick=()=>{if(confirm('Xóa toàn bộ dữ liệu?')){state=structuredClone(defaults);save()}};
$('#robotBtn').onclick=$('#refreshInsight').onclick=()=>{$('#aiModal').showModal()};$('#closeAi').onclick=()=>$('#aiModal').close();
$('#todayLabel').textContent=new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'});
window.addEventListener('resize',renderChart);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js');
render();
