/* =============================================
   FinQuest — Main Application Logic
   =============================================
   Remix based on: Budget Badger (MIT Licence)
   https://github.com/nicholasgasior/budget-badger
   Original concept: simple localStorage budget tracker
   Transformation: gamification layer, quest mode,
   what-if simulator, charts, rewards, insights
   ============================================= */

'use strict';

// ============================================================
//  CONSTANTS & CONFIG
// ============================================================
const STORAGE_KEYS = {
  transactions: 'fq_transactions',
  budget:       'fq_budget',
  savingsGoal:  'fq_savings_goal',
  xp:           'fq_xp',
  badges:       'fq_badges',
  questBest:    'fq_quest_best',
  seeded:       'fq_seeded'
};

const CATEGORY_ICONS = {
  Food: '🍕', Transport: '🚌', Education: '📚',
  Entertainment: '🎬', Health: '💊', Shopping: '🛍️',
  Rent: '🏠', Utilities: '💡', Salary: '💼',
  Freelance: '💻', Gift: '🎁', Other: '📦'
};

const CATEGORY_COLORS = [
  '#00d4aa','#7c5cbf','#f0c040','#ff6b6b','#48c774',
  '#3273dc','#ff8b3d','#23d5ab','#e84393','#b86bff',
  '#56c2e6','#6e8898'
];

const ALL_BADGES = [
  { id: 'first_txn',     emoji: '📝', name: 'First Steps',       desc: 'Log your first transaction',               xp: 10 },
  { id: 'budget_set',    emoji: '📅', name: 'Budget Boss',       desc: 'Set a monthly budget',                     xp: 15 },
  { id: 'goal_set',      emoji: '🎯', name: 'Goal Getter',       desc: 'Set a savings goal',                       xp: 15 },
  { id: 'quest_done',    emoji: '⚔️', name: 'Quest Warrior',     desc: 'Complete the College Budget Quest',         xp: 50 },
  { id: 'quest_saved',   emoji: '🏆', name: 'Savings Champion',  desc: 'Save ≥₹1,500 in the quest',                xp: 30 },
  { id: 'whatif_used',   emoji: '🤔', name: 'Wise Thinker',      desc: 'Use the What If? simulator',               xp: 20 },
  { id: 'ten_txns',      emoji: '🔟', name: 'Power Logger',      desc: 'Log 10+ transactions',                     xp: 25 },
  { id: 'goal_reached',  emoji: '💰', name: 'Millionaire Mind',  desc: 'Reach 100% of your savings goal',          xp: 50 },
  { id: 'quest_perfect', emoji: '🌟', name: 'Perfect Semester',  desc: 'Finish quest with balance > ₹5,000',       xp: 40 },
  { id: 'rule72_used',   emoji: '⚡', name: 'Rule of 72 Master', desc: 'Use the Rule of 72 calculator',            xp: 30 },
  { id: 'rule72_quest',  emoji: '🧮', name: 'Finance Scholar',   desc: 'Apply Rule of 72 wisely in Quest Mode',    xp: 25 },
];

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1500, 2500];

const WI_PRESETS = [
  {
    aName: 'Buy a Used Bike', aCost: 15000, aMonthly: 300, aMonths: 12,
    bName: 'Take Auto/Bus', bCost: 0, bMonthly: 1800, bMonths: 12
  },
  {
    aName: 'Daily Café Coffee', aCost: 0, aMonthly: 1800, aMonths: 6,
    bName: 'Make Coffee at Home', bCost: 800, bMonthly: 200, bMonths: 6
  },
  {
    aName: 'Buy New Phone ₹25k', aCost: 25000, aMonthly: 0, aMonths: 1,
    bName: 'Repair Old Phone ₹2k', bCost: 2000, bMonthly: 0, bMonths: 1
  },
  {
    aName: 'Rent Near College', aCost: 0, aMonthly: 12000, aMonths: 10,
    bName: 'Rent Far, Commute', bCost: 0, bMonthly: 7000, bMonths: 10
  }
];

