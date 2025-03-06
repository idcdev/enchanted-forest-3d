# Enchanted Forest 3D

A 3D platform game built with Three.js where players navigate through an enchanted forest, collecting magical crystals and avoiding corrupted creatures.

## Features

- 3D platformer gameplay with flying abilities
- Beautiful enchanted forest environment with trees, giant mushrooms, and magical elements
- Collectible items: magical seeds and nature crystals
- Enemies: corrupted creatures and hunters
- Special mechanics: flying with limited fuel, growing plants as platforms, controlling natural elements
- Immersive audio system with background music and sound effects
- Multiple levels with increasing difficulty
- Special platform types: moving platforms and disappearing platforms

## How to Run

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually http://localhost:5173)

## Controls

- WASD or Arrow Keys: Move
- Space: Fly (hold to activate flight)
- Shift: Sprint

## Level System

The game features multiple levels with increasing difficulty:
- **Floresta Encantada**: Easy level with basic platforms and few enemies
- **Cavernas Cristalinas**: Medium level with moving platforms and more enemies
- **Picos Flutuantes**: Hard level with disappearing platforms and many enemies

## Platform Types

- **Regular Platforms**: Static green platforms
- **Moving Platforms**: Blue platforms that move back and forth
- **Disappearing Platforms**: Red platforms that disappear and reappear periodically

## Audio System

The game features a complete audio system with:
- Background music
- Sound effects for player actions (flying, taking damage)
- Sound effects for collectibles and enemies
- UI sounds for buttons and game events

## 3D Models and Textures

The game uses:
- Simple geometric shapes for the current version
- Support for loading custom 3D models (GLTF/GLB format)
- High-quality textures for terrain and objects

## Development

This game is built using:
- Three.js for 3D rendering
- Web Audio API for sound
- Vite for bundling and development server

## Project Structure

- `src/components/` - Game components (Player, Enemy, Level, etc.)
- `src/components/platforms/` - Platform types (Platform, MovingPlatform, DisappearingPlatform)
- `src/utils/` - Utility classes (AssetLoader, InputHandler, Physics, LevelManager)
- `src/audio/` - Audio system documentation
- `src/models/` - 3D models documentation
- `src/textures/` - Textures documentation
- `public/` - Static assets (audio, models, textures) 