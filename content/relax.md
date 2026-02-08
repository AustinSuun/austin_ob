---
title: 休息一下 🎮
---

<div class="grid-container">

<a href="/games/quantum-evasion" class="game-card">
  <div class="game-icon">⚡</div>
  <h3>量子回旋</h3>
  <p>躲避红色量子流，挑战反应极限。</p>
</a>

<a href="/games/game-of-life" class="game-card">
  <div class="game-icon">🧬</div>
  <h3>生命游戏</h3>
  <p>探索细胞自动机的演化奥秘。</p>
</a>

</div>

<style>
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.game-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 30px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, background 0.2s, border-color 0.2s;
}

.game-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(41, 163, 255, 0.5);
}

.game-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

h3 {
  margin: 10px 0;
  font-size: 1.2em;
}

p {
  margin: 0;
  font-size: 0.9em;
  opacity: 0.7;
}
</style>