// ============================================================
//  QUEST DATA
// ============================================================
const QUEST_SCENARIOS = [
  {
    id: 'q_welcome',
    day: 1,
    type: 'info',
    badge: '🎓 Day 1',
    title: 'Welcome to Hostel Life!',
    desc: 'You\'ve just moved into your college hostel. You have ₹8,000 for the month. Your roommate invites you to the college fest orientation. How do you plan for day one?',
    choices: [
      { text: '📚 Attend orientation & skip the snacks stall', effect: 0,   mood: 'Focused', log: 'Smart start — saved money on day one!', type: 'good' },
      { text: '🍕 Grab snacks and join the party', effect: -350, mood: 'Happy', log: 'Spent ₹350 on the orientation snacks.', type: 'neutral' },
      { text: '🛒 Stock up your room with essentials first', effect: -700, mood: 'Prepared', log: 'Spent ₹700 stocking essentials.', type: 'neutral' }
    ]
  },
  {
    id: 'q_mess',
    day: 5,
    type: 'daily',
    badge: '🍽️ Day 5',
    title: 'Mess Food or Outside?',
    desc: 'College mess food is ₹150/day (included in fees). But your friends are going to a nice restaurant. Your monthly mess allowance covers 30 days. What do you do?',
    choices: [
      { text: '🥗 Eat at mess — it\'s already paid for', effect: 0,    mood: 'Disciplined', log: 'Stayed disciplined, ate at mess.', type: 'good' },
      { text: '🍛 Go with friends once (split bill)', effect: -280, mood: 'Social', log: 'Enjoyed a meal out. ₹280 spent.', type: 'neutral' },
      { text: '🍔 Make it a habit — eat out daily', effect: -1800, mood: 'Broke', log: 'Ate out for 6 days extra. ₹1,800 gone!', type: 'bad' }
    ]
  },
  {
    id: 'q_book',
    day: 10,
    type: 'academic',
    badge: '📚 Day 10',
    title: 'Textbook Dilemma',
    desc: 'A new textbook for your core subject costs ₹850. Your senior has a PDF (free) but it\'s hard to read on a phone. The library has 3 copies but they\'re always taken.',
    choices: [
      { text: '📖 Buy the textbook — invest in learning', effect: -850, mood: 'Studious', log: 'Bought the textbook for ₹850.', type: 'neutral' },
      { text: '📱 Use the free PDF (tough but free)', effect: 0,    mood: 'Resourceful', log: 'Used free PDF. Saved ₹850!', type: 'good' },
      { text: '🤝 Split cost with a classmate (₹425 each)', effect: -425, mood: 'Smart', log: 'Split the book cost. Paid ₹425.', type: 'good' }
    ]
  },
  {
    id: 'q_phone',
    day: 14,
    type: 'unexpected',
    badge: '⚡ Surprise!',
    title: '😱 Unexpected: Phone Screen Cracked!',
    desc: 'You dropped your phone and the screen cracked. Repair costs ₹1,200. Without it you\'ll miss important class updates. Your friend offers to lend you ₹600 interest-free.',
    choices: [
      { text: '🔧 Pay full repair cost from savings', effect: -1200, mood: 'Stressed', log: 'Paid ₹1,200 for phone repair. Ouch.', type: 'bad' },
      { text: '🤝 Split repair with friend\'s loan (pay ₹600 now)', effect: -600, mood: 'Relieved', log: 'Borrowed ₹600 from friend for repair.', type: 'neutral' },
      { text: '📵 Use a spare old phone for now', effect: -200,  mood: 'Surviving', log: 'Bought a secondhand SIM adapter for ₹200.', type: 'neutral' }
    ]
  },
  {
    id: 'q_internship',
    day: 18,
    type: 'opportunity',
    badge: '💼 Day 18',
    title: 'Internship Workshop — To Pay or Not?',
    desc: 'A startup is offering a 3-day paid workshop on entrepreneurship for ₹700. It includes lunch. Completing it adds to your CV and might lead to a summer internship.',
    choices: [
      { text: '🚀 Register and attend — invest in yourself!', effect: -700, mood: 'Ambitious', log: 'Registered for workshop. ₹700 spent, but great CV addition!', type: 'good' },
      { text: '📺 Find free YouTube alternatives instead', effect: 0,    mood: 'Resourceful', log: 'Found free resources online. Saved ₹700!', type: 'good' },
      { text: '🎮 Skip it — spend weekend gaming', effect: 0,    mood: 'Relaxed', log: 'Skipped the workshop. Chilled out.', type: 'neutral' }
    ]
  },
  {
    id: 'q_rule72',
    day: 20,
    type: 'knowledge',
    badge: '⚡ Day 20 — Rule of 72',
    title: '🧮 Finance Class: The Rule of 72!',
    desc: 'Your Economics professor introduces a quick way to estimate how long money may take to double. You have ₹2,000 spare at home. Which option best balances growth and caution?',
    r72hint: true,
    choices: [
      {
        text: '🏦 Compare a Fixed Deposit at an illustrative 7.2% rate — about 10 years to double',
        effect: 0, mood: 'Scholar', rule72badge: true,
        log: '✅ Applied Rule of 72! At an illustrative 7.2%, ₹2,000 may grow to about ₹4,000 in roughly 10 years. Actual rates and returns vary.',
        type: 'good',
        tip: '72 ÷ 7.2% ≈ 10 years to double. This is an estimate, and a fixed deposit’s rate and terms depend on the provider.'
      },
      {
        text: '💵 Leave it in savings account at 3.5% — it\'ll double someday…',
        effect: 0, mood: 'Cautious',
        log: '⚠️ At an illustrative 3.5%, the estimate is about 20.6 years. Sustained inflation can reduce what that money buys.',
        type: 'bad',
        tip: '72 ÷ 3.5% ≈ 20.6 years. Compare the return with inflation; both rates can change over time.'
      },
      {
        text: '🎮 Spend it on a gaming subscription + food — YOLO',
        effect: -2000, mood: 'Regretful',
        log: '❌ Spent ₹2,000. That money could have doubled in 10 years at 7.2%!',
        type: 'bad',
        tip: '₹2,000 compounding at 7.2% for 30 years = ₹16,000+. Small decisions, massive impact.'
      }
    ]
  },
  {
    id: 'q_electricity',
    day: 22,
    type: 'unexpected',
    badge: '⚡ Surprise!',
    title: '⚡ Hostel Electricity Bill Shock',
    desc: 'The hostel committee issues an extra electricity bill of ₹400 due to overuse of ACs. It\'s mandatory. But you can appeal for a partial refund next month.',
    choices: [
      { text: '😤 Pay ₹400 and file appeal next month', effect: -400, mood: 'Annoyed', log: 'Paid ₹400 hostel electricity bill.', type: 'neutral' },
      { text: '🔌 Pay and reduce AC use going forward', effect: -400, mood: 'Disciplined', log: 'Paid ₹400 and committed to energy saving.', type: 'good' },
      { text: '💬 Negotiate with hostel warden (50% off)', effect: -200, mood: 'Confident', log: 'Negotiated bill down to ₹200. Nice skills!', type: 'good' }
    ]
  },
  {
    id: 'q_savings',
    day: 26,
    type: 'decision',
    badge: '💰 Day 26',
    title: 'Month End: What to do with remaining money?',
    desc: 'You\'re near the end of the month. You have some money left. Your next month\'s stipend arrives in 4 days. What do you do?',
    choices: [
      { text: '💰 Transfer ₹1,500 to savings & live lean', effect: 0,    mood: 'Disciplined', log: 'Transferred ₹1,500 to savings account!', type: 'good', save: 1500 },
      { text: '🎉 Celebrate month-end with friends', effect: -600, mood: 'Happy', log: 'Spent ₹600 on month-end celebrations.', type: 'neutral', save: 0 },
      { text: '📦 Stock up for next month (smart prep)', effect: -400, mood: 'Prepared', log: 'Spent ₹400 stocking essentials for next month.', type: 'good', save: 500 }
    ]
  }
];

// ============================================================
//  STATE
// ============================================================
let state = {
  transactions: [],
  budget:       0,
  savingsGoal:  0,
  xp:           0,
  badges:       [],
  questBest:    null,

  // quest runtime
  quest: {
    active:       false,
    balance:      8000,
    saved:        0,
    day:          1,
    mood:         'Great',
    scenarioIdx:  0,
    log:          []
  }
};

// ============================================================
//  PERSISTENCE
// ============================================================
function loadState() {
  state.transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.transactions) || '[]');
  state.budget       = parseFloat(localStorage.getItem(STORAGE_KEYS.budget)      || '0');
  state.savingsGoal  = parseFloat(localStorage.getItem(STORAGE_KEYS.savingsGoal) || '0');
  state.xp           = parseInt(localStorage.getItem(STORAGE_KEYS.xp)            || '0', 10);
  state.badges       = JSON.parse(localStorage.getItem(STORAGE_KEYS.badges)      || '[]');
  state.questBest    = JSON.parse(localStorage.getItem(STORAGE_KEYS.questBest)   || 'null');
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(state.transactions));
}

