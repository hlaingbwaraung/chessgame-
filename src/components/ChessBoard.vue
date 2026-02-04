<template>
  <div class="chess-board">
    <div v-for="(row, rowIndex) in game.board" :key="rowIndex" class="board-row">
      <div
        v-for="(piece, colIndex) in row"
        :key="`${rowIndex}-${colIndex}`"
        class="square"
        :class="{
          'light': (rowIndex + colIndex) % 2 === 0,
          'dark': (rowIndex + colIndex) % 2 === 1,
          'selected': game.selectedSquare?.row === rowIndex && game.selectedSquare?.col === colIndex,
          'valid-move': game.validMoves.some(m => m.row === rowIndex && m.col === colIndex),
          'has-piece': piece
        }"
        @click="selectSquare(rowIndex, colIndex)"
      >
        <div v-if="piece" class="piece" :class="`${piece.color}-${piece.type}`">
          {{ getPieceSymbol(piece.type) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChessBoard',
  props: {
    game: {
      type: Object,
      required: true
    }
  },
  methods: {
    selectSquare(row, col) {
      this.game.selectSquare(row, col);
      this.$forceUpdate();
    },
    getPieceSymbol(type) {
      const symbols = {
        'pawn': '♟',
        'knight': '♞',
        'bishop': '♝',
        'rook': '♜',
        'queen': '♛',
        'king': '♚'
      };
      return symbols[type] || '';
    }
  }
}
</script>

<style scoped>
.chess-board {
  display: grid;
  grid-template-columns: repeat(8, 75px);
  grid-template-rows: repeat(8, 75px);
  gap: 0;
  border: 10px solid #333;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  background: #2a2a2a;
}

.board-row {
  display: contents;
}

.square {
  width: 75px;
  height: 75px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
}

.square.light {
  background-color: #f0d9b5;
}

.square.dark {
  background-color: #b58863;
}

.square.selected {
  background-color: #baca44;
  box-shadow: inset 0 0 0 3px #6f8f1f;
}

.square.valid-move::after {
  content: '';
  width: 18px;
  height: 18px;
  background-color: rgba(111, 143, 31, 0.7);
  border-radius: 50%;
  position: absolute;
  box-shadow: 0 0 8px rgba(111, 143, 31, 0.5);
}

.piece {
  font-size: 55px;
  cursor: grab;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.piece:hover {
  transform: scale(1.1);
}

.white-pawn, .white-knight, .white-bishop, .white-rook, .white-queen, .white-king {
  color: #f0d9b5;
  text-shadow: 2px 2px 3px rgba(0, 0, 0, 0.5), -1px -1px 0 rgba(255, 255, 255, 0.2);
}

.black-pawn, .black-knight, .black-bishop, .black-rook, .black-queen, .black-king {
  color: #3a3a3a;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

.square:active {
  opacity: 0.9;
}
</style>
