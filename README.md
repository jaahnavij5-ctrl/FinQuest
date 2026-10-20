# ⚔️ FinQuest — Making Finance a Quest

> A remix hackathon project transforming personal finance tracking into an interactive gamified experience.

---

## 🎯 What is FinQuest?

FinQuest turns the chore of budgeting into an adventure. It combines a real money tracker, a college-student budget quest, and a financial what-if simulator — all running locally in your browser with **zero setup, zero APIs, and zero backend**.

---

## 🔀 Original Project Attribution

This project is a **remix** of **[Budget Badger](https://github.com/nicholasgasior/budget-badger)** by Nicholas Gasior, released under the [MIT Licence](https://opensource.org/licenses/MIT).

**Original features used as a base:**
- localStorage-based transaction persistence concept
- Income / expense data model (type, amount, category, date)

**Transformations added in this remix:**
| Feature | Original | FinQuest Remix |
|---|---|---|
| Data persistence | localStorage transactions | localStorage + budget + goals + XP + badges |
| UI | Plain table list | Dark fintech UI, donut chart, progress rings |
| Gamification | None | XP system, badges, level-up progression |
| Quest Mode | None | 7-scenario college budget challenge with multiple endings |
| What If? Simulator | None | Side-by-side financial decision comparator with verdict |
| Insights | None | Dynamic financial insight cards |
| Rewards | None | 11 earnable badges with educational tips |

> **Note:** Only verified features of the original project are listed above. The gamification, quest engine, simulator, chart, and rewards system are original additions created for this remix.

---

## ✨ Features

### 1. 📊 Dashboard
- Available balance, total income, total expenses, savings rate
- Monthly budget progress bar (colour-coded: green → yellow → red)
- Savings goal ring chart with percentage
- Donut chart showing spending by category
- Auto-generated financial insights

### 2. 💰 My Money (Real Money Tracker)
- Add income or expense transactions with title, amount, category, and date
- Delete any transaction instantly
- Filter by All / Income / Expenses, plus text search
- All data saved to `localStorage` — persists after refresh
- Realistic sample data pre-loaded on first launch
- "Reset to Demo Data" button available at any time

### 3. 🎮 Quest Mode (College Budget Challenge)
- Play as a first-year college student with ₹8,000 for the month
- Navigate 7 scenarios across the month (Day 1 → Day 26)
- **Unexpected expenses** are included (cracked phone screen, surprise electricity bill)
- Includes a Rule of 72 knowledge scenario with a short lesson, a practical choice, and a Finance Scholar badge
- **Multiple endings** based on your final balance:
  - 🌟 Perfect Semester (₹5,000+)
  - 🏆 Well Done (₹2,000–₹5,000)
  - 😅 Survived Barely (₹500–₹2,000)
  - 😰 Broke at Month End (< ₹500)
- Awards XP and badges for completion
- Best score tracked and shown in the lobby
- Live quest log shows every decision made

### 4. 🤔 What If? Simulator
- Compare two financial decisions side by side
- Enter one-time cost + monthly cost × number of months for each
- See total cost, balance remaining, and plain-English verdict
- Highlights if either option puts you in deficit
- 4 pre-loaded quick scenarios (bike vs commute, coffee habit, phone repair, rent distance)
- Uses your real current balance as the base

### 5. 🏆 Rewards
- XP earned through all interactions (transactions, quests, simulator)
- 7-level progression system (Level 1 → Level 7)
- 11 earnable badges (all educational, none based on risky financial behaviour)
- Rule of 72 money-doubling calculator with a growth timeline, rate comparisons, and inflation context
- Financial tips section with core personal finance principles

---

## 🚀 How to Run

### Option 1 — Open directly (simplest)
1. Download or clone this repository
2. Double-click `index.html` to open in your browser

> ⚠️ Some browsers block localStorage when opening files directly (`file://`). If data doesn't persist, use Option 2.

### Option 2 — Local server (recommended)
If you have Node.js installed:
```bash
npx serve .
```
Then open `http://localhost:3000` in your browser.

Or with Python:
```bash
# Python 3
python -m http.server 8080
```
Then open `http://localhost:8080`.

### Option 3 — VS Code Live Server
Install the "Live Server" extension in VS Code, right-click `index.html`, and choose **Open with Live Server**.

---

## 📁 File Structure

```
FinQuest/
├── index.html      # All pages (Dashboard, My Money, Quest, What If?, Rewards)
├── style.css       # Dark fintech design system & responsive layout
├── app.js          # All application logic, state, charts, quest engine
└── README.md       # This file
```

---

## ⚙️ Technical Details

- **Stack:** Vanilla HTML + CSS + JavaScript (ES6+)
- **No build step** required
- **No external libraries** — chart drawn with native Canvas API
- **No API keys, no backend, no paid services**
- **Data storage:** Browser `localStorage` only
- **Fonts:** Google Fonts (Inter + Space Grotesk) — requires internet connection for first load; falls back to system fonts offline

---

## ⚠️ Limitations

- All financial data is stored only in your browser's localStorage — clearing browser data will erase it
- The What If? Simulator provides **educational estimates only** — real costs vary significantly
- Quest Mode uses fictional scenarios set in an Indian college context (amounts in ₹)
- No multi-user support — single browser session only
- Insights and advice are simplified educational content, **not professional financial advice**
- The savings ring chart measures balance vs goal, not actual dedicated savings

---

## ❌ What FinQuest Does NOT Do

- Connect to any bank or financial institution
- Require account credentials of any kind
- Use paid APIs or external services
- Present simulated returns as guaranteed investment outcomes
- Provide certified financial advice

---

## 📜 Disclaimer

> FinQuest is an educational tool created for a remix hackathon. All quest scenarios, simulations, and financial insights are fictional and for learning purposes only. No real financial advice is provided. Always consult a qualified financial professional for real money decisions.

---

## 🏷️ Licence

This remix project is released under the **MIT Licence**.
Original project (Budget Badger) is also MIT Licenced © Nicholas Gasior.

---

*Built with ⚔️ for a remix hackathon — making finance a quest, one decision at a time.*