function saveMeta() {
  localStorage.setItem(STORAGE_KEYS.budget,      state.budget);
  localStorage.setItem(STORAGE_KEYS.savingsGoal, state.savingsGoal);
  localStorage.setItem(STORAGE_KEYS.xp,          state.xp);
  localStorage.setItem(STORAGE_KEYS.badges,      JSON.stringify(state.badges));
}

function saveQuestBest() {
  localStorage.setItem(STORAGE_KEYS.questBest, JSON.stringify(state.questBest));
}

// ============================================================
//  DEMO DATA SEED
// ============================================================
function thisMonthDate(day) {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), Math.min(day, 28));
  return d.toISOString().split('T')[0];
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeDemoTransactions() {
  return [
    { id: uid(), type: 'income',  title: 'Monthly Stipend',        amount: 12000, category: 'Salary',        date: thisMonthDate(1)  },
    { id: uid(), type: 'income',  title: 'Freelance Logo Design',  amount: 2500,  category: 'Freelance',     date: thisMonthDate(8)  },
    { id: uid(), type: 'expense', title: 'Hostel Rent',            amount: 4500,  category: 'Rent',          date: thisMonthDate(2)  },
    { id: uid(), type: 'expense', title: 'Grocery & Mess',         amount: 2200,  category: 'Food',          date: thisMonthDate(6)  },
    { id: uid(), type: 'expense', title: 'Metro Card Recharge',    amount: 500,   category: 'Transport',     date: thisMonthDate(3)  },
    { id: uid(), type: 'expense', title: 'Course Books',           amount: 850,   category: 'Education',     date: thisMonthDate(10) },
    { id: uid(), type: 'expense', title: 'Netflix + Hotstar',      amount: 399,   category: 'Entertainment', date: thisMonthDate(5)  },
    { id: uid(), type: 'expense', title: 'Doctor Visit',           amount: 300,   category: 'Health',        date: thisMonthDate(12) },
    { id: uid(), type: 'income',  title: 'Gift from Parents',      amount: 1000,  category: 'Gift',          date: thisMonthDate(15) },
    { id: uid(), type: 'expense', title: 'New Sneakers',           amount: 1800,  category: 'Shopping',      date: thisMonthDate(18) },
  ];
}

function seedDemoData() {
  state.transactions = makeDemoTransactions();
  state.budget       = 10000;
  state.savingsGoal  = 5000;
  state.xp           = 0;
  state.badges       = [];
  saveTransactions();
  saveMeta();
  localStorage.setItem(STORAGE_KEYS.seeded, '1');
}

// ============================================================
//  CALCULATIONS
// ============================================================
function calcTotals() {
  let income = 0, expenses = 0;
  const currentMonth = new Date().getMonth();
  const currentYear  = new Date().getFullYear();
  let monthExpenses  = 0;

  for (const t of state.transactions) {
    if (t.type === 'income')  income   += t.amount;
    if (t.type === 'expense') expenses += t.amount;

    if (t.type === 'expense') {
      const d = new Date(t.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        monthExpenses += t.amount;
      }
    }
  }

  return { income, expenses, balance: income - expenses, monthExpenses };
}

function calcExpenseByCategory() {
  const cats = {};
  for (const t of state.transactions) {
    if (t.type === 'expense') {
      cats[t.category] = (cats[t.category] || 0) + t.amount;
    }
  }
  return cats;
}

// ============================================================
//  CHART
// ============================================================
let chartCanvas = null;

function drawPieChart(cats) {
  const canvas = document.getElementById('expense-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const total   = entries.reduce((s, e) => s + e[1], 0);

  if (total === 0) {
    ctx.fillStyle = '#4a5568';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('No expense data yet', W / 2, H / 2);

    const legend = document.getElementById('chart-legend');
    if (legend) legend.innerHTML = '';
    return;
  }

  const cx = W / 2, cy = H / 2;
  const r  = Math.min(cx, cy) - 10;
  let start = -Math.PI / 2;

  entries.forEach(([cat, val], i) => {
    const slice = (val / total) * 2 * Math.PI;
    const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // thin separator
    ctx.strokeStyle = '#0a1628';
    ctx.lineWidth = 2;
    ctx.stroke();

    start += slice;
  });

  // center hole (donut)
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.52, 0, 2 * Math.PI);
  ctx.fillStyle = '#112240';
  ctx.fill();

  // center text
  ctx.fillStyle = '#e8f0fe';
  ctx.font = 'bold 13px Space Grotesk';
  ctx.textAlign = 'center';
  ctx.fillText('Total', cx, cy - 8);
  ctx.font = 'bold 15px Space Grotesk';
  ctx.fillStyle = '#00d4aa';
  ctx.fillText(formatCurrency(total), cx, cy + 12);

  // Legend
  const legend = document.getElementById('chart-legend');
  if (legend) {
    legend.innerHTML = entries.map(([cat, val], i) => {
      const pct = ((val / total) * 100).toFixed(1);
      const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
      return `<div class="legend-item">
        <div class="legend-dot" style="background:${color}"></div>
        <span>${CATEGORY_ICONS[cat] || '📦'} ${cat}</span>
        <span style="color:var(--text-primary);font-weight:600;margin-left:4px;">${pct}%</span>
      </div>`;
    }).join('');
  }
}

