/* ============================================================
   SHARK — Financial Dashboard (SPA)
   Tecnologia: HTML + CSS + JS puro | Dados: localStorage
   ============================================================ */

'use strict';

// ═══════════════════════════════════════════════════════════
// STORE — localStorage CRUD
// ═══════════════════════════════════════════════════════════
const Store = {
  get(key, fb = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  remove(key) { localStorage.removeItem(key); },

  getUsers()       { return this.get('shark_users', []); },
  saveUsers(u)     { this.set('shark_users', u); },
  getCurrentUser() { return this.get('shark_user'); },
  setCurrentUser(u){ this.set('shark_user', u); },
  clearUser()      { this.remove('shark_user'); },

  _k(s) { const u = this.getCurrentUser(); return u ? `shark_${u.id}_${s}` : null; },

  getTx()      { return this.get(this._k('tx'), []); },
  saveTx(d)    { this.set(this._k('tx'), d); },
  getCats()    { return this.get(this._k('cats'), []); },
  saveCats(d)  { this.set(this._k('cats'), d); },
  getLoans()   { return this.get(this._k('loans'), []); },
  saveLoans(d) { this.set(this._k('loans'), d); },
  getPayments(){ return this.get(this._k('pmts'), []); },
  savePayments(d){ this.set(this._k('pmts'), d); },
};

// ═══════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════
const Utils = {
  brl(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  },
  fmtDate(s) {
    if (!s) return '—';
    const [y, m, d] = s.split('-').map(Number);
    const M = ['jan.','fev.','mar.','abr.','mai.','jun.','jul.','ago.','set.','out.','nov.','dez.'];
    return `${d} de ${M[m-1]} de ${y}`;
  },
  monthLabel(ym) {
    const [y, m] = ym.split('-').map(Number);
    const M = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${M[m-1]}/${String(y).slice(2)}`;
  },
  today() { return new Date().toISOString().slice(0,10); },
  curYM()  { return new Date().toISOString().slice(0,7); },
  ym(d)    { return d ? d.slice(0,7) : ''; },
  addM(ym, n) {
    const [y,m] = ym.split('-').map(Number);
    const dt = new Date(y, m-1+n, 1);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
  },
  uid() { return Date.now().toString(36)+Math.random().toString(36).slice(2); },
  esc(s) {
    const d = document.createElement('div'); d.textContent = s||''; return d.innerHTML;
  },
  num(v) { return parseFloat(v) || 0; },
};

// ═══════════════════════════════════════════════════════════
// CHARTS — gerenciamento de instâncias Chart.js
// ═══════════════════════════════════════════════════════════
const Charts = {
  _inst: {},
  destroy(id) {
    if (this._inst[id]) { this._inst[id].destroy(); delete this._inst[id]; }
  },
  destroyAll() {
    Object.keys(this._inst).forEach(id => this.destroy(id));
  },
  make(id, cfg) {
    this.destroy(id);
    const el = document.getElementById(id);
    if (!el) return null;
    this._inst[id] = new Chart(el, cfg);
    return this._inst[id];
  },
  gridColor: 'rgba(30,41,59,0.8)',
  tickColor: '#64748B',
  textColor: '#F1F5F9',
};

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
let STATE = { page: 'home', params: {}, flash: null };

// ═══════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════
const Router = {
  go(hash) { location.hash = hash; },
  parse() {
    const full  = location.hash.replace('#','') || 'home';
    const path  = full.split('?')[0];          // remove query string
    const parts = path.split('/');
    return { page: parts[0], id: parts[1], sub: parts[2] };
  },
  init() {
    window.addEventListener('hashchange', () => App.render());
    document.addEventListener('DOMContentLoaded', () => App.init());
  }
};

// ═══════════════════════════════════════════════════════════
// APP — controlador principal
// ═══════════════════════════════════════════════════════════
const App = {
  init() {
    document.getElementById('footer-year').textContent = new Date().getFullYear();
    this.render();
  },
  render() {
    Charts.destroyAll();
    const { page, id, sub } = Router.parse();
    const user = Store.getCurrentUser();
    const pub = ['home','login','register'];

    if (!user && !pub.includes(page)) { Router.go('home'); return; }
    if (user && pub.includes(page))   { Router.go('dashboard'); return; }

    Navbar.render(user, page);
    Flash.render();

    const main = document.getElementById('main');
    switch (page) {
      case 'home':        main.innerHTML = Pages.home(); break;
      case 'login':       main.innerHTML = Pages.login(); break;
      case 'register':    main.innerHTML = Pages.register(); break;
      case 'dashboard':   Pages.dashboard(main); break;
      case 'transactions':
        if (id === 'new')  main.innerHTML = Pages.txForm(null);
        else if (sub === 'edit') main.innerHTML = Pages.txForm(id);
        else               Pages.transactions(main);
        break;
      case 'categories':
        if (id === 'new')  main.innerHTML = Pages.catForm(null);
        else if (sub === 'edit') main.innerHTML = Pages.catForm(id);
        else               main.innerHTML = Pages.categories();
        break;
      case 'loans':
        if (id === 'new')        main.innerHTML = Pages.loanForm(null);
        else if (sub === 'edit') main.innerHTML = Pages.loanForm(id);
        else if (id)             Pages.loanDetail(main, id);
        else                     Pages.loans(main);
        break;
      case 'plano':       Pages.plano(main); break;
      default:            Router.go('dashboard');
    }
    Handlers.bind();
  },
  flash(msg, type='notice') {
    STATE.flash = { msg, type };
    Flash.render();
    setTimeout(() => { STATE.flash = null; Flash.render(); }, 4000);
  }
};

// ═══════════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════════
const Navbar = {
  render(user, page) {
    const el = document.getElementById('navbar');
    const isActive = (p) => p === page
      ? 'px-3 py-2 rounded-md text-sm font-medium bg-ink-700 text-wave-400'
      : 'px-3 py-2 rounded-md text-sm font-medium text-ink-100 hover:text-wave-400 hover:bg-ink-700 transition-colors';

    if (!user) {
      el.innerHTML = `
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <a href="#home" class="flex items-center gap-2">
            <img src="images/logo.png" alt="Shark" style="height:32px;width:auto;filter:drop-shadow(0 0 6px rgba(14,165,233,0.5))">
            <span class="text-xl font-bold tracking-tight">
              <span class="text-ink-50">Sh</span><span class="text-wave-400">ark</span>
            </span>
          </a>
          <div class="flex items-center gap-2">
            <a href="#login"    class="btn btn-ghost">Entrar</a>
            <a href="#register" class="btn btn-primary">Criar conta</a>
          </div>
        </div>
      </div>`;
      return;
    }

    el.innerHTML = `
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-16 items-center justify-between">
        <a href="#dashboard" class="flex items-center gap-2 group">
          <img src="images/logo.png" alt="Shark" style="height:32px;width:auto;filter:drop-shadow(0 0 6px rgba(14,165,233,0.5))">
          <span class="text-xl font-bold tracking-tight">
            <span class="text-ink-50">Sh</span><span class="text-wave-400">ark</span>
          </span>
        </a>
        <nav class="hidden md:flex items-center gap-1">
          <a href="#dashboard"    class="${isActive('dashboard')}">Dashboard</a>
          <a href="#transactions" class="${isActive('transactions')}">Lançamentos</a>
          <a href="#categories"   class="${isActive('categories')}">Categorias</a>
          <a href="#loans"        class="${isActive('loans')}">Empréstimos</a>
          <a href="#plano"        class="${isActive('plano')}">Plano</a>
        </nav>
        <div class="hidden md:flex items-center gap-3">
          <span class="text-xs text-ink-200">${Utils.esc(user.email)}</span>
          <button id="btn-logout" class="btn btn-ghost text-sm">Sair</button>
        </div>
        <button id="btn-mobile-menu" class="md:hidden btn btn-ghost p-2" aria-label="Menu">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
      <div id="mobile-menu" class="md:hidden pb-3 border-t border-ink-600/50 mt-1">
        <nav class="flex flex-col gap-1 pt-3">
          <a href="#dashboard"    class="${isActive('dashboard')}" data-mobile-link>Dashboard</a>
          <a href="#transactions" class="${isActive('transactions')}" data-mobile-link>Lançamentos</a>
          <a href="#categories"   class="${isActive('categories')}" data-mobile-link>Categorias</a>
          <a href="#loans"        class="${isActive('loans')}" data-mobile-link>Empréstimos</a>
          <a href="#plano"        class="${isActive('plano')}" data-mobile-link>Plano</a>
        </nav>
        <div class="mt-3 pt-3 border-t border-ink-600/50 flex items-center justify-between">
          <span class="text-xs text-ink-200 truncate max-w-[200px]">${Utils.esc(user.email)}</span>
          <button id="btn-logout-mobile" class="btn btn-ghost text-sm">Sair</button>
        </div>
      </div>
    </div>`;
  }
};

// ═══════════════════════════════════════════════════════════
// FLASH
// ═══════════════════════════════════════════════════════════
const Flash = {
  render() {
    const el = document.getElementById('flash-container');
    if (!STATE.flash) { el.innerHTML = ''; return; }
    const cls = STATE.flash.type === 'alert' ? 'flash-alert' : 'flash-notice';
    el.innerHTML = `<div class="${cls}">${Utils.esc(STATE.flash.msg)}</div>`;
  }
};

// ═══════════════════════════════════════════════════════════
// SEED DATA — popula conta nova com exemplos
// ═══════════════════════════════════════════════════════════
function seedUser(userId) {
  const cats = [
    { id: 'c1', name: 'Alimentação',  color: '#0EA5E9' },
    { id: 'c2', name: 'Transporte',   color: '#38BDF8' },
    { id: 'c3', name: 'Saúde',        color: '#34D399' },
    { id: 'c4', name: 'Lazer',        color: '#A78BFA' },
    { id: 'c5', name: 'Moradia',      color: '#F97316' },
    { id: 'c6', name: 'Salário',      color: '#4ADE80' },
  ];

  const now = new Date();
  const ym  = (offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  };
  const day = (ym, d) => `${ym}-${String(d).padStart(2,'0')}`;

  const txs = [];
  for (let mo = -3; mo <= 0; mo++) {
    const m = ym(mo);
    txs.push(
      { id: Utils.uid(), kind:'income',  category_id:'c6', amount:5800, date:day(m,5),  description:'Salário' },
      { id: Utils.uid(), kind:'expense', category_id:'c1', amount:680,  date:day(m,7),  description:'Supermercado' },
      { id: Utils.uid(), kind:'expense', category_id:'c2', amount:320,  date:day(m,10), description:'Combustível' },
      { id: Utils.uid(), kind:'expense', category_id:'c5', amount:1500, date:day(m,10), description:'Aluguel' },
      { id: Utils.uid(), kind:'expense', category_id:'c4', amount:mo === 0 ? 420 : 260, date:day(m,15), description:'Lazer' },
      { id: Utils.uid(), kind:'expense', category_id:'c3', amount:180,  date:day(m,20), description:'Farmácia' },
      { id: Utils.uid(), kind:'income',  category_id:'c6', amount:500,  date:day(m,25), description:'Freelance' },
    );
  }

  const k = `shark_${userId}`;
  localStorage.setItem(`${k}_cats`, JSON.stringify(cats));
  localStorage.setItem(`${k}_tx`,   JSON.stringify(txs));
  localStorage.setItem(`${k}_loans`, JSON.stringify([]));
  localStorage.setItem(`${k}_pmts`,  JSON.stringify([]));
}

// ═══════════════════════════════════════════════════════════
// PAGES — renderizadores de cada página
// ═══════════════════════════════════════════════════════════
const Pages = {

  // ─── HOME ───────────────────────────────────────────────
  home() {
    return `
    <section class="relative isolate overflow-hidden rounded-3xl border border-ink-600/50 bg-ink-800/40 px-6 py-20 sm:py-28">
      <div class="mx-auto max-w-3xl text-center">
        <span class="inline-flex items-center gap-2 rounded-full border border-wave-500/40 bg-wave-500/10 px-3 py-1 text-xs font-medium text-wave-300">
          <span class="h-1.5 w-1.5 rounded-full bg-wave-500 animate-pulse"></span>
          Dados em decisões. Suas finanças, seu controle.
        </span>
        <h1 class="mt-6 text-5xl sm:text-6xl font-bold tracking-tight">
          <span class="text-ink-50">Suas finanças,</span>
          <span class="text-wave-400"> em foco.</span>
        </h1>
        <p class="mt-6 text-lg text-ink-200 leading-relaxed">
          Cadastre categorias com cores, registre lançamentos e acompanhe em tempo real
          o comportamento do seu dinheiro. Interface escura com detalhes em azul oceano,
          feita para decisões rápidas.
        </p>
        <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href="#register" class="btn btn-primary text-base px-6 py-3">Criar minha conta</a>
          <a href="#login"    class="btn btn-secondary text-base px-6 py-3">Já tenho conta</a>
        </div>
      </div>
    </section>
    <section class="mt-12 grid gap-6 sm:grid-cols-3">
      <div class="card">
        <div class="card-title">Controle total</div>
        <p class="mt-3 text-ink-100">Registre cada receita e despesa em poucos cliques, com categoria e data.</p>
      </div>
      <div class="card">
        <div class="card-title">Visão clara</div>
        <p class="mt-3 text-ink-100">Gráficos, comparativos mensais e tabelas que revelam o padrão dos seus gastos.</p>
      </div>
      <div class="card-accent">
        <div class="card-title text-wave-300">Identidade única</div>
        <p class="mt-3 text-ink-100">Tema dark com azul oceano para uma experiência imersiva todo dia.</p>
      </div>
    </section>`;
  },

  // ─── LOGIN ───────────────────────────────────────────────
  login() {
    return `
    <div class="max-w-md mx-auto card-accent">
      <div class="mb-6 text-center">
        <h2 class="text-2xl font-semibold">Bem-vindo de volta</h2>
        <p class="text-sm text-ink-200 mt-1">Entre para continuar controlando suas finanças.</p>
      </div>
      <form id="form-login" class="space-y-4">
        <div>
          <label class="form-label">E-mail</label>
          <input type="email" name="email" class="form-input" required autofocus placeholder="seu@email.com">
        </div>
        <div>
          <label class="form-label">Senha</label>
          <input type="password" name="password" class="form-input" required placeholder="••••••••">
        </div>
        <button type="submit" class="btn btn-primary w-full">Entrar</button>
      </form>
      <div class="mt-6 text-center text-sm text-ink-200">
        Novo por aqui? <a href="#register" class="link-wave">Criar conta</a>
      </div>
    </div>`;
  },

  // ─── REGISTER ───────────────────────────────────────────
  register() {
    return `
    <div class="max-w-md mx-auto card-accent">
      <div class="mb-6 text-center">
        <h2 class="text-2xl font-semibold">Crie sua conta</h2>
        <p class="text-sm text-ink-200 mt-1">Comece a controlar seus gastos em minutos.</p>
      </div>
      <form id="form-register" class="space-y-4">
        <div>
          <label class="form-label">E-mail</label>
          <input type="email" name="email" class="form-input" required autofocus placeholder="seu@email.com">
        </div>
        <div>
          <label class="form-label">Senha</label>
          <input type="password" name="password" class="form-input" required minlength="6" placeholder="Mínimo 6 caracteres">
        </div>
        <div>
          <label class="form-label">Confirmação de senha</label>
          <input type="password" name="password_confirmation" class="form-input" required placeholder="Repita a senha">
        </div>
        <button type="submit" class="btn btn-primary w-full">Criar conta</button>
      </form>
      <div class="mt-6 text-center text-sm text-ink-200">
        Já tem conta? <a href="#login" class="link-wave">Entrar</a>
      </div>
    </div>`;
  },

  // ─── DASHBOARD ──────────────────────────────────────────
  dashboard(main) {
    const txs  = Store.getTx();
    const cats = Store.getCats();
    const curYM = Utils.curYM();
    const monthTxs = txs.filter(t => Utils.ym(t.date) === curYM);
    const income  = monthTxs.filter(t=>t.kind==='income').reduce((s,t)=>s+Utils.num(t.amount),0);
    const expense = monthTxs.filter(t=>t.kind==='expense').reduce((s,t)=>s+Utils.num(t.amount),0);
    const balance = income - expense;
    const catMap  = Object.fromEntries(cats.map(c=>[c.id, c]));

    // Comparativo últimos 6 meses
    const comparison = [];
    for (let i = 5; i >= 0; i--) {
      const ym = Utils.addM(curYM, -i);
      const mt = txs.filter(t => Utils.ym(t.date) === ym);
      const inc = mt.filter(t=>t.kind==='income').reduce((s,t)=>s+Utils.num(t.amount),0);
      const exp = mt.filter(t=>t.kind==='expense').reduce((s,t)=>s+Utils.num(t.amount),0);
      comparison.push({ label: Utils.monthLabel(ym), income: inc, expense: exp, balance: inc-exp });
    }

    // Despesas por categoria (mês atual)
    const expByCat = {};
    monthTxs.filter(t=>t.kind==='expense').forEach(t => {
      expByCat[t.category_id] = (expByCat[t.category_id]||0) + Utils.num(t.amount);
    });

    const recent = txs.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
    const hasData = txs.length > 0;

    if (!hasData) {
      main.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div><h1 class="text-3xl font-semibold">Visão Geral</h1></div>
        <div class="flex gap-2">
          <a href="#transactions/new" class="btn btn-primary">Novo lançamento</a>
          <a href="#categories/new"   class="btn btn-secondary">Nova categoria</a>
        </div>
      </div>
      <div class="card-accent text-center py-20">
        <h2 class="text-2xl font-semibold mb-2">Vamos começar?</h2>
        <p class="text-ink-200 mb-6 max-w-md mx-auto">Nenhum lançamento ainda. Comece cadastrando suas primeiras categorias e lançamentos.</p>
        <div class="flex flex-wrap justify-center gap-3">
          <a href="#categories/new"   class="btn btn-primary">Criar primeira categoria</a>
          <a href="#transactions/new" class="btn btn-secondary">Criar primeiro lançamento</a>
        </div>
      </div>`;
      return;
    }

    const curMonth = (() => {
      const dt = new Date();
      const M = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      return `${M[dt.getMonth()]} de ${dt.getFullYear()}`;
    })();

    main.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-semibold">Visão Geral</h1>
        <p class="text-ink-200 text-sm mt-1">Mês de ${curMonth}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <a href="#transactions/new" class="btn btn-primary">Novo lançamento</a>
        <a href="#categories/new"   class="btn btn-secondary">Nova categoria</a>
      </div>
    </div>

    <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 mb-8">
      <div class="card">
        <div class="card-title">Receitas do mês</div>
        <div class="card-value text-emerald-400">${Utils.brl(income)}</div>
      </div>
      <div class="card">
        <div class="card-title">Despesas do mês</div>
        <div class="card-value text-red-400">${Utils.brl(expense)}</div>
      </div>
      <div class="card-accent col-span-2 sm:col-span-1">
        <div class="card-title">Saldo</div>
        <div class="card-value ${balance>=0?'text-wave-400':'text-red-400'}">${Utils.brl(balance)}</div>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2 mb-8">
      <div class="card">
        <h2 class="card-title mb-4">Despesas por categoria</h2>
        ${Object.keys(expByCat).length > 0
          ? `<div style="height:300px"><canvas id="chart-pie"></canvas></div>`
          : `<p class="text-ink-200 text-sm">Sem despesas registradas neste mês.</p>`}
      </div>
      <div class="card">
        <h2 class="card-title mb-4">Receitas × Despesas (6 meses)</h2>
        <div style="height:300px"><canvas id="chart-line"></canvas></div>
      </div>
    </div>

    <div class="card p-0 overflow-hidden mb-8">
      <div class="px-5 py-4 border-b border-ink-600/50">
        <h2 class="card-title">Comparativo mensal</h2>
      </div>
      <div class="table-scroll-wrapper">
        <table class="table" style="min-width:420px">
          <thead><tr>
            <th>Mês</th>
            <th class="text-right">Receitas</th>
            <th class="text-right">Despesas</th>
            <th class="text-right">Saldo</th>
          </tr></thead>
          <tbody>
            ${comparison.map(r=>`<tr>
              <td class="font-medium whitespace-nowrap">${r.label}</td>
              <td class="text-right font-mono text-emerald-300">${Utils.brl(r.income)}</td>
              <td class="text-right font-mono text-red-300">${Utils.brl(r.expense)}</td>
              <td class="text-right font-mono ${r.balance>=0?'text-wave-400':'text-red-400'}">${Utils.brl(r.balance)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="card-title">Lançamentos recentes</h2>
        <a href="#transactions" class="link-wave text-sm">Ver todos →</a>
      </div>
      <ul class="divide-y divide-ink-700">
        ${recent.map(t => {
          const cat = catMap[t.category_id] || { name:'—', color:'#475569' };
          return `<li class="py-3 flex items-center justify-between gap-4 min-w-0">
            <div class="flex items-center gap-3 min-w-0">
              <span class="dot" style="background:${cat.color}"></span>
              <div class="min-w-0">
                <div class="text-ink-50 text-sm font-medium truncate">${Utils.esc(t.description||cat.name)}</div>
                <div class="text-xs text-ink-200">${Utils.fmtDate(t.date)} · ${Utils.esc(cat.name)}</div>
              </div>
            </div>
            <div class="font-mono text-sm whitespace-nowrap flex-shrink-0 ${t.kind==='income'?'text-emerald-300':'text-red-300'}">
              ${t.kind==='income'?'+':'−'} ${Utils.brl(t.amount)}
            </div>
          </li>`;
        }).join('')}
      </ul>
    </div>`;

    // Gráficos
    if (Object.keys(expByCat).length > 0) {
      const catLabels = Object.keys(expByCat).map(id => (catMap[id]||{name:'?'}).name);
      const catColors = Object.keys(expByCat).map(id => (catMap[id]||{color:'#0EA5E9'}).color);
      Charts.make('chart-pie', {
        type: 'doughnut',
        data: { labels: catLabels, datasets: [{ data: Object.values(expByCat), backgroundColor: catColors, borderColor: '#080E1C', borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position:'bottom', labels:{ color: Charts.textColor, font:{size:11} } } } }
      });
    }

    Charts.make('chart-line', {
      type: 'line',
      data: {
        labels: comparison.map(r=>r.label),
        datasets: [
          { label:'Receitas', data: comparison.map(r=>r.income), borderColor:'#34D399', backgroundColor:'rgba(52,211,153,0.1)', tension:0.4, fill:true },
          { label:'Despesas', data: comparison.map(r=>r.expense), borderColor:'#F87171', backgroundColor:'rgba(248,113,113,0.1)', tension:0.4, fill:true }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels:{ color: Charts.textColor } } },
        scales: {
          x: { ticks:{ color: Charts.tickColor }, grid:{ color: Charts.gridColor } },
          y: { ticks:{ color: Charts.tickColor }, grid:{ color: Charts.gridColor } }
        }
      }
    });
  },

  // ─── TRANSACTIONS LIST ───────────────────────────────────
  transactions(main) {
    const txs  = Store.getTx();
    const cats = Store.getCats();
    const catMap = Object.fromEntries(cats.map(c=>[c.id,c]));
    const params = new URLSearchParams(location.hash.split('?')[1]||'');
    const fKind = params.get('kind')||'';
    const fCat  = params.get('cat')||'';
    const page  = parseInt(params.get('page')||'1');
    const PER   = 15;

    let filtered = txs.slice().sort((a,b)=>b.date.localeCompare(a.date));
    if (fKind) filtered = filtered.filter(t=>t.kind===fKind);
    if (fCat)  filtered = filtered.filter(t=>t.category_id===fCat);

    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total/PER));
    const items = filtered.slice((page-1)*PER, page*PER);

    const pageUrl = (p) => `#transactions?kind=${fKind}&cat=${fCat}&page=${p}`;

    main.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-semibold">Lançamentos</h1>
        <p class="text-ink-200 text-sm mt-1">Receitas e despesas registradas na sua conta.</p>
      </div>
      <a href="#transactions/new" class="btn btn-primary self-start">Novo lançamento</a>
    </div>

    <div class="card mb-6">
      <form id="form-tx-filter" class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label class="form-label">Tipo</label>
          <select name="kind" class="form-select">
            <option value="" ${!fKind?'selected':''}>Todos</option>
            <option value="income"  ${fKind==='income'?'selected':''}>Receitas</option>
            <option value="expense" ${fKind==='expense'?'selected':''}>Despesas</option>
          </select>
        </div>
        <div>
          <label class="form-label">Categoria</label>
          <select name="cat" class="form-select">
            <option value="">Todas</option>
            ${cats.sort((a,b)=>a.name.localeCompare(b.name)).map(c=>
              `<option value="${c.id}" ${fCat===c.id?'selected':''}>${Utils.esc(c.name)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary">Filtrar</button>
          <a href="#transactions" class="btn btn-ghost">Limpar</a>
        </div>
      </form>
    </div>

    ${items.length > 0 ? `
    <div class="card p-0 overflow-hidden">
      <div class="table-scroll-wrapper">
        <table class="table" style="min-width:620px">
          <thead><tr>
            <th style="width:140px">Data</th>
            <th>Descrição</th>
            <th style="width:140px">Categoria</th>
            <th style="width:90px">Tipo</th>
            <th class="text-right" style="width:120px">Valor</th>
            <th class="text-right" style="width:120px">Ações</th>
          </tr></thead>
          <tbody>
            ${items.map(t => {
              const cat = catMap[t.category_id]||{name:'—',color:'#475569'};
              return `<tr>
                <td class="whitespace-nowrap text-sm">${Utils.fmtDate(t.date)}</td>
                <td class="cell-truncate"><span title="${Utils.esc(t.description||'—')}">${Utils.esc(t.description||'—')}</span></td>
                <td class="cell-truncate-flex"><div class="inner"><span class="dot" style="background:${cat.color}"></span><span title="${Utils.esc(cat.name)}">${Utils.esc(cat.name)}</span></div></td>
                <td><span class="${t.kind==='income'?'badge badge-income':'badge badge-expense'}">${t.kind==='income'?'Receita':'Despesa'}</span></td>
                <td class="text-right font-mono whitespace-nowrap ${t.kind==='income'?'text-emerald-300':'text-red-300'}">${t.kind==='income'?'+':'−'} ${Utils.brl(t.amount)}</td>
                <td class="text-right whitespace-nowrap">
                  <a href="#transactions/${t.id}/edit" class="btn btn-secondary text-xs py-1 px-2">Editar</a>
                  <button class="btn btn-danger text-xs py-1 px-2 ml-1" data-delete-tx="${t.id}">Excluir</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ${pages > 1 ? `<div class="flex items-center justify-between mt-4 text-sm">
      <span class="text-ink-300">${total} lançamentos · página ${page} de ${pages}</span>
      <div class="flex gap-1">
        ${page>1?`<a href="${pageUrl(page-1)}" class="btn btn-secondary text-xs py-1 px-3">←</a>`:''}
        ${Array.from({length:pages},(_,i)=>i+1).map(p=>
          `<a href="${pageUrl(p)}" class="btn btn-secondary text-xs py-1 px-3 ${p===page?'pagination-active':''}">${p}</a>`
        ).join('')}
        ${page<pages?`<a href="${pageUrl(page+1)}" class="btn btn-secondary text-xs py-1 px-3">→</a>`:''}
      </div>
    </div>` : `<p class="mt-4 text-sm text-ink-300">${total} lançamentos</p>`}
    ` : `<div class="card text-center py-16">
      <p class="text-ink-200">Nenhum lançamento encontrado.</p>
      <a href="#transactions/new" class="btn btn-primary mt-4">Criar primeiro lançamento</a>
    </div>`}`;
  },

  // ─── TRANSACTION FORM ────────────────────────────────────
  txForm(id) {
    const cats = Store.getCats();
    const tx   = id ? Store.getTx().find(t=>t.id===id) : null;
    const title = tx ? 'Editar lançamento' : 'Novo lançamento';
    return `
    <div class="mb-6"><h1 class="text-3xl font-semibold">${title}</h1></div>
    <div class="card max-w-xl">
      <form id="form-tx" class="space-y-5" data-id="${id||''}">
        <div>
          <label class="form-label">Tipo</label>
          <div class="grid grid-cols-2 gap-3">
            <label class="radio-card relative block cursor-pointer">
              <input type="radio" name="kind" value="expense" ${(!tx||tx.kind==='expense')?'checked':''}>
              <div class="radio-card-inner red">Despesa</div>
            </label>
            <label class="radio-card relative block cursor-pointer">
              <input type="radio" name="kind" value="income" ${tx&&tx.kind==='income'?'checked':''}>
              <div class="radio-card-inner green">Receita</div>
            </label>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Valor (R$)</label>
            <input type="number" name="amount" class="form-input" step="0.01" min="0.01" required
              value="${tx?tx.amount:''}" placeholder="0,00" autofocus>
          </div>
          <div>
            <label class="form-label">Data</label>
            <input type="date" name="date" class="form-input" required value="${tx?tx.date:Utils.today()}">
          </div>
        </div>
        <div>
          <label class="form-label">Categoria</label>
          <select name="category_id" class="form-select" required>
            <option value="">Selecione uma categoria</option>
            ${cats.sort((a,b)=>a.name.localeCompare(b.name)).map(c=>
              `<option value="${c.id}" ${tx&&tx.category_id===c.id?'selected':''}>${Utils.esc(c.name)}</option>`
            ).join('')}
          </select>
        </div>
        <div>
          <label class="form-label">Descrição (opcional)</label>
          <input type="text" name="description" class="form-input" maxlength="120"
            value="${Utils.esc(tx?tx.description:'')}" placeholder="Ex.: Almoço com a equipe">
        </div>
        <div class="flex items-center gap-3 pt-2">
          <button type="submit" class="btn btn-primary">Salvar</button>
          <a href="#transactions" class="btn btn-ghost">Cancelar</a>
        </div>
      </form>
    </div>`;
  },

  // ─── CATEGORIES LIST ─────────────────────────────────────
  categories() {
    const cats = Store.getCats().sort((a,b)=>a.name.localeCompare(b.name));
    const txs  = Store.getTx();
    const txCount = {};
    txs.forEach(t=>{ txCount[t.category_id]=(txCount[t.category_id]||0)+1; });

    return `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-semibold">Categorias</h1>
        <p class="text-ink-200 text-sm mt-1">Personalize cada categoria com uma cor para identificar rapidamente nos relatórios.</p>
      </div>
      <a href="#categories/new" class="btn btn-primary self-start">Nova categoria</a>
    </div>
    ${cats.length > 0 ? `
    <div class="card p-0 overflow-hidden">
      <div class="table-scroll-wrapper">
        <table class="table" style="min-width:380px">
          <thead><tr>
            <th>Nome</th><th>Cor</th><th class="text-right">Ações</th>
          </tr></thead>
          <tbody>
            ${cats.map(c=>`<tr>
              <td class="cell-truncate-flex"><div class="inner">
                <span class="dot" style="background:${c.color}"></span>
                <span class="font-medium" title="${Utils.esc(c.name)}">${Utils.esc(c.name)}</span>
              </div></td>
              <td class="font-mono text-xs text-ink-200 whitespace-nowrap">${c.color}</td>
              <td class="text-right whitespace-nowrap">
                <a href="#categories/${c.id}/edit" class="btn btn-secondary text-xs py-1 px-2">Editar</a>
                <button class="btn btn-danger text-xs py-1 px-2 ml-1" data-delete-cat="${c.id}" data-cat-name="${Utils.esc(c.name)}" data-cat-count="${txCount[c.id]||0}">Excluir</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : `<div class="card text-center py-16">
      <p class="text-ink-200">Você ainda não tem categorias.</p>
      <a href="#categories/new" class="btn btn-primary mt-4">Criar minha primeira categoria</a>
    </div>`}`;
  },

  // ─── CATEGORY FORM ───────────────────────────────────────
  catForm(id) {
    const cat   = id ? Store.getCats().find(c=>c.id===id) : null;
    const title = cat ? 'Editar categoria' : 'Nova categoria';
    const color = cat ? cat.color : '#0EA5E9';
    return `
    <div class="mb-6"><h1 class="text-3xl font-semibold">${title}</h1></div>
    <div class="card max-w-xl">
      <form id="form-cat" class="space-y-5" data-id="${id||''}">
        <div>
          <label class="form-label">Nome</label>
          <input type="text" name="name" class="form-input" required autofocus
            value="${Utils.esc(cat?cat.name:'')}" placeholder="Ex.: Alimentação">
        </div>
        <div>
          <label class="form-label">Cor</label>
          <div class="flex items-center gap-3">
            <input type="color" id="color-picker" name="color_picker" value="${color}"
              class="h-12 w-16 rounded-lg bg-ink-700 border border-ink-600 cursor-pointer p-1">
            <input type="text" id="color-text" name="color" class="form-input font-mono"
              pattern="#[0-9A-Fa-f]{6}" maxlength="7" value="${color}" placeholder="#0EA5E9">
          </div>
          <p class="form-hint">Use o seletor ou digite o código hexadecimal (#RRGGBB).</p>
        </div>
        <div class="flex items-center gap-3 pt-2">
          <button type="submit" class="btn btn-primary">Salvar</button>
          <a href="#categories" class="btn btn-ghost">Cancelar</a>
        </div>
      </form>
    </div>`;
  },


  // ─── LOANS LIST ──────────────────────────────────────────
  loans(main) {
    const loans = Store.getLoans();
    const pmts  = Store.getPayments();
    const params = new URLSearchParams(location.hash.split('?')[1]||'');
    const fKind   = params.get('kind')||'';
    const fStatus = params.get('status')||'';

    const today = Utils.today();
    // Enrich loans with computed fields
    const rich = loans.map(l => {
      const lPmts = pmts.filter(p=>p.loan_id===l.id);
      const paid  = lPmts.reduce((s,p)=>s+Utils.num(p.amount),0);
      const rem   = Math.max(0, Utils.num(l.total_amount)-paid);
      const pct   = l.total_amount > 0 ? Math.min(100,Math.round(paid/Utils.num(l.total_amount)*100)) : 0;
      let status = l.status;
      if (status !== 'paid' && l.due_date && l.due_date < today) status = 'overdue';
      if (rem <= 0) status = 'paid';
      return { ...l, _paid: paid, _rem: rem, _pct: pct, _status: status, _pmts: lPmts.length };
    });

    let filtered = rich;
    if (fKind)   filtered = filtered.filter(l=>l.kind===fKind);
    if (fStatus) filtered = filtered.filter(l=>l._status===fStatus);

    const totalBorrowed = rich.filter(l=>l.kind==='borrowed').reduce((s,l)=>s+Utils.num(l.total_amount),0);
    const totalLent     = rich.filter(l=>l.kind==='lent').reduce((s,l)=>s+Utils.num(l.total_amount),0);
    const activeCount   = rich.filter(l=>l._status==='active').length;
    const overdueCount  = rich.filter(l=>l._status==='overdue').length;

    const statusBadge = s => ({
      active:  '<span class="badge badge-active">Ativo</span>',
      overdue: '<span class="badge badge-overdue">Em atraso</span>',
      paid:    '<span class="badge badge-paid">Pago</span>',
    }[s]||'');
    const kindBadge = k => k==='borrowed'
      ? '<span class="badge badge-borrowed">💸 Tomado</span>'
      : '<span class="badge badge-lent">🤝 Concedido</span>';
    const barColor = s => ({ paid:'#34D399', overdue:'#F87171' }[s]||'#0EA5E9');

    main.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-semibold">Empréstimos</h1>
        <p class="text-ink-200 text-sm mt-1">Acompanhe os empréstimos tomados e concedidos.</p>
      </div>
      <a href="#loans/new" class="btn btn-primary self-start">Novo empréstimo</a>
    </div>

    <div class="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-6">
      <div class="card"><div class="card-title">Total tomado</div><div class="card-value text-red-400">${Utils.brl(totalBorrowed)}</div></div>
      <div class="card"><div class="card-title">Total concedido</div><div class="card-value text-emerald-400">${Utils.brl(totalLent)}</div></div>
      <div class="card"><div class="card-title">Ativos</div><div class="card-value text-wave-400">${activeCount}</div></div>
      <div class="card"><div class="card-title">Em atraso</div><div class="card-value ${overdueCount>0?'text-red-400':'text-ink-200'}">${overdueCount}</div></div>
    </div>

    <div class="card mb-6">
      <form id="form-loan-filter" class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label class="form-label">Tipo</label>
          <select name="kind" class="form-select">
            <option value="">Todos</option>
            <option value="borrowed" ${fKind==='borrowed'?'selected':''}>Tomados (devo)</option>
            <option value="lent"     ${fKind==='lent'?'selected':''}>Concedidos (me devem)</option>
          </select>
        </div>
        <div>
          <label class="form-label">Status</label>
          <select name="status" class="form-select">
            <option value="">Todos</option>
            <option value="active"  ${fStatus==='active'?'selected':''}>Ativo</option>
            <option value="overdue" ${fStatus==='overdue'?'selected':''}>Em atraso</option>
            <option value="paid"    ${fStatus==='paid'?'selected':''}>Pago</option>
          </select>
        </div>
        <div class="flex gap-2">
          <button type="submit" class="btn btn-primary">Filtrar</button>
          <a href="#loans" class="btn btn-ghost">Limpar</a>
        </div>
      </form>
    </div>

    ${filtered.length > 0 ? `<div class="space-y-4">
      ${filtered.map(l=>`
      <div class="card">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <h2 class="text-lg font-semibold text-ink-50 truncate">${Utils.esc(l.name)}</h2>
              ${kindBadge(l.kind)} ${statusBadge(l._status)}
            </div>
            <div class="text-sm text-ink-200 flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <span>Início: ${Utils.fmtDate(l.start_date)}</span>
              ${l.due_date?`<span>Vencimento: ${Utils.fmtDate(l.due_date)}</span>`:''}
              ${l.installments_count?`<span>${l._pmts}/${l.installments_count} parcelas pagas</span>`:''}
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="text-2xl font-bold font-mono ${l.kind==='borrowed'?'text-red-400':'text-emerald-400'}">${Utils.brl(l.total_amount)}</div>
            <div class="text-xs text-ink-300 mt-0.5">Restante: <span class="font-mono">${Utils.brl(l._rem)}</span></div>
          </div>
        </div>
        <div class="mt-4">
          <div class="flex justify-between text-xs text-ink-300 mb-1">
            <span>Pago: ${Utils.brl(l._paid)}</span>
            <span>${l._pct}%</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${l._pct}%;background:${barColor(l._status)}"></div>
          </div>
        </div>
        <div class="flex gap-2 mt-4 pt-4 border-t border-ink-600/50">
          <a href="#loans/${l.id}" class="btn btn-secondary text-sm">Ver detalhes</a>
          <a href="#loans/${l.id}/edit" class="btn btn-ghost text-sm">Editar</a>
          <button class="btn btn-danger text-sm" data-delete-loan="${l.id}">Excluir</button>
        </div>
      </div>`).join('')}
    </div>` : `<div class="card text-center py-16">
      <p class="text-ink-200">Nenhum empréstimo encontrado.</p>
      <a href="#loans/new" class="btn btn-primary mt-4">Cadastrar primeiro empréstimo</a>
    </div>`}`;
  },

  // ─── LOAN DETAIL ─────────────────────────────────────────
  loanDetail(main, id) {
    const loan = Store.getLoans().find(l=>l.id===id);
    if (!loan) { Router.go('loans'); return; }
    const pmts = Store.getPayments().filter(p=>p.loan_id===id)
                   .sort((a,b)=>b.paid_on.localeCompare(a.paid_on));
    const paidAmt = pmts.reduce((s,p)=>s+Utils.num(p.amount),0);
    const rem     = Math.max(0, Utils.num(loan.total_amount)-paidAmt);
    const pct     = loan.total_amount>0 ? Math.min(100,Math.round(paidAmt/Utils.num(loan.total_amount)*100)) : 0;
    const today   = Utils.today();
    let status = loan.status;
    if (status!=='paid' && loan.due_date && loan.due_date<today) status='overdue';
    if (rem<=0) status='paid';
    const barColor = status==='paid'?'#34D399':status==='overdue'?'#F87171':'#0EA5E9';
    const kindBadge = loan.kind==='borrowed'
      ? '<span class="badge badge-borrowed">💸 Tomado</span>'
      : '<span class="badge badge-lent">🤝 Concedido</span>';
    const statusBadge = { active:'<span class="badge badge-active">Ativo</span>', overdue:'<span class="badge badge-overdue">Em atraso</span>', paid:'<span class="badge badge-paid">Pago</span>' }[status]||'';

    main.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <div class="flex flex-wrap items-center gap-2 mb-1">
          <h1 class="text-3xl font-semibold">${Utils.esc(loan.name)}</h1>
          ${kindBadge} ${statusBadge}
        </div>
        <p class="text-ink-200 text-sm mt-1">Iniciado em ${Utils.fmtDate(loan.start_date)}${loan.due_date?` · Vence em ${Utils.fmtDate(loan.due_date)}`:''}</p>
      </div>
      <div class="flex gap-2">
        <a href="#loans/${id}/edit" class="btn btn-secondary">Editar</a>
        <a href="#loans" class="btn btn-ghost">← Voltar</a>
      </div>
    </div>

    <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 mb-6">
      <div class="card"><div class="card-title">Valor total</div><div class="card-value font-mono ${loan.kind==='borrowed'?'text-red-400':'text-emerald-400'}">${Utils.brl(loan.total_amount)}</div></div>
      <div class="card"><div class="card-title">Total pago</div><div class="card-value font-mono text-wave-400">${Utils.brl(paidAmt)}</div></div>
      <div class="card-accent col-span-2 sm:col-span-1"><div class="card-title">Restante</div><div class="card-value font-mono ${rem>0?'text-red-400':'text-emerald-400'}">${Utils.brl(rem)}</div></div>
    </div>

    <div class="card mb-6">
      <div class="flex justify-between text-sm text-ink-200 mb-2">
        <span>Progresso do pagamento</span>
        <span class="font-semibold text-ink-50">${pct}%</span>
      </div>
      <div class="progress-bar-track" style="height:.75rem">
        <div class="progress-bar-fill" style="height:.75rem;width:${pct}%;background:${barColor}"></div>
      </div>
      ${loan.installments_count?`<p class="text-xs text-ink-300 mt-2">${pmts.length} de ${loan.installments_count} parcelas registradas</p>`:''}
      ${loan.interest_rate?`<p class="text-xs text-ink-300 mt-1">Taxa de juros: ${parseFloat(loan.interest_rate).toFixed(2)}% a.m.</p>`:''}
    </div>

    ${loan.notes?`<div class="card mb-6"><h2 class="card-title mb-2">Observações</h2><p class="text-sm text-ink-200 whitespace-pre-line">${Utils.esc(loan.notes)}</p></div>`:''}

    <div class="grid gap-6 ${status==='paid'?'':'lg:grid-cols-2'}">
      ${status!=='paid'?`
      <div class="card">
        <h2 class="card-title mb-4">Registrar pagamento</h2>
        <form id="form-payment" class="space-y-4" data-loan-id="${id}">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Valor (R$)</label>
              <input type="number" name="amount" class="form-input" step="0.01" min="0.01" required placeholder="0,00" value="${rem.toFixed(2)}">
            </div>
            <div>
              <label class="form-label">Data do pagamento</label>
              <input type="date" name="paid_on" class="form-input" required value="${Utils.today()}">
            </div>
          </div>
          ${loan.installments_count?`<div>
            <label class="form-label">Nº da parcela (opcional)</label>
            <input type="number" name="installment_number" class="form-input" min="1" step="1" placeholder="Ex.: 3">
          </div>`:''}
          <div>
            <label class="form-label">Observações (opcional)</label>
            <input type="text" name="notes" class="form-input" placeholder="Referência, comprovante…">
          </div>
          <button type="submit" class="btn btn-primary w-full">Registrar pagamento</button>
        </form>
      </div>`:'' }

      <div class="card ${status==='paid'?'lg:col-span-2':''}">
        <h2 class="card-title mb-4">Histórico de pagamentos</h2>
        ${pmts.length>0?`<div class="divide-y divide-ink-600/50">
          ${pmts.map(p=>`<div class="py-3 flex items-center justify-between gap-4">
            <div class="min-w-0">
              <div class="text-sm font-medium text-ink-50">${Utils.fmtDate(p.paid_on)}${p.installment_number?` <span class="text-xs text-ink-300">(parcela ${p.installment_number})</span>`:''}</div>
              ${p.notes?`<div class="text-xs text-ink-300 truncate">${Utils.esc(p.notes)}</div>`:''}
            </div>
            <div class="flex items-center gap-3 flex-shrink-0">
              <span class="font-mono text-emerald-400 text-sm font-semibold">${Utils.brl(p.amount)}</span>
              <button class="text-red-400 hover:text-red-300 text-lg leading-none cursor-pointer bg-transparent border-0" data-delete-pmt="${p.id}" data-loan-id="${id}" title="Remover">×</button>
            </div>
          </div>`).join('')}
        </div>`:`<p class="text-ink-300 text-sm">Nenhum pagamento registrado ainda.</p>`}
      </div>
    </div>`;
  },

  // ─── LOAN FORM ───────────────────────────────────────────
  loanForm(id) {
    const loan  = id ? Store.getLoans().find(l=>l.id===id) : null;
    const title = loan ? 'Editar empréstimo' : 'Novo empréstimo';
    const v = (f,d='') => loan ? (loan[f]??d) : d;
    const sel = (f,val) => v(f)===''+val?'checked':'';
    return `
    <div class="mb-6"><h1 class="text-3xl font-semibold">${title}</h1></div>
    <div class="card max-w-2xl">
      <form id="form-loan" class="space-y-5" data-id="${id||''}">
        <div>
          <label class="form-label">Tipo de empréstimo</label>
          <div class="grid grid-cols-2 gap-3">
            <label class="radio-card relative block cursor-pointer">
              <input type="radio" name="kind" value="borrowed" ${!loan||loan.kind==='borrowed'?'checked':''}>
              <div class="radio-card-inner red">💸 Tomado (eu devo)</div>
            </label>
            <label class="radio-card relative block cursor-pointer">
              <input type="radio" name="kind" value="lent" ${loan&&loan.kind==='lent'?'checked':''}>
              <div class="radio-card-inner green">🤝 Concedido (me devem)</div>
            </label>
          </div>
        </div>
        <div>
          <label class="form-label">Credor / Devedor</label>
          <input type="text" name="name" class="form-input" required autofocus
            value="${Utils.esc(v('name'))}" placeholder="Ex.: Banco, João Silva…">
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Valor total (R$)</label>
            <input type="number" name="total_amount" class="form-input" step="0.01" min="0.01" required value="${v('total_amount')}" placeholder="0,00">
          </div>
          <div>
            <label class="form-label">Taxa de juros (% a.m.)</label>
            <input type="number" name="interest_rate" class="form-input" step="0.01" min="0" value="${v('interest_rate')}" placeholder="0,00 (opcional)">
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="form-label">Nº de parcelas</label>
            <input type="number" name="installments_count" class="form-input" min="1" step="1" value="${v('installments_count')}" placeholder="—">
          </div>
          <div>
            <label class="form-label">Data início</label>
            <input type="date" name="start_date" class="form-input" required value="${v('start_date',Utils.today())}">
          </div>
          <div>
            <label class="form-label">Vencimento</label>
            <input type="date" name="due_date" class="form-input" value="${v('due_date')}">
          </div>
        </div>
        <div>
          <label class="form-label">Status</label>
          <div class="grid grid-cols-3 gap-3">
            <label class="radio-card relative block cursor-pointer">
              <input type="radio" name="status" value="active" ${!loan||loan.status==='active'?'checked':''}>
              <div class="radio-card-inner wave">Ativo</div>
            </label>
            <label class="radio-card relative block cursor-pointer">
              <input type="radio" name="status" value="overdue" ${sel('status','overdue')}>
              <div class="radio-card-inner red">Em atraso</div>
            </label>
            <label class="radio-card relative block cursor-pointer">
              <input type="radio" name="status" value="paid" ${sel('status','paid')}>
              <div class="radio-card-inner green">Pago</div>
            </label>
          </div>
        </div>
        <div>
          <label class="form-label">Observações (opcional)</label>
          <textarea name="notes" class="form-input" rows="3" placeholder="Contrato, banco, condições especiais…">${Utils.esc(v('notes'))}</textarea>
        </div>
        <div class="flex items-center gap-3 pt-2">
          <button type="submit" class="btn btn-primary">Salvar</button>
          <a href="#loans" class="btn btn-ghost">Cancelar</a>
        </div>
      </form>
    </div>`;
  },


  // ─── PLANO FINANCEIRO ────────────────────────────────────
  plano(main) {
    const txs  = Store.getTx();
    const cats = Store.getCats();
    const catMap = Object.fromEntries(cats.map(c=>[c.id,c]));
    const curYM  = Utils.curYM();
    const hasData = txs.length > 0;

    if (!hasData) {
      main.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div><h1 class="text-3xl font-semibold">Plano Financeiro</h1></div>
        <a href="#transactions/new" class="btn btn-primary self-start">Novo lançamento</a>
      </div>
      <div class="card-accent text-center py-20">
        <h2 class="text-2xl font-semibold mb-2">Sem dados ainda</h2>
        <p class="text-ink-200 mb-6 max-w-md mx-auto">Cadastre seus lançamentos para gerar análises, previsões e insights personalizados.</p>
        <div class="flex flex-wrap justify-center gap-3">
          <a href="#categories/new"   class="btn btn-primary">Criar categoria</a>
          <a href="#transactions/new" class="btn btn-secondary">Novo lançamento</a>
        </div>
      </div>`;
      return;
    }

    // ── Health Score ──
    let score = 50;
    let positiveMonths = 0;
    for (let i=1; i<=3; i++) {
      const ym = Utils.addM(curYM,-i);
      const mt = txs.filter(t=>Utils.ym(t.date)===ym);
      const inc = mt.filter(t=>t.kind==='income').reduce((s,t)=>s+Utils.num(t.amount),0);
      const exp = mt.filter(t=>t.kind==='expense').reduce((s,t)=>s+Utils.num(t.amount),0);
      if (inc>exp) positiveMonths++;
    }
    score += positiveMonths * 10;
    const last3ym = Utils.addM(curYM,-3);
    const last3exp = txs.filter(t=>t.kind==='expense' && Utils.ym(t.date)>=last3ym);
    const distinctCats = new Set(last3exp.map(t=>t.category_id)).size;
    const catBonus = Math.min(distinctCats*2,10);
    score += catBonus;
    const lastMYM = Utils.addM(curYM,-1);
    const prevMYM = Utils.addM(curYM,-2);
    const lastByCat={}, prevByCat={};
    txs.filter(t=>t.kind==='expense'&&Utils.ym(t.date)===lastMYM).forEach(t=>{ lastByCat[t.category_id]=(lastByCat[t.category_id]||0)+Utils.num(t.amount); });
    txs.filter(t=>t.kind==='expense'&&Utils.ym(t.date)===prevMYM).forEach(t=>{ prevByCat[t.category_id]=(prevByCat[t.category_id]||0)+Utils.num(t.amount); });
    let highGrowthCount=0;
    Object.entries(lastByCat).forEach(([cid,amt])=>{ const prev=prevByCat[cid]||0; if(prev>0&&((amt-prev)/prev*100)>20) highGrowthCount++; });
    const penalty = highGrowthCount*5;
    score = Math.max(0,Math.min(100, score-penalty));
    const scoreColor = score>=70?'#4ADE80':score>=40?'#EAB308':'#F87171';
    const scoreLabel = score>=70?'Saúde financeira boa':score>=40?'Pode melhorar':'Atenção necessária';

    // ── KPIs ──
    const thisMExp = txs.filter(t=>Utils.ym(t.date)===curYM&&t.kind==='expense').reduce((s,t)=>s+Utils.num(t.amount),0);
    const thisMInc = txs.filter(t=>Utils.ym(t.date)===curYM&&t.kind==='income').reduce((s,t)=>s+Utils.num(t.amount),0);

    // Forecast: média últimos 3 meses de despesas
    let forecastMonths=0, forecastTotal=0;
    for(let i=1;i<=3;i++){
      const ym=Utils.addM(curYM,-i);
      const s=txs.filter(t=>Utils.ym(t.date)===ym&&t.kind==='expense').reduce((s,t)=>s+Utils.num(t.amount),0);
      if(s>0){forecastMonths++;forecastTotal+=s;}
    }
    const forecastAvg = forecastMonths>0?forecastTotal/forecastMonths:0;

    // Saving rate últimos 3 meses
    let savingSum=0,savingMonths=0;
    for(let i=1;i<=3;i++){
      const ym=Utils.addM(curYM,-i);
      const inc=txs.filter(t=>Utils.ym(t.date)===ym&&t.kind==='income').reduce((s,t)=>s+Utils.num(t.amount),0);
      const exp=txs.filter(t=>Utils.ym(t.date)===ym&&t.kind==='expense').reduce((s,t)=>s+Utils.num(t.amount),0);
      if(inc>0){savingMonths++;savingSum+=((inc-exp)/inc*100);}
    }
    const avgSavingRate = savingMonths>0?savingSum/savingMonths:0;
    const savColor = avgSavingRate>=20?'#4ADE80':avgSavingRate>0?'#EAB308':'#F87171';

    // ── Insights ──
    const insights = [];
    if(thisMExp>forecastAvg*1.1&&forecastAvg>0) insights.push({type:'warning',title:'Gastos acima do esperado',body:`Você gastou ${Utils.brl(thisMExp)} este mês, acima da média de ${Utils.brl(forecastAvg)}.`});
    if(thisMInc>thisMExp&&thisMInc>0) insights.push({type:'success',title:'Mês no azul',body:`Receitas (${Utils.brl(thisMInc)}) maiores que despesas (${Utils.brl(thisMExp)}) este mês.`});
    if(positiveMonths===3) insights.push({type:'success',title:'3 meses consecutivos no azul',body:'Parabéns! Você manteve equilíbrio nos últimos 3 meses.'});
    if(highGrowthCount>0) insights.push({type:'danger',title:`${highGrowthCount} categoria${highGrowthCount>1?'s':''} com gastos em alta`,body:'Uma ou mais categorias cresceram mais de 20% em relação ao mês anterior.'});
    if(avgSavingRate>=20) insights.push({type:'success',title:'Taxa de poupança saudável',body:`Você está poupando em média ${avgSavingRate.toFixed(1)}% da renda — excelente!`});
    if(cats.length===0) insights.push({type:'tip',title:'Crie categorias',body:'Organize seus gastos com categorias para melhorar o score e obter análises mais precisas.'});

    const insightColor = {success:'#10B981',warning:'#EAB308',danger:'#F87171',tip:'#0EA5E9'};

    // ── Expenses by category (this month) ──
    const expByCatMonth = {};
    txs.filter(t=>Utils.ym(t.date)===curYM&&t.kind==='expense').forEach(t=>{ expByCatMonth[t.category_id]=(expByCatMonth[t.category_id]||0)+Utils.num(t.amount); });
    const topExpCats = Object.entries(expByCatMonth).sort((a,b)=>b[1]-a[1]).slice(0,10);

    // ── Forecast by category ──
    const forecastByCat = {};
    cats.forEach(c=>{
      let sum=0,months=0;
      for(let i=1;i<=3;i++){
        const ym=Utils.addM(curYM,-i);
        const s=txs.filter(t=>t.category_id===c.id&&Utils.ym(t.date)===ym&&t.kind==='expense').reduce((s,t)=>s+Utils.num(t.amount),0);
        if(s>0){sum+=s;months++;}
      }
      if(months>0) forecastByCat[c.id]={avg:sum/months,color:c.color,name:c.name};
    });
    const forecastItems = Object.values(forecastByCat).sort((a,b)=>b.avg-a.avg).slice(0,10);
    const forecastSum = forecastItems.reduce((s,f)=>s+f.avg,0);

    // ── Evolution by category (6 months) ──
    const evoMonths = Array.from({length:6},(_,i)=>Utils.addM(curYM,-5+i));
    const evoCats = cats.slice().sort((a,b)=>{
      const tot = (c) => txs.filter(t=>t.category_id===c.id&&t.kind==='expense').reduce((s,t)=>s+Utils.num(t.amount),0);
      return tot(b)-tot(a);
    }).slice(0,6);

    // ── Trends ──
    const trends = cats.map(c=>{
      const last=txs.filter(t=>t.category_id===c.id&&t.kind==='expense'&&Utils.ym(t.date)===lastMYM).reduce((s,t)=>s+Utils.num(t.amount),0);
      const prev=txs.filter(t=>t.category_id===c.id&&t.kind==='expense'&&Utils.ym(t.date)===prevMYM).reduce((s,t)=>s+Utils.num(t.amount),0);
      if(last===0&&prev===0) return null;
      const delta = prev>0 ? Math.round((last-prev)/prev*100) : null;
      return {name:c.name,color:c.color,last,prev,delta};
    }).filter(Boolean).sort((a,b)=>b.last-a.last);

    const curM = (() => {
      const dt=new Date();
      const M=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
      return `${M[dt.getMonth()]} de ${dt.getFullYear()}`;
    })();

    main.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-semibold">Plano Financeiro</h1>
        <p class="text-ink-200 text-sm mt-1">Análise inteligente das suas finanças · ${curM}</p>
      </div>
      <a href="#transactions/new" class="btn btn-primary self-start">Novo lançamento</a>
    </div>

    <div class="grid gap-4 grid-cols-2 lg:grid-cols-3 mb-8">
      <div class="card-accent flex flex-col col-span-2 lg:col-span-3">
        <div class="card-title mb-3">Score financeiro</div>
        <div class="flex items-end gap-2">
          <span class="text-5xl font-bold" style="color:${scoreColor}">${score}</span>
          <span class="text-ink-400 text-sm mb-1">/100</span>
        </div>
        <div class="mt-4">
          <div class="relative w-full h-1.5 rounded-full overflow-hidden" style="background:rgba(30,41,59,0.8)">
            <div class="absolute inset-0" style="background:linear-gradient(to right,#ef4444 0%,#eab308 40%,#eab308 70%,#4ade80 100%);opacity:.2"></div>
            <div class="absolute inset-0" style="background:linear-gradient(to right,#ef4444 0%,#eab308 40%,#eab308 70%,#4ade80 100%);clip-path:inset(0 ${100-score}% 0 0 round 9999px)"></div>
          </div>
          <div class="relative mt-3 flex text-xs text-ink-400">
            <span style="width:40%">Ruim</span>
            <span style="width:30%;text-align:center">Regular</span>
            <span style="width:30%;text-align:right">Bom</span>
          </div>
        </div>
        <p class="text-xs text-ink-300 mt-2">${scoreLabel}</p>
        <details class="mt-4 pt-4 border-t border-ink-600/50">
          <summary class="score-details-summary link-wave text-xs font-medium">Como funciona?</summary>
          <div class="mt-4 space-y-3 text-xs">
            <div class="flex justify-between py-2 border-b border-ink-700"><div><p class="text-ink-100 font-medium">Ponto de partida</p><p class="text-ink-400 mt-0.5">Todo usuário começa com 50 pontos.</p></div><span class="font-mono font-semibold text-ink-300">+50 pts</span></div>
            <div class="flex justify-between py-2 border-b border-ink-700"><div><p class="text-ink-100 font-medium">Meses no azul</p><p class="text-ink-400 mt-0.5">Cada mês dos últimos 3 com receitas > gastos vale +10 pts. Você teve <span class="text-ink-200 font-semibold">${positiveMonths}/3</span> meses positivos.</p></div><span class="font-mono font-semibold ${positiveMonths>0?'text-emerald-400':'text-ink-400'} whitespace-nowrap">+${positiveMonths*10} pts</span></div>
            <div class="flex justify-between py-2 border-b border-ink-700"><div><p class="text-ink-100 font-medium">Organização</p><p class="text-ink-400 mt-0.5">Cada categoria usada nos últimos 3 meses vale +2 pts (máx. +10).</p></div><span class="font-mono font-semibold ${catBonus>0?'text-emerald-400':'text-ink-400'} whitespace-nowrap">+${catBonus} pts</span></div>
            <div class="flex justify-between py-2"><div>${highGrowthCount>0?`<p class="text-red-300 font-medium">Gastos em alta (${highGrowthCount} cat.)</p><p class="text-ink-400 mt-0.5">Categoria com crescimento >20% penaliza −5 pts cada.</p>`:`<p class="text-emerald-300 font-medium">Gastos sob controle</p><p class="text-ink-400 mt-0.5">Nenhuma categoria com crescimento acima de 20%.</p>`}</div><span class="font-mono font-semibold ${highGrowthCount>0?'text-red-400':'text-emerald-400'} whitespace-nowrap">−${penalty} pts</span></div>
            <div class="pt-2 border-t border-ink-700 space-y-1.5">
              <p class="text-ink-400 font-semibold uppercase tracking-widest mb-2">Como melhorar</p>
              <p class="text-ink-300 flex gap-2"><span class="text-wave-500 font-bold flex-shrink-0">→</span>Feche cada mês com receitas maiores que gastos (+10 pts/mês).</p>
              <p class="text-ink-300 flex gap-2"><span class="text-wave-500 font-bold flex-shrink-0">→</span>Use categorias em todos os lançamentos (até +10 pts).</p>
              <p class="text-ink-300 flex gap-2"><span class="text-wave-500 font-bold flex-shrink-0">→</span>Evite que uma categoria cresça mais de 20% num mês (−5 pts cada).</p>
            </div>
          </div>
        </details>
      </div>
      <div class="card"><div class="card-title">Gastos este mês</div><div class="card-value text-red-400">${Utils.brl(thisMExp)}</div><p class="text-xs text-ink-200 mt-2">Receitas: <span class="text-emerald-400">${Utils.brl(thisMInc)}</span></p></div>
      <div class="card"><div class="card-title">Previsão próximo mês</div><div class="card-value text-wave-400">${Utils.brl(forecastAvg)}</div><p class="text-xs text-ink-200 mt-2">Média ${forecastMonths<=1?'do último mês':`dos últimos ${forecastMonths} meses`}</p></div>
      <div class="card"><div class="card-title">Taxa de economia</div><div class="card-value" style="color:${savColor}">${avgSavingRate.toFixed(1)}%</div><p class="text-xs text-ink-200 mt-2">${savingMonths===0?'Sem dados de receita ainda':`Média ${savingMonths<=1?'do último mês':`dos últimos ${savingMonths} meses`}`}</p></div>
    </div>

    ${insights.length>0?`<div class="mb-8">
      <h2 class="text-xs font-semibold tracking-widest uppercase text-ink-400 mb-4">Insights</h2>
      <div class="grid gap-2 sm:grid-cols-2">
        ${insights.map(ins=>`<div class="rounded-lg bg-ink-800/40 px-4 py-3" style="border-left:2px solid ${insightColor[ins.type]||'#6b7280'}">
          <p class="text-sm font-semibold text-ink-50">${Utils.esc(ins.title)}</p>
          <p class="text-xs text-ink-300 mt-1 leading-relaxed">${Utils.esc(ins.body)}</p>
        </div>`).join('')}
      </div>
    </div>`:''}

    <div class="grid gap-6 lg:grid-cols-2 mb-8">
      <div class="card">
        <h2 class="card-title mb-4">Maiores gastos do mês</h2>
        ${topExpCats.length>0?`<div style="height:280px"><canvas id="chart-bar-month"></canvas></div>`:`<p class="text-ink-200 text-sm">Sem despesas registradas neste mês.</p>`}
      </div>
      <div class="card">
        <h2 class="card-title mb-4">Previsão por categoria — próximo mês</h2>
        ${forecastItems.length>0?`<div style="height:280px"><canvas id="chart-bar-forecast"></canvas></div>`:`<p class="text-ink-200 text-sm">Dados insuficientes para previsão.</p>`}
      </div>
    </div>

    <div class="card mb-8">
      <h2 class="card-title mb-1">Evolução de gastos por categoria</h2>
      <p class="text-xs text-ink-400 mb-4">Valor gasto por mês em cada categoria</p>
      ${evoCats.length>0?`<div style="height:300px"><canvas id="chart-evo"></canvas></div>`:`<p class="text-ink-400 text-sm">Nenhuma despesa registrada ainda.</p>`}
    </div>

    ${trends.length>0?`<div class="card p-0 overflow-hidden mb-8">
      <div class="px-5 py-4 border-b border-ink-600/50">
        <h2 class="card-title">Tendências por categoria</h2>
        <p class="text-xs text-ink-200 mt-1">Comparando último mês com o mês anterior</p>
      </div>
      <div class="table-scroll-wrapper">
        <table class="table" style="min-width:520px">
          <thead><tr>
            <th>Categoria</th>
            <th class="text-right">Mês anterior</th>
            <th class="text-right">Último mês</th>
            <th class="text-right">Variação</th>
          </tr></thead>
          <tbody>
            ${trends.map(t=>`<tr>
              <td class="cell-truncate-flex"><div class="inner"><span class="dot" style="background:${t.color}"></span><span>${Utils.esc(t.name)}</span></div></td>
              <td class="text-right font-mono text-ink-200 whitespace-nowrap">${Utils.brl(t.prev)}</td>
              <td class="text-right font-mono text-ink-50 whitespace-nowrap">${Utils.brl(t.last)}</td>
              <td class="text-right font-mono whitespace-nowrap">
                ${t.delta===null?'<span class="text-ink-200 text-xs">novo</span>':t.delta>0?`<span class="text-red-400">↑ ${t.delta}%</span>`:t.delta<0?`<span class="text-emerald-400">↓ ${Math.abs(t.delta)}%</span>`:'<span class="text-ink-200">= 0%</span>'}
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`:''}

    ${forecastItems.length>0?`<div class="card p-0 overflow-hidden">
      <div class="px-5 py-4 border-b border-ink-600/50">
        <h2 class="card-title">Previsão detalhada — próximo mês</h2>
        <p class="text-xs text-ink-200 mt-1">Baseada na média ${forecastMonths<=1?'do último mês':`dos últimos ${forecastMonths} meses`} por categoria</p>
      </div>
      <div class="table-scroll-wrapper">
        <table class="table" style="min-width:400px">
          <thead><tr>
            <th>Categoria</th>
            <th class="text-right">Previsão</th>
            <th class="text-right">% do total</th>
          </tr></thead>
          <tbody>
            ${forecastItems.map(f=>`<tr>
              <td class="cell-truncate-flex"><div class="inner"><span class="dot" style="background:${f.color}"></span><span>${Utils.esc(f.name)}</span></div></td>
              <td class="text-right font-mono text-wave-400 whitespace-nowrap">${Utils.brl(f.avg)}</td>
              <td class="text-right font-mono text-ink-200 whitespace-nowrap">${forecastSum>0?(f.avg/forecastSum*100).toFixed(1)+'%':'—'}</td>
            </tr>`).join('')}
            <tr class="border-t border-ink-600">
              <td class="font-semibold text-ink-50">Total previsto</td>
              <td class="text-right font-mono font-semibold text-wave-400 whitespace-nowrap">${Utils.brl(forecastSum)}</td>
              <td class="text-right font-mono text-ink-200">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`:''}`;

    // ── Charts ──
    const chartOpts = {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{ color: Charts.textColor, font:{size:11} } } },
      scales:{
        x:{ ticks:{ color: Charts.tickColor }, grid:{ color: Charts.gridColor } },
        y:{ ticks:{ color: Charts.tickColor }, grid:{ color: Charts.gridColor } }
      }
    };

    if(topExpCats.length>0) {
      Charts.make('chart-bar-month',{
        type:'bar',
        data:{ labels:topExpCats.map(([id])=>(catMap[id]||{name:'?'}).name), datasets:[{ data:topExpCats.map(([,v])=>v), backgroundColor:topExpCats.map(([id])=>(catMap[id]||{color:'#0EA5E9'}).color), borderRadius:4 }] },
        options:{...chartOpts, plugins:{legend:{display:false}}}
      });
    }
    if(forecastItems.length>0) {
      Charts.make('chart-bar-forecast',{
        type:'bar',
        data:{ labels:forecastItems.map(f=>f.name), datasets:[{ data:forecastItems.map(f=>f.avg), backgroundColor:forecastItems.map(f=>f.color), borderRadius:4 }] },
        options:{...chartOpts, plugins:{legend:{display:false}}}
      });
    }
    if(evoCats.length>0) {
      Charts.make('chart-evo',{
        type:'line',
        data:{
          labels: evoMonths.map(ym=>Utils.monthLabel(ym)),
          datasets: evoCats.map(c=>({
            label:c.name,
            data: evoMonths.map(ym=>txs.filter(t=>t.category_id===c.id&&t.kind==='expense'&&Utils.ym(t.date)===ym).reduce((s,t)=>s+Utils.num(t.amount),0)),
            borderColor:c.color, backgroundColor:c.color+'22', tension:0.4
          }))
        },
        options:{...chartOpts}
      });
    }
  },

}; // end Pages

// ═══════════════════════════════════════════════════════════
// HANDLERS — event binding (chamado após cada render)
// ═══════════════════════════════════════════════════════════
const Handlers = {
  bind() {
    // Logout
    ['btn-logout','btn-logout-mobile'].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.addEventListener('click',()=>{ Store.clearUser(); Router.go('home'); });
    });

    // Mobile menu toggle
    const mBtn = document.getElementById('btn-mobile-menu');
    const mMenu = document.getElementById('mobile-menu');
    if(mBtn && mMenu) {
      mBtn.addEventListener('click',()=>mMenu.classList.toggle('open'));
      document.querySelectorAll('[data-mobile-link]').forEach(a=>a.addEventListener('click',()=>mMenu.classList.remove('open')));
    }

    // Login
    const fLogin = document.getElementById('form-login');
    if(fLogin) fLogin.addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(fLogin);
      const email = fd.get('email').trim().toLowerCase();
      const pass  = fd.get('password');
      const users = Store.getUsers();
      const user  = users.find(u=>u.email===email);
      if(!user || user.password!==pass) { App.flash('E-mail ou senha inválidos.','alert'); return; }
      Store.setCurrentUser(user);
      Router.go('dashboard');
    });

    // Register
    const fReg = document.getElementById('form-register');
    if(fReg) fReg.addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(fReg);
      const email = fd.get('email').trim().toLowerCase();
      const pass  = fd.get('password');
      const conf  = fd.get('password_confirmation');
      if(pass !== conf) { App.flash('As senhas não coincidem.','alert'); return; }
      if(pass.length < 6) { App.flash('A senha deve ter no mínimo 6 caracteres.','alert'); return; }
      const users = Store.getUsers();
      if(users.find(u=>u.email===email)) { App.flash('E-mail já cadastrado.','alert'); return; }
      const user = { id: Utils.uid(), email, password: pass };
      users.push(user);
      Store.saveUsers(users);
      Store.setCurrentUser(user);
      seedUser(user.id);
      Router.go('dashboard');
    });

    // Transaction filter
    const fTxF = document.getElementById('form-tx-filter');
    if(fTxF) fTxF.addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(fTxF);
      Router.go(`transactions?kind=${fd.get('kind')||''}&cat=${fd.get('cat')||''}&page=1`);
    });

    // Loan filter
    const fLnF = document.getElementById('form-loan-filter');
    if(fLnF) fLnF.addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(fLnF);
      Router.go(`loans?kind=${fd.get('kind')||''}&status=${fd.get('status')||''}`);
    });

    // Transaction save
    const fTx = document.getElementById('form-tx');
    if(fTx) fTx.addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(fTx);
      const id = fTx.dataset.id;
      const data = {
        id: id||Utils.uid(),
        kind: fd.get('kind'),
        amount: parseFloat(fd.get('amount')),
        date: fd.get('date'),
        category_id: fd.get('category_id'),
        description: fd.get('description')||'',
      };
      if(!data.category_id) { App.flash('Selecione uma categoria.','alert'); return; }
      const txs = Store.getTx();
      if(id) { const i=txs.findIndex(t=>t.id===id); if(i>=0) txs[i]=data; }
      else   { txs.push(data); }
      Store.saveTx(txs);
      App.flash(id?'Lançamento atualizado!':'Lançamento criado!');
      Router.go('transactions');
    });

    // Category color picker sync
    const picker = document.getElementById('color-picker');
    const colorText = document.getElementById('color-text');
    if(picker && colorText) {
      picker.addEventListener('input',  ()=>{ colorText.value=picker.value; });
      colorText.addEventListener('input',()=>{ if(/^#[0-9A-Fa-f]{6}$/.test(colorText.value)) picker.value=colorText.value; });
    }

    // Category save
    const fCat = document.getElementById('form-cat');
    if(fCat) fCat.addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(fCat);
      const id = fCat.dataset.id;
      const color = fd.get('color');
      const data = { id: id||Utils.uid(), name: fd.get('name').trim(), color: /^#[0-9A-Fa-f]{6}$/.test(color)?color:'#0EA5E9' };
      if(!data.name) { App.flash('Digite um nome para a categoria.','alert'); return; }
      const cats = Store.getCats();
      if(id) { const i=cats.findIndex(c=>c.id===id); if(i>=0) cats[i]=data; }
      else   { cats.push(data); }
      Store.saveCats(cats);
      App.flash(id?'Categoria atualizada!':'Categoria criada!');
      Router.go('categories');
    });

    // Loan save
    const fLoan = document.getElementById('form-loan');
    if(fLoan) fLoan.addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(fLoan);
      const id = fLoan.dataset.id;
      const data = {
        id: id||Utils.uid(),
        kind: fd.get('kind'),
        name: fd.get('name').trim(),
        total_amount: parseFloat(fd.get('total_amount'))||0,
        interest_rate: fd.get('interest_rate')||'',
        installments_count: fd.get('installments_count')||'',
        start_date: fd.get('start_date'),
        due_date: fd.get('due_date')||'',
        status: fd.get('status')||'active',
        notes: fd.get('notes')||'',
      };
      if(!data.name) { App.flash('Digite um nome.','alert'); return; }
      const loans = Store.getLoans();
      if(id) { const i=loans.findIndex(l=>l.id===id); if(i>=0) loans[i]=data; }
      else   { loans.push(data); }
      Store.saveLoans(loans);
      App.flash(id?'Empréstimo atualizado!':'Empréstimo criado!');
      Router.go('loans');
    });

    // Payment save
    const fPmt = document.getElementById('form-payment');
    if(fPmt) fPmt.addEventListener('submit', e=>{
      e.preventDefault();
      const fd = new FormData(fPmt);
      const loanId = fPmt.dataset.loanId;
      const pmt = {
        id: Utils.uid(),
        loan_id: loanId,
        amount: parseFloat(fd.get('amount'))||0,
        paid_on: fd.get('paid_on'),
        installment_number: fd.get('installment_number')||'',
        notes: fd.get('notes')||'',
      };
      if(pmt.amount<=0) { App.flash('Informe um valor válido.','alert'); return; }
      const pmts = Store.getPayments();
      pmts.push(pmt);
      Store.savePayments(pmts);
      // Also create expense transaction for this payment
      const loan = Store.getLoans().find(l=>l.id===loanId);
      if(loan) {
        const cats = Store.getCats();
        let catId = cats.find(c=>c.name.toLowerCase().includes('empréstimo')||c.name.toLowerCase().includes('loan'))?.id || cats[0]?.id || '';
        if(catId) {
          const txs = Store.getTx();
          txs.push({ id:Utils.uid(), kind:'expense', amount:pmt.amount, date:pmt.paid_on, category_id:catId, description:`Pagamento: ${loan.name}` });
          Store.saveTx(txs);
        }
      }
      App.flash('Pagamento registrado!');
      Router.go(`loans/${loanId}`);
    });

    // Delete handlers (delegation via data attrs)
    document.querySelectorAll('[data-delete-tx]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(!confirm('Excluir lançamento?')) return;
        const txs = Store.getTx().filter(t=>t.id!==btn.dataset.deleteTx);
        Store.saveTx(txs);
        App.flash('Lançamento excluído.','alert');
        App.render();
      });
    });
    document.querySelectorAll('[data-delete-cat]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const n=btn.dataset.catName, c=parseInt(btn.dataset.catCount)||0;
        const msg = c>0 ? `Excluir "${n}"? Isso também vai excluir ${c} lançamento${c>1?'s':''} vinculado${c>1?'s':''}. Ação irreversível.` : `Excluir a categoria "${n}"?`;
        if(!confirm(msg)) return;
        const id = btn.dataset.deleteCat;
        Store.saveCats(Store.getCats().filter(c=>c.id!==id));
        Store.saveTx(Store.getTx().filter(t=>t.category_id!==id));
        App.flash('Categoria excluída.','alert');
        App.render();
      });
    });
    document.querySelectorAll('[data-delete-loan]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(!confirm('Excluir empréstimo e todos os pagamentos?')) return;
        const id=btn.dataset.deleteLoan;
        Store.saveLoans(Store.getLoans().filter(l=>l.id!==id));
        Store.savePayments(Store.getPayments().filter(p=>p.loan_id!==id));
        App.flash('Empréstimo excluído.','alert');
        Router.go('loans');
      });
    });
    document.querySelectorAll('[data-delete-pmt]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        if(!confirm('Remover este pagamento?')) return;
        const id=btn.dataset.deletePmt, loanId=btn.dataset.loanId;
        Store.savePayments(Store.getPayments().filter(p=>p.id!==id));
        App.flash('Pagamento removido.','alert');
        Router.go(`loans/${loanId}`);
      });
    });
  }
};

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
Router.init();
