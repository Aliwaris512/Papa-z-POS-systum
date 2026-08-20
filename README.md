<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:ff512f,50:dd2476,100:ff512f&height=220&section=header&text=Papa-z%20POS%20System&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Fast%20%C2%B7%20Offline-First%20%C2%B7%20Point%20of%20Sale%20for%20Small%20Kitchens&descAlignY=58&descSize=18" width="100%"/>

<a href="#">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&duration=3000&pause=800&color=FF512F&center=true&vCenter=true&width=700&lines=Built+for+Fast-Food+Shops+%26+Small+Restaurants;Offline-First+%E2%80%94+Never+Miss+an+Order;Instant+Kitchen+Tickets+%2B+Live+Sales+Records;Menu+Editing+via+Plain+JSON+Files;Runs+on+Low-Cost+Hardware" alt="Typing SVG" />
</a>

<br/>

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![JSON](https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

</div>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-2ea44f?style=flat-square" />
  <img src="https://img.shields.io/badge/offline--first-yes-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/license-add%20yours-lightgrey?style=flat-square" />
  <img src="https://img.shields.io/badge/PRs-welcome-orange?style=flat-square" />
</p>

<div align="center">
  <img src="https://github.com/user-attachments/assets/placeholder-demo.gif" width="80%" alt="demo gif — replace with your own screen recording" />
  <br/>
  <sub><i>↑ swap this GIF for a real screen recording of an order being placed → sent to kitchen → paid — <a href="https://www.screentogif.com/">ScreenToGif</a> or <a href="https://github.com/phw/peek">Peek</a> work well</i></sub>
</div>

---

## 📖 Table of Contents

<details open>
<summary>Click to expand</summary>

- [Purpose](#-purpose)
- [Tech Stack](#-tech-stack)
- [How It Works](#-how-it-works-high-level)
- [Highlights](#-highlights)
- [Quick Start](#-quick-start)
- [Menu Editing](#-menu-editing)
- [License](#-license)

</details>

---

## 🎯 Purpose

<table align="center">
<tr>
<td align="center" width="260">⚡<br/><b>Streamline Ordering</b><br/><sub>Order taking, kitchen tickets, daily reconciliation</sub></td>
<td align="center" width="260">⏱️<br/><b>Reduce Wait Times</b><br/><sub>Fewer mistakes, faster tickets</sub></td>
</tr>
</table>

---

## 🛠 Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=react,nodejs,sqlite,npm" />

</div>

| Layer | Tech |
|---|---|
| **Frontend** | React (JSX) for the renderer UI |
| **Backend** | Node.js for local API and business logic |
| **Storage** | Lightweight local storage (JSON/SQLite) for fast local operations |
| **Build** | npm for package management |

---

## ⚙️ How It Works (High Level)

```mermaid
flowchart LR
    A[Staff picks items + qty] --> B[React UI sends order]
    B --> C[Node.js Backend API]
    C --> D[(Local Storage: JSON/SQLite)]
    C --> E[Kitchen Ticket: print / display]
    C --> F[Sales Record updated]
    F -.optional.-> G[Card Integration]
```

1. Staff select items from the menu, adjust quantities, and send orders to the backend.
2. Orders are recorded locally and can be printed or displayed for the kitchen.
3. Payments update sales records immediately; card integrations can be added.

---

## ✨ Highlights

<details open>
<summary><b>📶 Offline-First</b></summary>
<br/>
Continues to accept orders when internet is unavailable.
</details>

<details open>
<summary><b>📝 Simple Menu Editing</b></summary>
<br/>
Edit the menu via JSON files for quick, no-fuss updates.
</details>

<details open>
<summary><b>🪶 Small &amp; Fast</b></summary>
<br/>
Lightweight footprint — suitable for low-cost hardware.
</details>

---

## 🚀 Quick Start

```mermaid
sequenceDiagram
    participant Dev
    participant Repo as restaurant-pos/
    Dev->>Repo: cd restaurant-pos
    Dev->>Repo: npm install
    Dev->>Repo: npm start
    Note over Repo: dev server running
    Dev->>Repo: npm run build
    Note over Repo: production build ready
```

### 1️⃣ Install dependencies

```bash
cd restaurant-pos
npm install
```

### 2️⃣ Run (development)

```bash
npm start
```

### 3️⃣ Build for production

```bash
npm run build
```

---

## 🍽 Menu Editing

Menus are plain JSON — no database migrations, no build step needed to add or reprice an item.

```json
{
  "id": "burger-classic",
  "name": "Classic Burger",
  "price": 5.99,
  "category": "Burgers",
  "available": true
}
```

Update the file, save, and the POS picks up the new menu on next load.

---

## 📸 Want More?

Want screenshots, a demo GIF, or a developer-focused technical summary? See the LinkedIn post or open an issue in the repo.

---

## 📄 License

_Add your preferred license here (e.g. MIT, Apache-2.0, GPL-3.0)._

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:dd2476,50:ff512f,100:dd2476&height=120&section=footer" width="100%"/>

<sub>Papa-z POS — built for speed in the kitchen 🍔</sub>

</div>