// ============================================================
//  INSIGHTS
// ============================================================
function generateInsights(totals, cats) {
  const list = document.getElementById('insights-list');
  if (!list) return;
  const insights = [];

  if (totals.income === 0) {
    list.innerHTML = '<p class="empty-msg">Add income & expense transactions to see insights!</p>';
    return;
  }

  const savingsRate = totals.income > 0 ? ((totals.income - totals.expenses) / totals.income) * 100 : 0;

  if (savingsRate >= 20)
    insights.push({ icon: '🌟', text: `Great job! You're saving <strong>${savingsRate.toFixed(1)}%</strong> of your income. Keep it up!` });
  else if (savingsRate > 0)
    insights.push({ icon: '⚠️', text: `Your savings rate is <strong>${savingsRate.toFixed(1)}%</strong>. Aim for at least 20% to build a healthy fund.` });
  else
    insights.push({ icon: '🚨', text: `You're spending more than you earn! Cut back on non-essentials immediately.` });

  // Biggest expense
  const catEntries = Object.entries(cats);
  if (catEntries.length > 0) {
    catEntries.sort((a, b) => b[1] - a[1]);
    const [topCat, topAmt] = catEntries[0];
    const topPct = ((topAmt / totals.expenses) * 100).toFixed(0);
    insights.push({ icon: CATEGORY_ICONS[topCat] || '📦', text: `Your biggest expense is <strong>${topCat}</strong> at ${formatCurrency(topAmt)} (${topPct}% of total expenses).` });
  }

  // Budget check
  if (state.budget > 0) {
    const used = (totals.monthExpenses / state.budget) * 100;
    if (used > 90)
      insights.push({ icon: '🔴', text: `You've used <strong>${used.toFixed(0)}%</strong> of your monthly budget. Slow down!` });
    else if (used > 70)
      insights.push({ icon: '🟡', text: `You've used <strong>${used.toFixed(0)}%</strong> of your budget this month.` });
    else
      insights.push({ icon: '🟢', text: `Budget tracking is on! You've used ${used.toFixed(0)}% of your ${formatCurrency(state.budget)} budget.` });
  }

  // Savings goal
  if (state.savingsGoal > 0) {
    const bal = totals.balance;
    const pct = Math.min((bal / state.savingsGoal) * 100, 100).toFixed(0);
    insights.push({ icon: '🎯', text: `You're at <strong>${pct}%</strong> of your ${formatCurrency(state.savingsGoal)} savings goal.` });
  }

  list.innerHTML = insights.map(ins =>
    `<div class="insight-item">
      <span class="insight-icon">${ins.icon}</span>
      <span>${ins.text}</span>
    </div>`
  ).join('');
}

// ============================================================
//  DASHBOARD RENDER
// ============================================================
function renderDashboard() {
  const totals = calcTotals();
  const cats   = calcExpenseByCategory();

  // Stats
  setEl('stat-balance',      formatCurrency(totals.balance));
  setEl('stat-income',       formatCurrency(totals.income));
  setEl('stat-expenses',     formatCurrency(totals.expenses));
  const savingsRate = totals.income > 0 ? ((totals.income - totals.expenses) / totals.income * 100).toFixed(1) : 0;
  setEl('stat-savings-rate', `${savingsRate}%`);

  // Budget Progress
  if (state.budget > 0) {
    const pct = Math.min((totals.monthExpenses / state.budget) * 100, 100);
    const bar = document.getElementById('budget-progress-bar');
    bar.style.width = pct + '%';
    bar.className   = 'progress-bar ' + (pct > 90 ? 'danger' : pct > 70 ? 'warning' : '');
    setEl('budget-spent-label', `Spent: ${formatCurrency(totals.monthExpenses)}`);
    setEl('budget-limit-label', `Limit: ${formatCurrency(state.budget)}`);
    const remaining = state.budget - totals.monthExpenses;
    setEl('budget-note', remaining >= 0
      ? `${formatCurrency(remaining)} remaining this month`
      : `Over budget by ${formatCurrency(Math.abs(remaining))}!`);
  } else {
    setEl('budget-spent-label', 'Spent: —');
    setEl('budget-limit-label', 'Limit: not set');
    document.getElementById('budget-progress-bar').style.width = '0%';
    setEl('budget-note', 'Click "Edit Budget" to set your monthly limit.');
  }

  // Savings Ring
  const balance = totals.balance;
  if (state.savingsGoal > 0) {
    const pct     = Math.min(balance / state.savingsGoal, 1);
    const offset  = 314 - pct * 314;
    const ring    = document.getElementById('savings-ring');
    ring.setAttribute('stroke-dashoffset', offset);
    setEl('savings-percent',  `${Math.round(pct * 100)}%`);
    setEl('savings-saved',    formatCurrency(balance));
    setEl('savings-goal-amount', formatCurrency(state.savingsGoal));
    setEl('savings-remaining', pct < 1
      ? formatCurrency(state.savingsGoal - balance)
      : '✅ Goal reached!');

    if (pct >= 1) awardBadge('goal_reached');
  } else {
    const ring = document.getElementById('savings-ring');
    ring.setAttribute('stroke-dashoffset', '314');
    setEl('savings-percent',   '—');
    setEl('savings-saved',     formatCurrency(balance));
    setEl('savings-goal-amount', 'Not set');
    setEl('savings-remaining', '—');
  }

  // XP
  setEl('xp-value', state.xp);
  setEl('mobile-xp-display', `⭐ ${state.xp} XP`);

  // Chart
  drawPieChart(cats);

  // Insights
  generateInsights(totals, cats);
}

// ============================================================
//  TRANSACTIONS RENDER
// ============================================================
function renderTransactions(filter = 'all', search = '') {
  const list = document.getElementById('transactions-list');
  if (!list) return;

  let txns = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (filter !== 'all') txns = txns.filter(t => t.type === filter);
  if (search) {
    const q = search.toLowerCase();
    txns = txns.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }

  if (txns.length === 0) {
    list.innerHTML = '<p class="empty-msg">No transactions found.</p>';
    return;
  }

  list.innerHTML = txns.map(t => {
    const icon  = CATEGORY_ICONS[t.category] || '📦';
    const sign  = t.type === 'income' ? '+' : '-';
    const dFmt  = new Date(t.date + 'T00:00:00').toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    return `
    <div class="txn-item" id="txn-${t.id}">
      <div class="txn-icon ${t.type}">${icon}</div>
      <div class="txn-body">
        <div class="txn-title">${escHtml(t.title)}</div>
        <div class="txn-meta">${t.category} · ${dFmt}</div>
      </div>
      <div class="txn-amount ${t.type}">${sign}${formatCurrency(t.amount)}</div>
      <button class="txn-delete" onclick="deleteTransaction('${t.id}')" title="Delete">🗑️</button>
    </div>`;
  }).join('');
}

function deleteTransaction(id) {
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveTransactions();
  renderAll();
  showToast('Transaction deleted', 'info');
}

