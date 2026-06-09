# Grocery Hunt

A browser-based 3D first-person grocery shopping game. Explore a maze-like mall, find items from your shopping list, dodge angry customers, grab power-ups, and check out with Pat before the 5-minute clock runs out.

## Play Online

**[https://annalena08.github.io/groceryhunt/](https://annalena08.github.io/groceryhunt/)**

> Enable GitHub Pages on the repo if the link is not live yet: **Settings → Pages → Deploy from branch `main` → `/ (root)`**.

## How to Run Locally

ES modules require a local server (opening `index.html` directly will not work):

```bash
npx serve .
```

Then open the URL shown (e.g. `http://localhost:3000`).

## How to Play

1. Pick a **difficulty** on the main menu and click **Start Shopping**.
2. Find every item on your **shopping list** (one per category aisle).
3. Press **E** / tap **Collect** when standing near an item on the shelf.
4. Avoid **angry customers** — they steal 10 seconds if they catch you. Face them and **yell** to scare them away (12s cooldown).
5. When all items are collected, follow the **green checkout compass** back to **Pat** at the entrance.
6. Check out to win. Going too early makes Pat angry.

### Difficulty Levels

| Mode | Items | Karens |
|------|-------|--------|
| Easy | 3 | 3 |
| Normal | 5 | 3 |
| Hard | 7 | 3 |
| Black Friday | 10 | 5 |

Timer is always **5 minutes**.

### Floor Power-Ups

Walk over glowing pickups on the floor (no button needed):

| Power-Up | Effect |
|----------|--------|
| 📢 Free Yell | Unlimited shouts for 30s |
| ❄️ Karen Freeze | Enemies frozen for 10s |
| 🧭 Item Radar | Compass to next item for 12s (points to checkout when done) |
| ⏱️ +10 Seconds | Adds 10s to the timer |

### Easter Egg

Collect items in **alphabetical order by name** for a special reaction from Pat at checkout.

## Controls

| Desktop | Mobile / Tablet |
|---------|-----------------|
| **WASD** — move | Left stick — move |
| **Mouse** — look (click to lock) | Drag right side — look |
| **E** / click — interact | **Collect** / **Yell** / **Check Out** buttons |

## Features

- Procedural 3D mall maze with 10 grocery categories
- FPS movement with collision
- Angry customer AI with scare mechanic
- Cashier checkout gate (Pat) with dialogue
- 4 difficulty modes
- Minimap with aisle labels and navigation guides
- Touch controls for phones and iPads
- Procedural footstep and alert sounds (Web Audio API)

## Tech Stack

- [Three.js](https://threejs.org/) — 3D rendering
- Procedural canvas textures and low-poly item models
- No build step — plain ES modules via import map
- Static hosting (GitHub Pages compatible)

## Project Structure

```
index.html              Entry point & UI overlays
css/style.css           HUD, menus, touch controls
js/
  main.js               Bootstrap
  Game.js               Game loop, UI, win/lose
  MallScene.js          Mall layout, shelves, collectibles
  MazeLayout.js         Maze grid & pathfinding data
  Player.js             FPS movement & collision
  EnemyManager.js       Angry customer spawning & AI
  AngryCustomer.js      Karen NPC behaviour
  PowerUpManager.js     Floor power-ups & effects
  CashierNPC.js         Checkout counter
  CashierDialogue.js    Pat's lines & easter egg
  TouchControls.js      Mobile joystick & look
  Minimap.js            Top-down maze map
  ItemDatabase.js       Categories & shopping list
  ItemFactory.js        3D item models
  AudioManager.js       Procedural sound effects
  MallConfig.js         Difficulty & tuning constants
```

## AI Tools Used

This school project was built through **human-led design and AI-assisted implementation**. The author defined the game concept, mechanics, and priorities; an AI coding assistant helped turn those into working code, docs, and iterations.

| | |
|---|---|
| **Tool** | [Cursor](https://cursor.com) — AI-powered IDE |
| **Modes used** | **Agent** (feature implementation, bug fixes), **Ask** (code exploration, review) |
| **Models** | Cursor’s built-in models, primarily **Claude** (Sonnet) and **Composer** for multi-file edits; model selection varied by task |
| **What AI helped with** | Initial Three.js scaffold, maze layout, mobile touch controls, Karen/cashier systems, power-ups, minimap, UI polish, README, and debugging from playtest feedback |
| **What the author did** | Game idea and rules, feature requests (difficulties, Pat dialogue, easter eggs, power-ups), playtesting on Android/iPad, balance tweaks, GitHub setup, and final review of all changes |

AI was used as a **pair-programming assistant**, not as an autonomous author. All gameplay decisions and acceptance of features were driven by the developer.

## Repository

[https://github.com/annalena08/groceryhunt](https://github.com/annalena08/groceryhunt)
