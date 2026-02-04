<template>
  <div id="app" class="app-container">
    <!-- Game End Modal -->
    <transition name="modal-fade">
      <div v-if="showGameEndModal" class="modal-overlay">
        <div class="game-end-modal">
          <div class="modal-emoji">{{ winner === 'White' ? '🏆' : '👑' }}</div>
          <h2 class="modal-title">{{ winner }} Wins!</h2>
          <p class="modal-message">Time's up! {{ getLoserName() }} ran out of time.</p>
          <button @click="resetGame" class="modal-btn">Play Again</button>
        </div>
      </div>
    </transition>

    <!-- Pawn Promotion Modal -->
    <transition name="modal-fade">
      <div v-if="showPromotionModal" class="modal-overlay">
        <div class="promotion-modal">
          <h2 class="modal-title">Promote Pawn</h2>
          <p class="modal-message">Choose a piece to promote your pawn to:</p>
          <div class="promotion-buttons">
            <button @click="promotePawn('queen')" class="promo-btn promo-queen">
              <span class="promo-piece">♕</span>
              <span>Queen</span>
            </button>
            <button @click="promotePawn('rook')" class="promo-btn promo-rook">
              <span class="promo-piece">♖</span>
              <span>Rook</span>
            </button>
            <button @click="promotePawn('bishop')" class="promo-btn promo-bishop">
              <span class="promo-piece">♗</span>
              <span>Bishop</span>
            </button>
            <button @click="promotePawn('knight')" class="promo-btn promo-knight">
              <span class="promo-piece">♘</span>
              <span>Knight</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Bot Move Notification -->
    <transition name="notification-slide">
      <div v-if="showBotNotification" class="bot-notification">
        <span class="notification-icon">🤖</span>
        <span class="notification-text">{{ botNotificationText }}</span>
      </div>
    </transition>

    <header class="header">
      <div class="header-top">
        <h1>♟ AUNG Chess</h1>
        <button class="hamburger" @click="menuOpen = !menuOpen" :class="{ active: menuOpen }">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
      <div class="game-info">
        <p class="current-player" :class="game.currentPlayer">
          {{ game.currentPlayer.toUpperCase() }}'s Turn
        </p>
        <div class="timer-section">
          <div class="timer white-timer" :class="{ active: game.currentPlayer === 'white' }">
            <span class="player-label">White</span>
            <span class="time" :class="{ 'time-low': game.whiteTime < 30 }">
              {{ formatTime(game.whiteTime) }}
            </span>
          </div>
          <div class="timer black-timer" :class="{ active: game.currentPlayer === 'black' }">
            <span class="player-label">Black</span>
            <span class="time" :class="{ 'time-low': game.blackTime < 30 }">
              {{ formatTime(game.blackTime) }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <main class="game-container">
      <div class="board-section">
        <ChessBoard :game="game" />
      </div>

      <!-- Hamburger Menu -->
      <transition name="menu-slide">
        <div v-if="menuOpen" class="menu-overlay" @click="menuOpen = false"></div>
      </transition>
      <transition name="menu-slide">
        <aside v-show="menuOpen || window.innerWidth > 768" class="controls-section" :class="{ open: menuOpen }">
          <div class="close-btn-mobile">
            <button v-if="menuOpen" @click="menuOpen = false" class="close-btn">✕</button>
          </div>
          
          <div class="controls">
            <button @click="resetGame" class="btn btn-reset">
              <span class="btn-icon">🔄</span> New Game
            </button>
            <button @click="toggleBotMode" class="btn" :class="botMode ? 'btn-bot-on' : 'btn-bot-off'">
              <span class="btn-icon">🤖</span> {{ botMode ? 'Bot: ON' : 'Bot: OFF' }}
            </button>
            
            <!-- Bot Difficulty Selector -->
            <div v-if="botMode" class="difficulty-selector">
              <h4>🎯 Bot Difficulty</h4>
              <div class="difficulty-buttons">
                <button 
                  @click="setBotDifficulty('easy')" 
                  class="diff-btn"
                  :class="{ active: botDifficulty === 'easy' }"
                >
                  😊 Easy
                </button>
                <button 
                  @click="setBotDifficulty('normal')" 
                  class="diff-btn"
                  :class="{ active: botDifficulty === 'normal' }"
                >
                  🤔 Normal
                </button>
                <button 
                  @click="setBotDifficulty('hard')" 
                  class="diff-btn"
                  :class="{ active: botDifficulty === 'hard' }"
                >
                  😈 Hard
                </button>
              </div>
            </div>
            
            <button @click="undoMove" class="btn btn-undo" :disabled="game.history.length === 0">
              <span class="btn-icon">↶</span> Undo
            </button>
            <div class="timer-buttons-container">
              <button v-if="!timerRunning && game.history.length > 0" @click="startTimer" class="btn btn-start">
                <span class="btn-icon">▶</span> Start
              </button>
              <button v-else-if="timerRunning" @click="stopTimer" class="btn btn-stop">
                <span class="btn-icon">⏸</span> Pause
              </button>
              <div v-else class="btn-placeholder"></div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="time-controls">
            <h4>⏱ Time Limit</h4>
            <div class="time-buttons">
              <button 
                v-for="time in timeOptions" 
                :key="time"
                @click="setTimeLimit(time)"
                class="time-btn"
                :class="{ active: game.timeLimit === time }"
              >
                {{ Math.floor(time / 60) }}m
              </button>
            </div>
          </div>

          <div class="divider"></div>

          <div class="move-history">
            <h3>📋 Move History</h3>
            <div class="history-list">
              <div v-if="game.history.length === 0" class="empty-history">
                No moves yet
              </div>
              <div v-for="(move, index) in game.history" :key="index" class="history-item">
                <span class="move-number">{{ index + 1 }}</span>
                <span class="move-coords">
                  {{ String.fromCharCode(97 + move.from.col) }}{{ 8 - move.from.row }} → {{ String.fromCharCode(97 + move.to.col) }}{{ 8 - move.to.row }}
                </span>
                <span v-if="move.captured" class="capture-indicator">⚔</span>
              </div>
            </div>
          </div>
        </aside>
      </transition>
    </main>
  </div>
</template>

<script>
import ChessBoard from './components/ChessBoard.vue'
import { ChessGame } from './utils/chessLogic'

export default {
  name: 'App',
  components: {
    ChessBoard
  },
  data() {
    return {
      game: new ChessGame(300),
      timerRunning: false,
      timeOptions: [60, 180, 300, 600, 900],
      showGameEndModal: false,
      winner: '',
      menuOpen: false,
      window: window,
      botMode: false,
      botDifficulty: 'normal', // 'easy', 'normal', 'hard'
      playingAsWhite: true,
      botThinking: false,
      showBotNotification: false,
      botNotificationText: '',
      notificationTimeout: null,
      showPromotionModal: false
    }
  },
  mounted() {
    this.$watch('game.history.length', (newVal) => {
      if (newVal === 1 && !this.timerRunning) {
        this.startTimer();
      }
      
      // Bot move after player move in bot mode
      if (this.botMode && this.game.currentPlayer !== (this.playingAsWhite ? 'white' : 'black')) {
        this.makeNextBotMove();
      }
    });

    // Watch for pending promotion
    this.$watch('game.pendingPromotion', (newVal) => {
      if (newVal) {
        this.showPromotionModal = true;
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        this.menuOpen = false;
      }
    });
  },
  methods: {
    resetGame() {
      this.game.resetGame();
      this.stopTimer();
      this.timerRunning = false;
      this.showGameEndModal = false;
      this.winner = '';
      this.menuOpen = false;
      this.$forceUpdate();
    },
    setTimeLimit(seconds) {
      this.game.timeLimit = seconds;
      this.resetGame();
    },
    startTimer() {
      if (this.timerRunning) return;
      this.timerRunning = true;
      this.game.startTimer(() => {
        this.$forceUpdate();
        if (this.game.gameStatus === 'timeout') {
          this.onGameEnd();
        }
      });
    },
    stopTimer() {
      this.timerRunning = false;
      this.game.stopTimer();
    },
    onGameEnd() {
      this.stopTimer();
      
      if (this.game.gameStatus === 'timeout') {
        this.winner = this.game.currentPlayer === 'white' ? 'Black' : 'White';
        this.showGameEndModal = true;
      }
      
      this.$forceUpdate();
    },
    getLoserName() {
      return this.game.currentPlayer === 'white' ? 'White' : 'Black';
    },
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    undoMove() {
      if (this.game.history.length === 0) return;
      
      const lastMove = this.game.history.pop();
      this.game.board[lastMove.from.row][lastMove.from.col] = 
        this.game.board[lastMove.to.row][lastMove.to.col];
      this.game.board[lastMove.to.row][lastMove.to.col] = lastMove.captured;
      
      this.game.currentPlayer = this.game.currentPlayer === 'white' ? 'black' : 'white';
      this.game.selectedSquare = null;
      this.game.validMoves = [];
      
      this.$forceUpdate();
    },
    makeNextBotMove() {
      if (!this.botMode || this.botThinking) return;
      
      const botPlayer = this.playingAsWhite ? 'black' : 'white';
      if (this.game.currentPlayer !== botPlayer) return;

      this.botThinking = true;
      
      // Delay bot move for better UX (varies by difficulty)
      const delay = this.botDifficulty === 'hard' ? 1500 + Math.random() * 1500 : 
                    this.botDifficulty === 'easy' ? 500 + Math.random() * 500 :
                    1000 + Math.random() * 1000;
      
      setTimeout(() => {
        const moveMade = this.game.makeBotMove(this.botDifficulty);
        
        if (moveMade) {
          // Show bot move notification
          const lastMove = this.game.history[this.game.history.length - 1];
          const fromSquare = String.fromCharCode(97 + lastMove.from.col) + (8 - lastMove.from.row);
          const toSquare = String.fromCharCode(97 + lastMove.to.col) + (8 - lastMove.to.row);
          this.displayBotNotification(`Bot played: ${fromSquare} → ${toSquare}`);
          
          this.$forceUpdate();
          
          // Check if game ended
          if (this.game.gameStatus === 'timeout') {
            this.onGameEnd();
          }
        }
        
        this.botThinking = false;
      }, 1000 + Math.random() * 1000);
    },
    toggleBotMode() {
      this.botMode = !this.botMode;
      this.resetGame();
      
      if (this.botMode && !this.playingAsWhite) {
        // Bot moves first if player is black
        setTimeout(() => this.makeNextBotMove(), 500);
      }
    },
    setBotDifficulty(difficulty) {
      this.botDifficulty = difficulty;
    },
    displayBotNotification(text) {
      if (this.notificationTimeout) {
        clearTimeout(this.notificationTimeout);
      }
      
      this.botNotificationText = text;
      this.showBotNotification = true;
      
      this.notificationTimeout = setTimeout(() => {
        this.showBotNotification = false;
      }, 2500);
    },
    promotePawn(newType) {
      if (this.game.pendingPromotion) {
        const { row, col } = this.game.pendingPromotion;
        this.game.promotePawn(row, col, newType);
        this.showPromotionModal = false;
        this.$forceUpdate();
        
        // Trigger bot move if it's bot's turn after promotion
        setTimeout(() => {
          if (this.botMode && this.game.currentPlayer !== (this.playingAsWhite ? 'white' : 'black')) {
            this.makeNextBotMove();
          }
        }, 300);
      }
    }
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  min-height: 100vh;
  padding: 0;
  margin: 0;
  color: #333;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  gap: 0;
}

/* Header Styles */
.header {
  background: linear-gradient(135deg, rgba(30, 60, 114, 0.95) 0%, rgba(42, 82, 152, 0.95) 100%);
  backdrop-filter: blur(10px);
  color: white;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  gap: 20px;
}

.header h1 {
  font-size: 2.8em;
  margin: 0;
  letter-spacing: 3px;
  font-weight: 700;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
}

.hamburger {
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: none;
  flex-direction: column;
  gap: 5px;
  height: 45px;
  width: 45px;
  justify-content: center;
}

.hamburger:hover,
.hamburger.active {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.6);
}

.hamburger span {
  display: block;
  width: 100%;
  height: 2px;
  background: white;
  transition: all 0.3s ease;
}

.hamburger.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.hamburger.active span:nth-child(2) {
  opacity: 0;
}

.hamburger.active span:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

.game-info {
  text-align: center;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.current-player {
  margin: 0;
  font-size: 1.1em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.95;
}

.current-player.white {
  color: #fff9e6;
}

.current-player.black {
  color: #cccccc;
}

.timer-section {
  display: flex;
  justify-content: center;
  gap: 50px;
  margin-top: 15px;
  flex-wrap: wrap;
  padding: 0 20px;
}

.timer {
  background: rgba(0, 0, 0, 0.2);
  padding: 15px 25px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 140px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.timer.active {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
}

.player-label {
  font-size: 0.85em;
  opacity: 0.85;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.time {
  font-size: 1.9em;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  transition: all 0.3s ease;
  letter-spacing: 2px;
}

.time-low {
  color: #ff6b6b;
  animation: pulse 0.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Main Game Container */
.game-container {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 30px;
  margin: 30px auto;
  max-width: 1400px;
  padding: 0 20px;
  flex: 1;
  width: 100%;
  align-items: start;
}

.board-section {
  background: #d3d3d3;
  padding: 25px;
  border-radius: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 700px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* Controls Section */
.controls-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: fit-content;
  align-self: start;
}

.close-btn-mobile {
  display: none;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  font-size: 1.5em;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 499;
  display: none;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timer-buttons-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 48px;
}

.btn-placeholder {
  padding: 14px 18px;
  background: transparent;
  border-radius: 10px;
  cursor: default;
  height: 48px;
}

.btn {
  padding: 14px 18px;
  font-size: 1em;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.btn-icon {
  font-size: 1.2em;
}

.btn-reset {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.btn-reset:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.btn-start {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
}

.btn-start:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(76, 175, 80, 0.5);
}

.btn-stop {
  background: linear-gradient(135deg, #f44336 0%, #da190b 100%);
  box-shadow: 0 5px 15px rgba(244, 67, 54, 0.3);
}

.btn-stop:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(244, 67, 54, 0.5);
}

.btn-undo {
  background: linear-gradient(135deg, #2196f3 0%, #0b7dda 100%);
  box-shadow: 0 5px 15px rgba(33, 150, 243, 0.3);
}

.btn-undo:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(33, 150, 243, 0.5);
}

.btn-undo:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-bot-on {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
}

.btn-bot-on:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.5);
}

.btn-bot-off {
  background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
  box-shadow: 0 5px 15px rgba(149, 165, 166, 0.3);
}

.btn-bot-off:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(149, 165, 166, 0.5);
}

/* Bot Difficulty Selector */
.difficulty-selector {
  background: rgba(255, 255, 255, 0.1);
  padding: 14px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.difficulty-selector h4 {
  margin: 0 0 10px 0;
  color: white;
  font-size: 0.95em;
  letter-spacing: 0.5px;
}

.difficulty-buttons {
  display: flex;
  gap: 8px;
}

.diff-btn {
  flex: 1;
  padding: 10px 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85em;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.diff-btn:hover {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.15);
}

.diff-btn.active {
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.diff-btn.active:nth-child(1) {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
}

.diff-btn.active:nth-child(2) {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
}

.diff-btn.active:nth-child(3) {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.15);
  margin: 10px 0;
}

/* Time Controls */
.time-controls {
  background: rgba(255, 255, 255, 0.1);
  padding: 18px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.time-controls h4 {
  margin: 0 0 12px 0;
  color: white;
  font-size: 1.1em;
  letter-spacing: 0.5px;
}

.time-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-btn {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95em;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.time-btn:hover {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.15);
}

.time-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

/* Move History */
.move-history {
  background: rgba(255, 255, 255, 0.1);
  padding: 18px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  flex: 1;
}

.move-history h3 {
  margin: 0 0 12px 0;
  color: white;
  font-size: 1.1em;
  letter-spacing: 0.5px;
}

.history-list {
  max-height: 350px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.history-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.empty-history {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  text-align: center;
  padding: 20px 10px;
  font-size: 0.95em;
}

.history-item {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  font-size: 0.9em;
  align-items: center;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}

.move-number {
  font-weight: bold;
  min-width: 28px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85em;
}

.move-coords {
  flex: 1;
  font-family: 'Courier New', monospace;
  color: white;
  font-weight: 500;
}

.capture-indicator {
  color: #ff9999;
  font-weight: bold;
  font-size: 1.1em;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.game-end-modal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 50px 40px;
  text-align: center;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
  max-width: 500px;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.promotion-modal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 40px 35px;
  text-align: center;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
  max-width: 420px;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.modal-emoji {
  font-size: 90px;
  margin-bottom: 20px;
  animation: modalBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalBounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.modal-title {
  font-size: 2.8em;
  color: white;
  margin: 0 0 10px 0;
  font-weight: 700;
  letter-spacing: 2px;
}

.modal-message {
  font-size: 1.2em;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 35px 0;
  line-height: 1.5;
}

.modal-btn {
  background: white;
  color: #667eea;
  border: none;
  padding: 14px 50px;
  font-size: 1.1em;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.modal-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
}

.modal-btn:active {
  transform: translateY(-1px);
}

.promotion-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
}

.promo-btn {
  padding: 16px 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 0.95em;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.promo-piece {
  font-size: 2.5em;
}

.promo-queen {
  background: linear-gradient(135deg, #ffd700 0%, #ffb700 100%);
  box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4);
}

.promo-queen:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 215, 0, 0.6);
}

.promo-rook {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%);
  box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
}

.promo-rook:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.6);
}

.promo-bishop {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  box-shadow: 0 5px 15px rgba(167, 139, 250, 0.4);
}

.promo-bishop:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(167, 139, 250, 0.6);
}

.promo-knight {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  box-shadow: 0 5px 15px rgba(96, 165, 250, 0.4);
}

.promo-knight:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(96, 165, 250, 0.6);
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.menu-slide-enter-active,
.menu-slide-leave-active {
  transition: all 0.3s ease;
}

.menu-slide-enter-from,
.menu-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Bot Notification Styles */
.bot-notification {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 14px 24px;
  border-radius: 50px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 600;
  font-weight: 600;
  letter-spacing: 0.5px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.notification-icon {
  font-size: 1.3em;
  animation: botPulse 0.6s ease-in-out;
}

@keyframes botPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.notification-slide-enter-active,
.notification-slide-leave-active {
  transition: all 0.3s ease;
}

.notification-slide-enter-from,
.notification-slide-leave-to {
  transform: translateX(-50%) translateY(-20px);
  opacity: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .game-container {
    grid-template-columns: 1fr;
    gap: 20px;
    margin: 20px auto;
  }

  .controls-section {
    max-width: 500px;
    margin: 0 auto;
  }

  .header h1 {
    font-size: 2.2em;
  }

  .board-section {
    min-height: 500px;
  }
}

@media (max-width: 768px) {
  .hamburger {
    display: flex;
  }

  .header {
    padding: 15px;
  }

  .header-top {
    gap: 10px;
  }

  .header h1 {
    font-size: 1.8em;
  }

  .game-info {
    padding: 0 10px;
  }

  .timer-section {
    gap: 30px;
    margin-top: 12px;
  }

  .timer {
    min-width: 120px;
    padding: 12px 18px;
  }

  .time {
    font-size: 1.6em;
  }

  .game-container {
    grid-template-columns: 1fr;
    margin: 15px auto;
    padding: 0 15px;
    gap: 15px;
  }

  .board-section {
    min-height: 450px;
    padding: 15px;
  }

  .controls-section {
    position: fixed;
    top: 0;
    right: -100%;
    width: 85%;
    max-width: 350px;
    height: 100vh;
    background: linear-gradient(135deg, rgba(30, 60, 114, 0.98) 0%, rgba(42, 82, 152, 0.98) 100%);
    padding: 20px;
    z-index: 500;
    overflow-y: auto;
    border-left: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: -5px 0 20px rgba(0, 0, 0, 0.3);
  }

  .controls-section.open {
    right: 0;
  }

  .menu-overlay {
    display: block;
  }

  .close-btn-mobile {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 10px;
  }

  .game-end-modal {
    padding: 35px 25px;
    border-radius: 15px;
    margin: 20px;
  }

  .modal-emoji {
    font-size: 70px;
    margin-bottom: 15px;
  }

  .modal-title {
    font-size: 2em;
  }

  .modal-message {
    font-size: 1em;
    margin-bottom: 25px;
  }

  .modal-btn {
    padding: 12px 40px;
    font-size: 1em;
  }
}

@media (max-width: 480px) {
  .header h1 {
    font-size: 1.5em;
    letter-spacing: 1px;
  }

  .header-top {
    width: 100%;
  }

  .hamburger {
    width: 40px;
    height: 40px;
    padding: 8px;
  }

  .game-info {
    font-size: 0.9em;
  }

  .current-player {
    font-size: 0.95em;
  }

  .timer-section {
    gap: 20px;
  }

  .timer {
    min-width: 110px;
    padding: 10px 15px;
    font-size: 0.9em;
  }

  .time {
    font-size: 1.5em;
  }

  .player-label {
    font-size: 0.8em;
  }

  .board-section {
    min-height: 350px;
    padding: 10px;
  }

  .controls-section {
    width: 100% !important;
  }

  .btn {
    padding: 12px 14px;
    font-size: 0.9em;
    gap: 6px;
  }

  .time-controls,
  .move-history {
    padding: 14px;
  }

  .time-controls h4,
  .move-history h3 {
    font-size: 1em;
    margin-bottom: 10px;
  }

  .history-list {
    max-height: 250px;
  }

  .game-end-modal {
    padding: 25px 20px;
    border-radius: 12px;
    margin: 15px 10px;
  }

  .modal-emoji {
    font-size: 60px;
  }

  .modal-title {
    font-size: 1.6em;
  }

  .modal-message {
    font-size: 0.95em;
    margin-bottom: 20px;
  }

  .modal-btn {
    padding: 10px 30px;
    font-size: 0.95em;
  }
}
</style>