// ============================================================
//  ADD TRANSACTION
// ============================================================
function saveTransaction() {
  const type     = document.getElementById('txn-type').value;
  const title    = document.getElementById('txn-title').value.trim();
  const amtRaw   = parseFloat(document.getElementById('txn-amount').value);
  const category = document.getElementById('txn-category').value;
  const date     = document.getElementById('txn-date').value;
  const errEl    = document.getElementById('txn-error');

  errEl.style.display = 'none';

  if (!title)           return showError(errEl, 'Please enter a title.');
  if (isNaN(amtRaw) || amtRaw <= 0) return showError(errEl, 'Amount must be a positive number.');
  if (!date)            return showError(errEl, 'Please select a date.');

  const txn = { id: uid(), type, title, amount: amtRaw, category, date };
  state.transactions.push(txn);
  saveTransactions();

  // Close form & reset
  document.getElementById('add-transaction-form').style.display = 'none';
  document.getElementById('txn-title').value  = '';
  document.getElementById('txn-amount').value = '';
  document.getElementById('txn-date').value   = todayStr();

  // Badges
  awardBadge('first_txn');
  if (state.transactions.length >= 10) awardBadge('ten_txns');

  renderAll();
  showToast(`Transaction added! ${type === 'income' ? '📈' : '📉'}`, 'success');
}

// ============================================================
//  BUDGET / GOAL FORMS
// ============================================================
function saveBudget() {
  const val = parseFloat(document.getElementById('budget-input').value);
  if (isNaN(val) || val <= 0) { showToast('Enter a valid budget amount.', 'error'); return; }
  state.budget = val;
  saveMeta();
  document.getElementById('budget-form').style.display = 'none';
  document.getElementById('budget-input').value = '';
  awardBadge('budget_set');
  renderAll();
  showToast(`Monthly budget set to ${formatCurrency(val)}`, 'success');
}

function saveGoal() {
  const val = parseFloat(document.getElementById('goal-input').value);
  if (isNaN(val) || val <= 0) { showToast('Enter a valid savings goal.', 'error'); return; }
  state.savingsGoal = val;
  saveMeta();
  document.getElementById('goal-form').style.display = 'none';
  document.getElementById('goal-input').value = '';
  awardBadge('goal_set');
  renderAll();
  showToast(`Savings goal set to ${formatCurrency(val)}`, 'success');
}

// ============================================================
//  QUEST MODE
// ============================================================
function startQuest() {
  state.quest = { active: true, balance: 8000, saved: 0, day: 1, mood: 'Great', scenarioIdx: 0, log: [] };
  document.getElementById('quest-lobby').style.display = 'none';
  document.getElementById('quest-game').style.display  = 'block';
  document.getElementById('quest-end').style.display   = 'none';
  updateQuestHUD();
  renderScenario();
}

function updateQuestHUD() {
  const q = state.quest;
  setEl('q-balance', formatCurrency(q.balance));
  setEl('q-day',     `${q.day} / 30`);
  setEl('q-mood',    q.mood);
  setEl('q-saved',   formatCurrency(q.saved));
}

function renderScenario() {
  const q    = state.quest;
  const sc   = QUEST_SCENARIOS[q.scenarioIdx];

  if (!sc) {
    endQuest();
    return;
  }

  setEl('scenario-badge', sc.badge);
  setEl('scenario-title', sc.title);
  setEl('scenario-desc',  sc.desc);
  const scenarioBadge = document.getElementById('scenario-badge');
  scenarioBadge.classList.toggle('knowledge', sc.type === 'knowledge');
  document.getElementById('scenario-knowledge').hidden = !sc.r72hint;

  const choicesEl = document.getElementById('scenario-choices');
  choicesEl.innerHTML = sc.choices.map((ch, i) => {
    const costLabel = ch.effect !== 0
      ? `<span class="choice-cost ${ch.effect < 0 ? 'negative' : ''}">${ch.effect < 0 ? '-' : '+'}${formatCurrency(Math.abs(ch.effect))}</span>`
      : `<span class="choice-cost">Free</span>`;
    return `<button class="choice-btn" onclick="makeChoice(${i})">${ch.text}${costLabel}</button>`;
  }).join('');
}

function makeChoice(idx) {
  const q  = state.quest;
  const sc = QUEST_SCENARIOS[q.scenarioIdx];
  const ch = sc.choices[idx];

  q.balance += ch.effect;
  if (ch.save) q.saved += ch.save;
  q.mood     = ch.mood;
  q.day      = sc.day;

  // Guard against going below 0
  if (q.balance < 0) {
    q.balance = 0;
    addQuestLog(`You ran out of money! Balance forced to ₹0.`, 'bad');
  }

  addQuestLog(ch.log, ch.type);

  // The Rule of 72 lesson rewards the choice that applies the estimate thoughtfully.
  if (ch.rule72badge) awardBadge('rule72_quest');
  if (ch.tip) {
    // Show tip as a special knowledge log entry
    const logEl = document.getElementById('quest-log');
    const tipEl = document.createElement('p');
    tipEl.className = 'log-entry event';
    tipEl.textContent = '💡 ' + ch.tip;
    logEl.prepend(tipEl);
  }

  updateQuestHUD();

  q.scenarioIdx++;
  if (q.scenarioIdx >= QUEST_SCENARIOS.length) {
    endQuest();
  } else {
    renderScenario();
  }
}

function addQuestLog(msg, type = 'neutral') {
  const logEl = document.getElementById('quest-log');
  const entry = document.createElement('p');
  entry.className = `log-entry ${type === 'good' ? 'good' : type === 'bad' ? 'bad' : type === 'event' ? 'event' : ''}`;
  entry.textContent = msg;
  logEl.prepend(entry);
  // Keep only last 20 entries visible
  const entries = logEl.querySelectorAll('.log-entry');
  if (entries.length > 20) entries[entries.length - 1].remove();
}

