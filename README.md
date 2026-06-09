# Grocery Hunt

A browser-based 3D first-person grocery shopping game. Explore a mall, find 10 items from your randomised shopping list, and beat the 5-minute clock.

## How to Play

1. Serve the project locally (required for ES modules):

```bash
npx serve .
```

Or use any static file server (`python -m http.server 8080`, VS Code Live Server, etc.).

2. Open the URL in your browser (e.g. `http://localhost:3000`).
3. Click **Start Shopping** and find all 10 items on your list.

## Controls

| Desktop | Mobile |
|---------|--------|
| **WASD** — move | Left stick — move |
| **Mouse** — look (click to lock pointer) | Drag right side — look |
| **E** or **click** — collect nearby item | **Collect** button |

## Game Rules

- You receive **10 random items**, one from each category:
  - Dairy, Meat, Vegetables, Fruits, Bakery, Staple food, Frozen, Desserts, Alcoholic beverages, Snacks
- Each category has **12 items** in the database.
- You have **5 minutes** to find every item.
- Items glow yellow on the shelf and pulse when you are close enough to collect.
- The **minimap** (bottom-right) shows aisles and nearby targets relative to your position.

## Tech Stack

- [Three.js](https://threejs.org/) — 3D rendering
- Procedural canvas textures for floor, ceiling, and walls
- Procedural 3D models for grocery items
- No build step — plain ES modules via import map

## Project Structure

```
index.html          Entry point & UI overlays
css/style.css       HUD, menus, touch controls
js/
  main.js           Bootstrap
  Game.js           Game loop, timer, win/lose
  MallScene.js      Mall layout, aisles, shelves
  Player.js         FPS movement & collision
  TouchControls.js  Mobile virtual joystick
  Minimap.js        Top-down local minimap
  ItemDatabase.js   Categories & shopping list
  ItemFactory.js    3D item models
  Textures.js       Procedural textures
```