function endQuest() {
  const q = state.quest;
  q.active = false;

  document.getElementById('quest-game').style.display = 'none';
  document.getElementById('quest-end').style.display  = 'flex';

  let xpEarned = 30;
  let endingTitle, endingDesc, endIcon;
  const endTips = [
    '💡 Tip: Saving even ₹500/month compounds into significant wealth over years.',
    '💡 Tip: An emergency fund of 3 months\' expenses protects you from unexpected bills.',
    '💡 Tip: Track every rupee — awareness is the first step to financial freedom.',
  ];

  if (q.balance >= 5000) {
    endingTitle = '🌟 Perfect Semester!';
    endingDesc  = `Incredible! You ended with ${formatCurrency(q.balance)}. Your financial discipline paid off massively!`;
    endIcon     = '🌟';
    xpEarned    = 100;
    awardBadge('quest_perfect');
  } else if (q.balance >= 2000) {
    endingTitle = '🏆 Quest Complete — Well Done!';
    endingDesc  = `You survived the month with ${formatCurrency(q.balance)} remaining. Solid budgeting skills!`;
    endIcon     = '🏆';
    xpEarned    = 60;
  } else if (q.balance >= 500) {
    endingTitle = '😅 Survived — Barely!';
    endingDesc  = `Phew! You made it through with ${formatCurrency(q.balance)} left. A few better choices next time could make a big difference.`;
    endIcon     = '😅';
    xpEarned    = 40;
  } else {
    endingTitle = '😰 Broke at Month End!';
    endingDesc  = `You ended with only ${formatCurrency(q.balance)}. Financial planning is a skill — keep practising!`;
    endIcon     = '😰';
    xpEarned    = 20;
  }

  if (q.saved >= 1500) { awardBadge('quest_saved'); xpEarned += 20; }
  awardBadge('quest_done');

  setEl('end-icon',    endIcon);
  setEl('end-title',   endingTitle);
  setEl('end-desc',    endingDesc);
  setEl('end-balance', formatCurrency(q.balance));
  setEl('end-saved',   formatCurrency(q.saved));
  setEl('end-xp',      `+${xpEarned} XP`);
  setEl('end-tip',     endTips[Math.floor(Math.random() * endTips.length)]);

  // Award XP
  state.xp += xpEarned;
  saveMeta();

  // Best score
  if (!state.questBest || q.balance > state.questBest.balance) {
    state.questBest = { balance: q.balance, saved: q.saved, xp: xpEarned };
    saveQuestBest();
  }

  renderRewards();
  renderDashboard();
}

// ============================================================
//  RULE OF 72 CALCULATOR
// ============================================================
function calcRule72() {
  const amtRaw  = parseFloat(document.getElementById('r72-amount').value);
  const rateRaw = parseFloat(document.getElementById('r72-rate').value);

  if (isNaN(amtRaw) || amtRaw <= 0) { showToast('Enter a valid principal amount.', 'error'); return; }
  if (isNaN(rateRaw) || rateRaw <= 0) { showToast('Enter a valid interest rate (> 0).', 'error'); return; }
  if (rateRaw >= 100) { showToast('Rate must be less than 100%.', 'error'); return; }

  const yearsDouble  = parseFloat((72 / rateRaw).toFixed(1));
  const yearsTriple  = parseFloat((Math.log(3) / Math.log(1 + rateRaw / 100)).toFixed(1));
  const yearsTenfold = parseFloat((Math.log(10) / Math.log(1 + rateRaw / 100)).toFixed(1));
  const doubledAmt   = amtRaw * 2;

  setEl('r72-years',   yearsDouble + ' years');
  setEl('r72-doubled', formatCurrency(doubledAmt));
  setEl('r72-tripled', yearsTriple + ' years');
  setEl('r72-tenfold', yearsTenfold + ' years');

  // Visual timeline — show up to 4 doublings
  const timelineEl = document.getElementById('r72-timeline');
  let timelineHTML = '<div class="r72-tl-title">📈 Your Money Growth Timeline</div>';
  timelineHTML += '<div class="r72-tl-bars">';
  const doublings = Math.min(4, Math.floor(120 / yearsDouble));
  for (let i = 0; i <= doublings; i++) {
    const yr    = Math.round(yearsDouble * i);
    const value = amtRaw * Math.pow(2, i);
    const width = Math.max(8, Math.min(100, (i / (doublings || 1)) * 100));
    const label = i === 0 ? 'Now' : `${yr} yr${yr > 1 ? 's' : ''}`;
    timelineHTML += `
      <div class="r72-tl-row">
        <span class="r72-tl-year">${label}</span>
        <div class="r72-tl-bar-wrap">
          <div class="r72-tl-bar" style="width:${width}%" data-value="${formatCurrency(value)}"></div>
        </div>
        <span class="r72-tl-val">${formatCurrency(value)}</span>
      </div>`;
  }
  timelineHTML += '</div>';
  timelineEl.innerHTML = timelineHTML;

  // Inflation warning
  const inflationYrs = parseFloat((72 / 6).toFixed(1));
  const inflNote = document.getElementById('r72-inflation-note');
  if (rateRaw < 6) {
    inflNote.innerHTML = `⚠️ <strong>Inflation Warning:</strong> At ${rateRaw}%, your money doubles in <strong>${yearsDouble} years</strong> — but inflation (~6%) halves the purchasing power of idle money every <strong>${inflationYrs} years</strong>. You're losing real value!`;
    inflNote.className = 'r72-inflation-note danger';
  } else if (rateRaw >= 6 && rateRaw < 8) {
    inflNote.innerHTML = `🟡 <strong>Just beating inflation:</strong> At ${rateRaw}%, you're barely ahead of inflation (~6%). Your money doubles in <strong>${yearsDouble} years</strong>. Consider higher-return options for long-term goals.`;
    inflNote.className = 'r72-inflation-note warning';
  } else {
    inflNote.innerHTML = `✅ <strong>Good return!</strong> At ${rateRaw}%, your money doubles every <strong>${yearsDouble} years</strong> — comfortably beating typical inflation. Compound interest is working for you!`;
    inflNote.className = 'r72-inflation-note success';
  }

  document.getElementById('rule72-result').style.display = 'block';

  // Award badge
  awardBadge('rule72_used');
  saveMeta();
  showToast(`⚡ Rule of 72: money doubles in ${yearsDouble} years at ${rateRaw}%!`, 'success');
}

function replayQuest() {
  document.getElementById('quest-end').style.display   = 'none';
  document.getElementById('quest-game').style.display  = 'none';
  document.getElementById('quest-lobby').style.display = '';   // let CSS flex rule apply
  const bestEl = document.getElementById('quest-best-score');
  if (state.questBest) {
    bestEl.style.display = 'block';
    bestEl.textContent   = `🏅 Best run: ${formatCurrency(state.questBest.balance)} balance, ${formatCurrency(state.questBest.saved)} saved`;
  }
}

// ============================================================
//  WHAT IF SIMULATOR
// ============================================================
function compareWhatIf() {
  const totals = calcTotals();
  const base   = totals.balance;

  const aName    = document.getElementById('wi-a-name').value.trim() || 'Option A';
  const aCost    = parseFloat(document.getElementById('wi-a-cost').value)    || 0;
  const aMonthly = parseFloat(document.getElementById('wi-a-monthly').value) || 0;
  const aMonths  = parseInt(document.getElementById('wi-a-months').value, 10) || 1;

  const bName    = document.getElementById('wi-b-name').value.trim() || 'Option B';
  const bCost    = parseFloat(document.getElementById('wi-b-cost').value)    || 0;
  const bMonthly = parseFloat(document.getElementById('wi-b-monthly').value) || 0;
  const bMonths  = parseInt(document.getElementById('wi-b-months').value, 10) || 1;

  if (aCost < 0 || aMonthly < 0 || bCost < 0 || bMonthly < 0) {
    showToast('Please enter non-negative values.', 'error');
    return;
  }

  const aTotalCost = aCost + aMonthly * aMonths;
  const bTotalCost = bCost + bMonthly * bMonths;

  const aRemaining = base - aTotalCost;
  const bRemaining = base - bTotalCost;

  // Render results
  showWiResult('wi-result-a', aName, aCost, aMonthly, aMonths, aTotalCost, aRemaining);
  showWiResult('wi-result-b', bName, bCost, bMonthly, bMonths, bTotalCost, bRemaining);

  // Verdict
  const verdictEl = document.getElementById('wi-verdict');
  const verdictTxt = document.getElementById('wi-verdict-text');
  verdictEl.style.display = 'block';

  const diff = Math.abs(aTotalCost - bTotalCost);
  const cheaper = aTotalCost <= bTotalCost ? aName : bName;
  const pricier  = aTotalCost > bTotalCost ? aName : bName;

  let verdict = `<div class="verdict-content">`;
  verdict += `<p>📊 <strong>${aName}</strong> costs a total of <strong>${formatCurrency(aTotalCost)}</strong> over ${aMonths} month${aMonths > 1 ? 's' : ''}.</p>`;
  verdict += `<p>📊 <strong>${bName}</strong> costs a total of <strong>${formatCurrency(bTotalCost)}</strong> over ${bMonths} month${bMonths > 1 ? 's' : ''}.</p>`;
  verdict += `<br/><p>💡 <span class="verdict-winner">${cheaper}</span> is the more affordable choice — saving you <strong>${formatCurrency(diff)}</strong> compared to ${pricier}.</p>`;

  if (aRemaining < 0 || bRemaining < 0) {
    const negative = aRemaining < 0 ? aName : bName;
    verdict += `<p style="color:var(--accent-red);margin-top:8px;">⚠️ <strong>${negative}</strong> would put you in a deficit. Reconsider before choosing it.</p>`;
  }

  verdict += `<p style="margin-top:10px;font-style:italic;color:var(--text-muted);">⚠️ Note: These are educational estimates only. Real costs may vary. This is not financial advice.</p>`;
  verdict += `</div>`;
  verdictTxt.innerHTML = verdict;

  awardBadge('whatif_used');
  saveMeta();
  showToast('Comparison ready! 📊', 'success');
}

function showWiResult(elId, name, one, monthly, months, total, remaining) {
  const el = document.getElementById(elId);
  el.style.display = 'block';
  el.innerHTML = `
    <div class="result-row"><span class="result-label">One-time cost</span><span class="result-value">${formatCurrency(one)}</span></div>
    <div class="result-row"><span class="result-label">Monthly × ${months}</span><span class="result-value">${formatCurrency(monthly)} × ${months}</span></div>
    <div class="result-row"><span class="result-label">Total cost</span><span class="result-value" style="color:var(--accent-red);">${formatCurrency(total)}</span></div>
    <div class="result-row"><span class="result-label">Balance after</span><span class="result-value" style="color:${remaining >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">${formatCurrency(remaining)}</span></div>
  `;
}

function loadPreset(idx) {
  const p = WI_PRESETS[idx];
  if (!p) return;
  document.getElementById('wi-a-name').value    = p.aName;
  document.getElementById('wi-a-cost').value    = p.aCost;
  document.getElementById('wi-a-monthly').value = p.aMonthly;
  document.getElementById('wi-a-months').value  = p.aMonths;
  document.getElementById('wi-b-name').value    = p.bName;
  document.getElementById('wi-b-cost').value    = p.bCost;
  document.getElementById('wi-b-monthly').value = p.bMonthly;
  document.getElementById('wi-b-months').value  = p.bMonths;
  document.getElementById('wi-result-a').style.display = 'none';
  document.getElementById('wi-result-b').style.display = 'none';
  document.getElementById('wi-verdict').style.display  = 'none';
}

function clearWhatIf() {
  ['wi-a-name','wi-a-cost','wi-a-monthly','wi-b-name','wi-b-cost','wi-b-monthly'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('wi-a-months').value = 1;
  document.getElementById('wi-b-months').value = 1;
  document.getElementById('wi-result-a').style.display = 'none';
  document.getElementById('wi-result-b').style.display = 'none';
  document.getElementById('wi-verdict').style.display  = 'none';
}

// ============================================================
//  REWARDS RENDER
// ============================================================
function renderRewards() {
  const xp = state.xp;

  setEl('rewards-xp', xp);
  setEl('xp-value',   xp);
  setEl('mobile-xp-display', `⭐ ${xp} XP`);

  // Level
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }

  const nextThresh = LEVEL_THRESHOLDS[level] ?? null;
  const prevThresh = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const pct        = nextThresh
    ? Math.min(((xp - prevThresh) / (nextThresh - prevThresh)) * 100, 100)
    : 100;

  setEl('level-badge',      `Level ${level}`);
  setEl('level-xp-label',   `${xp} XP`);
  setEl('level-next-label', nextThresh ? `${nextThresh - xp} XP to Level ${level + 1}` : 'Max Level!');
  document.getElementById('level-progress-bar').style.width = pct + '%';

  // Badges
  const grid = document.getElementById('badges-grid');
  if (grid) {
    grid.innerHTML = ALL_BADGES.map(b => {
      const earned = state.badges.includes(b.id);
      return `<div class="badge-item ${earned ? 'earned' : 'locked'}">
        <span class="badge-emoji">${b.emoji}</span>
        <span class="badge-name">${b.name}</span>
        <span class="badge-desc">${earned ? b.desc : '🔒 ' + b.desc}</span>
      </div>`;
    }).join('');
  }
}

function awardBadge(id) {
  if (state.badges.includes(id)) return;
  const badge = ALL_BADGES.find(b => b.id === id);
  if (!badge) return;
  state.badges.push(id);
  state.xp += badge.xp;
  saveMeta();
  showToast(`🏅 Badge unlocked: "${badge.name}" +${badge.xp} XP!`, 'success');
  renderRewards();
}

// ============================================================
//  NAVIGATION
// ============================================================
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById(`page-${page}`);
  const navEl  = document.getElementById(`nav-${page}`);
  if (pageEl) pageEl.classList.add('active');
  if (navEl)  navEl.classList.add('active');

  // Refresh current page data
  if (page === 'dashboard')    renderDashboard();
  if (page === 'my-money')     renderTransactions(currentFilter, document.getElementById('filter-search')?.value || '');
  if (page === 'whatif')       setEl('wi-current-balance', formatCurrency(calcTotals().balance));
  if (page === 'rewards')      renderRewards();

  // Mobile: close sidebar
  closeMobileSidebar();
}

// ============================================================
//  MOBILE SIDEBAR
// ============================================================
function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('mobile-nav-overlay').classList.remove('active');
}

function toggleMobileSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
  document.getElementById('mobile-nav-overlay').classList.toggle('active');
}

// ============================================================
//  UTILITIES
// ============================================================
function formatCurrency(val) {
  if (typeof val !== 'number') val = parseFloat(val) || 0;
  return '₹' + val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function showError(el, msg) {
  el.textContent    = '⚠️ ' + msg;
  el.style.display  = 'block';
}

let toastTimer = null;
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className   = `toast ${type} show`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3200);
}

function renderAll() {
  renderDashboard();
  renderTransactions(currentFilter, document.getElementById('filter-search')?.value || '');
  renderRewards();
  setEl('wi-current-balance', formatCurrency(calcTotals().balance));
}

// ============================================================
//  RESET
// ============================================================
function resetToDemo() {
  if (!confirm('This will delete all your current data and load the demo data. Continue?')) return;
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  seedDemoData();
  loadState();
  renderAll();
  showToast('Demo data loaded! 🎉', 'success');
}

// ============================================================
//  EVENT LISTENERS SETUP
// ============================================================
let currentFilter = 'all';

function bindEvents() {
  // Nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // Mobile
  document.getElementById('hamburger').addEventListener('click', toggleMobileSidebar);
  document.getElementById('mobile-nav-overlay').addEventListener('click', closeMobileSidebar);

  // Dashboard
  document.getElementById('btn-set-budget').addEventListener('click', () => {
    const f = document.getElementById('budget-form');
    f.style.display = f.style.display === 'none' ? '' : 'none';
  });
  document.getElementById('btn-save-budget').addEventListener('click', saveBudget);
  document.getElementById('btn-cancel-budget').addEventListener('click', () => {
    document.getElementById('budget-form').style.display = 'none';
  });

  document.getElementById('btn-set-goal').addEventListener('click', () => {
    const f = document.getElementById('goal-form');
    f.style.display = f.style.display === 'none' ? '' : 'none';
  });
  document.getElementById('btn-save-goal').addEventListener('click', saveGoal);
  document.getElementById('btn-cancel-goal').addEventListener('click', () => {
    document.getElementById('goal-form').style.display = 'none';
  });

  // My Money
  document.getElementById('btn-add-transaction').addEventListener('click', () => {
    const f = document.getElementById('add-transaction-form');
    f.style.display = f.style.display === 'none' ? 'block' : 'none';
    document.getElementById('txn-date').value = todayStr();
  });
  document.getElementById('btn-save-txn').addEventListener('click', saveTransaction);
  document.getElementById('btn-cancel-txn').addEventListener('click', () => {
    document.getElementById('add-transaction-form').style.display = 'none';
    document.getElementById('txn-error').style.display = 'none';
  });

  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTransactions(currentFilter, document.getElementById('filter-search').value);
    });
  });
  document.getElementById('filter-search').addEventListener('input', e => {
    renderTransactions(currentFilter, e.target.value);
  });

  // Quest
  document.getElementById('btn-start-quest').addEventListener('click', startQuest);
  document.getElementById('btn-replay-quest').addEventListener('click', replayQuest);
  document.getElementById('btn-quest-to-rewards').addEventListener('click', () => navigateTo('rewards'));

  // What If
  document.getElementById('btn-compare').addEventListener('click', compareWhatIf);
  document.getElementById('btn-clear-whatif').addEventListener('click', clearWhatIf);
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => loadPreset(parseInt(btn.dataset.preset, 10)));
  });

  // Rule of 72 calculator
  document.getElementById('btn-calc-r72').addEventListener('click', calcRule72);

  // Sync slider ↔ number input
  const slider = document.getElementById('r72-rate-slider');
  const rateNum = document.getElementById('r72-rate');
  slider.addEventListener('input', () => {
    rateNum.value = slider.value;
    // Auto-recalculate if result already visible
    if (document.getElementById('rule72-result').style.display !== 'none') calcRule72();
  });
  rateNum.addEventListener('input', () => {
    const v = parseFloat(rateNum.value);
    if (!isNaN(v) && v >= 1 && v <= 30) slider.value = v;
    if (document.getElementById('rule72-result').style.display !== 'none') calcRule72();
  });
  rateNum.addEventListener('keydown', e => { if (e.key === 'Enter') calcRule72(); });

  // Reset
  document.getElementById('btn-reset-data').addEventListener('click', resetToDemo);

  // Enter key in budget/goal inputs
  document.getElementById('budget-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveBudget(); });
  document.getElementById('goal-input').addEventListener('keydown',   e => { if (e.key === 'Enter') saveGoal(); });
}

// ============================================================
//  INIT
// ============================================================
function init() {
  loadState();

  // Seed demo data on first run
  if (!localStorage.getItem(STORAGE_KEYS.seeded)) {
    seedDemoData();
    loadState();
  }

  bindEvents();
  renderAll();

  // Show quest best score if exists
  if (state.questBest) {
    const bestEl = document.getElementById('quest-best-score');
    if (bestEl) {
      bestEl.style.display = 'block';
      bestEl.textContent   = `🏅 Best run: ${formatCurrency(state.questBest.balance)} balance, ${formatCurrency(state.questBest.saved)} saved`;
    }
  }

  // Set today's date in date input
  document.getElementById('txn-date').value = todayStr();
}

document.addEventListener('DOMContentLoaded', init);
