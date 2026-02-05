// Chess game logic

export class ChessGame {
  constructor(timeLimit = 300) { // 300 seconds = 5 minutes default
    this.board = this.initializeBoard();
    this.selectedSquare = null;
    this.validMoves = [];
    this.history = [];
    this.currentPlayer = 'white';
    this.gameStatus = 'playing'; // 'playing', 'checkmate', 'stalemate', 'check', 'timeout'
    this.timeLimit = timeLimit;
    this.whiteTime = timeLimit;
    this.blackTime = timeLimit;
    this.timerInterval = null;
    this.lastMoveTime = Date.now();
    this.pendingPromotion = null;
    this.winner = null;
  }

  initializeBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Setup white pieces
    board[7][0] = { type: 'rook', color: 'white' };
    board[7][1] = { type: 'knight', color: 'white' };
    board[7][2] = { type: 'bishop', color: 'white' };
    board[7][3] = { type: 'queen', color: 'white' };
    board[7][4] = { type: 'king', color: 'white' };
    board[7][5] = { type: 'bishop', color: 'white' };
    board[7][6] = { type: 'knight', color: 'white' };
    board[7][7] = { type: 'rook', color: 'white' };
    
    for (let i = 0; i < 8; i++) {
      board[6][i] = { type: 'pawn', color: 'white' };
    }
    
    // Setup black pieces
    board[0][0] = { type: 'rook', color: 'black' };
    board[0][1] = { type: 'knight', color: 'black' };
    board[0][2] = { type: 'bishop', color: 'black' };
    board[0][3] = { type: 'queen', color: 'black' };
    board[0][4] = { type: 'king', color: 'black' };
    board[0][5] = { type: 'bishop', color: 'black' };
    board[0][6] = { type: 'knight', color: 'black' };
    board[0][7] = { type: 'rook', color: 'black' };
    
    for (let i = 0; i < 8; i++) {
      board[1][i] = { type: 'pawn', color: 'black' };
    }
    
    return board;
  }

  getValidMoves(row, col) {
    const piece = this.board[row][col];
    if (!piece || piece.color !== this.currentPlayer) {
      return [];
    }

    const moves = [];

    switch (piece.type) {
      case 'pawn':
        moves.push(...this.getPawnMoves(row, col, piece.color));
        break;
      case 'knight':
        moves.push(...this.getKnightMoves(row, col, piece.color));
        break;
      case 'bishop':
        moves.push(...this.getBishopMoves(row, col, piece.color));
        break;
      case 'rook':
        moves.push(...this.getRookMoves(row, col, piece.color));
        break;
      case 'queen':
        moves.push(...this.getQueenMoves(row, col, piece.color));
        break;
      case 'king':
        moves.push(...this.getKingMoves(row, col, piece.color));
        break;
    }

    return moves.filter(move => !this.isMoveLeavingKingInCheck(row, col, move.row, move.col));
  }

  getPawnMoves(row, col, color) {
    const moves = [];
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;

    // Move forward
    const nextRow = row + direction;
    if (nextRow >= 0 && nextRow < 8 && !this.board[nextRow][col]) {
      moves.push({ row: nextRow, col });

      // Double move from start
      if (row === startRow) {
        const doubleRow = row + 2 * direction;
        if (!this.board[doubleRow][col]) {
          moves.push({ row: doubleRow, col });
        }
      }
    }

    // Capture diagonally
    for (let dc of [-1, 1]) {
      const newCol = col + dc;
      if (nextRow >= 0 && nextRow < 8 && newCol >= 0 && newCol < 8) {
        const target = this.board[nextRow][newCol];
        if (target && target.color !== color) {
          moves.push({ row: nextRow, col: newCol });
        }
      }
    }

    return moves;
  }

  getKnightMoves(row, col, color) {
    const moves = [];
    const offsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (let [dr, dc] of offsets) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const target = this.board[newRow][newCol];
        if (!target || target.color !== color) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }

    return moves;
  }

  getBishopMoves(row, col, color) {
    const moves = [];
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    
    for (let [dr, dc] of directions) {
      for (let i = 1; i < 8; i++) {
        const newRow = row + dr * i;
        const newCol = col + dc * i;
        if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
        
        const target = this.board[newRow][newCol];
        if (target) {
          if (target.color !== color) moves.push({ row: newRow, col: newCol });
          break;
        }
        moves.push({ row: newRow, col: newCol });
      }
    }
    return moves;
  }

  getRookMoves(row, col, color) {
    const moves = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (let [dr, dc] of directions) {
      for (let i = 1; i < 8; i++) {
        const newRow = row + dr * i;
        const newCol = col + dc * i;
        if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
        
        const target = this.board[newRow][newCol];
        if (target) {
          if (target.color !== color) moves.push({ row: newRow, col: newCol });
          break;
        }
        moves.push({ row: newRow, col: newCol });
      }
    }
    return moves;
  }

  getQueenMoves(row, col, color) {
    return [...this.getBishopMoves(row, col, color), ...this.getRookMoves(row, col, color)];
  }

  getKingMoves(row, col, color) {
    const moves = [];
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    
    for (let [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const target = this.board[newRow][newCol];
        if (!target || target.color !== color) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }
    return moves;
  }

  isMoveLeavingKingInCheck(fromRow, fromCol, toRow, toCol) {
    // Make a copy of the board to simulate the move
    const boardCopy = this.board.map(row => [...row]);
    boardCopy[toRow][toCol] = boardCopy[fromRow][fromCol];
    boardCopy[fromRow][fromCol] = null;

    // Find king position
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (boardCopy[r][c]?.type === 'king' && boardCopy[r][c]?.color === this.currentPlayer) {
          kingPos = { row: r, col: c };
          break;
        }
      }
    }

    // Check if king is under attack
    return this.isSquareUnderAttack(kingPos.row, kingPos.col, this.currentPlayer, boardCopy);
  }

  isSquareUnderAttack(row, col, color, board = this.board) {
    const enemyColor = color === 'white' ? 'black' : 'white';
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === enemyColor) {
          if (this.canPieceAttack(r, c, row, col, piece, board)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  canPieceAttack(fromRow, fromCol, toRow, toCol, piece, board) {
    switch (piece.type) {
      case 'pawn': {
        const direction = piece.color === 'white' ? -1 : 1;
        return fromRow + direction === toRow && Math.abs(fromCol - toCol) === 1;
      }
      case 'knight': {
        const dr = Math.abs(fromRow - toRow);
        const dc = Math.abs(fromCol - toCol);
        return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
      }
      case 'bishop':
        return this.canMoveDiagonally(fromRow, fromCol, toRow, toCol, board);
      case 'rook':
        return this.canMoveStraight(fromRow, fromCol, toRow, toCol, board);
      case 'queen':
        return this.canMoveDiagonally(fromRow, fromCol, toRow, toCol, board) || 
               this.canMoveStraight(fromRow, fromCol, toRow, toCol, board);
      case 'king':
        return Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1;
      default:
        return false;
    }
  }

  canMoveStraight(fromRow, fromCol, toRow, toCol, board) {
    if (fromRow !== toRow && fromCol !== toCol) return false;
    
    const dr = fromRow === toRow ? 0 : (toRow > fromRow ? 1 : -1);
    const dc = fromCol === toCol ? 0 : (toCol > fromCol ? 1 : -1);
    
    let r = fromRow + dr;
    let c = fromCol + dc;
    while (r !== toRow || c !== toCol) {
      if (board[r][c]) return false;
      r += dr;
      c += dc;
    }
    return true;
  }

  canMoveDiagonally(fromRow, fromCol, toRow, toCol, board) {
    if (Math.abs(fromRow - toRow) !== Math.abs(fromCol - toCol)) return false;
    
    const dr = toRow > fromRow ? 1 : -1;
    const dc = toCol > fromCol ? 1 : -1;
    
    let r = fromRow + dr;
    let c = fromCol + dc;
    while (r !== toRow || c !== toCol) {
      if (board[r][c]) return false;
      r += dr;
      c += dc;
    }
    return true;
  }

  movePiece(fromRow, fromCol, toRow, toCol) {
    const piece = this.board[fromRow][fromCol];
    if (!piece || piece.color !== this.currentPlayer) return false;

    const validMoves = this.getValidMoves(fromRow, fromCol);
    if (!validMoves.some(m => m.row === toRow && m.col === toCol)) {
      return false;
    }

    // Save to history
    this.history.push({
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      captured: this.board[toRow][toCol]
    });

    // Move piece
    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;

    // Check for pawn promotion
    const needsPromotion = piece.type === 'pawn' && 
                          ((piece.color === 'white' && toRow === 0) || 
                           (piece.color === 'black' && toRow === 7));
    
    if (needsPromotion) {
      this.pendingPromotion = {
        row: toRow,
        col: toCol,
        color: piece.color
      };
      return { promotion: true };
    }

    // Switch player
    this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
    this.selectedSquare = null;
    this.validMoves = [];

    // Check for checkmate or stalemate
    if (this.isCheckmate(this.currentPlayer)) {
      this.gameStatus = 'checkmate';
      this.winner = this.currentPlayer === 'white' ? 'black' : 'white';
    } else if (this.isStalemate(this.currentPlayer)) {
      this.gameStatus = 'stalemate';
    } else if (this.isKingInCheck(this.currentPlayer)) {
      this.gameStatus = 'check';
    } else {
      this.gameStatus = 'playing';
    }

    return true;
  }

  promotePawn(row, col, newType) {
    const piece = this.board[row][col];
    if (piece && piece.type === 'pawn') {
      piece.type = newType;
      
      // Switch player after promotion
      this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
      this.selectedSquare = null;
      this.validMoves = [];
      this.pendingPromotion = null;
      
      // Check for checkmate or stalemate
      if (this.isCheckmate(this.currentPlayer)) {
        this.gameStatus = 'checkmate';
        this.winner = this.currentPlayer === 'white' ? 'black' : 'white';
      } else if (this.isStalemate(this.currentPlayer)) {
        this.gameStatus = 'stalemate';
      } else if (this.isKingInCheck(this.currentPlayer)) {
        this.gameStatus = 'check';
      } else {
        this.gameStatus = 'playing';
      }
      
      return true;
    }
    return false;
  }

  startTimer(onTick) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.timerInterval = setInterval(() => {
      if (this.currentPlayer === 'white') {
        this.whiteTime--;
        if (this.whiteTime <= 0) {
          this.whiteTime = 0;
          this.gameStatus = 'timeout';
          clearInterval(this.timerInterval);
          onTick && onTick();
          return;
        }
      } else {
        this.blackTime--;
        if (this.blackTime <= 0) {
          this.blackTime = 0;
          this.gameStatus = 'timeout';
          clearInterval(this.timerInterval);
          onTick && onTick();
          return;
        }
      }
      onTick && onTick();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  isCheckmate(player) {
    // First check if king is in check
    if (!this.isKingInCheck(player)) {
      return false;
    }
    
    // Check if there are any valid moves
    return this.getAllValidMoves(player).length === 0;
  }

  isStalemate(player) {
    // Not in check but no valid moves
    if (this.isKingInCheck(player)) {
      return false;
    }
    
    return this.getAllValidMoves(player).length === 0;
  }

  isKingInCheck(player) {
    // Find king position
    let kingPos = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c]?.type === 'king' && this.board[r][c]?.color === player) {
          kingPos = { row: r, col: c };
          break;
        }
      }
      if (kingPos) break;
    }
    
    if (!kingPos) return false;
    return this.isSquareUnderAttack(kingPos.row, kingPos.col, player);
  }

  selectSquare(row, col) {
    if (this.selectedSquare?.row === row && this.selectedSquare?.col === col) {
      this.selectedSquare = null;
      this.validMoves = [];
      return;
    }

    const piece = this.board[row][col];
    if (piece && piece.color === this.currentPlayer) {
      this.selectedSquare = { row, col };
      this.validMoves = this.getValidMoves(row, col);
    } else if (this.selectedSquare) {
      this.movePiece(this.selectedSquare.row, this.selectedSquare.col, row, col);
    }
  }

  resetGame() {
    this.board = this.initializeBoard();
    this.selectedSquare = null;
    this.validMoves = [];
    this.history = [];
    this.currentPlayer = 'white';
    this.gameStatus = 'playing';
    this.whiteTime = this.timeLimit;
    this.blackTime = this.timeLimit;
    this.winner = null;
    this.stopTimer();
  }

  // Bot AI Methods
  getAllValidMoves(player) {
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color === player) {
          const pieceMoves = this.getValidMoves(row, col);
          pieceMoves.forEach(move => {
            moves.push({ from: { row, col }, to: move });
          });
        }
      }
    }
    return moves;
  }

  getPieceValue(piece) {
    if (!piece) return 0;
    const values = {
      pawn: 1,
      knight: 3,
      bishop: 3,
      rook: 5,
      queen: 9,
      king: 0
    };
    return values[piece.type] || 0;
  }

  evaluateMove(fromRow, fromCol, toRow, toCol, difficulty = 'normal') {
    let score = 0;
    const piece = this.board[fromRow][fromCol];
    const targetPiece = this.board[toRow][toCol];

    if (difficulty === 'easy') {
      // Easy: mostly random with slight preference for captures
      score = Math.random() * 100;
      if (targetPiece) {
        score += this.getPieceValue(targetPiece) * 5;
      }
      return score;
    }

    // Capture value
    if (targetPiece) {
      score += this.getPieceValue(targetPiece) * 10;
    }

    // Piece development (moving towards center)
    const centerDistance = Math.abs(toRow - 3.5) + Math.abs(toCol - 3.5);
    const oldCenterDistance = Math.abs(fromRow - 3.5) + Math.abs(fromCol - 3.5);
    score += (oldCenterDistance - centerDistance) * 0.5;

    if (difficulty === 'hard') {
      // Hard: deeper evaluation
      score += this.evaluatePositionBonus(piece, toRow, toCol);
      score += this.evaluatePieceSafety(fromRow, fromCol, toRow, toCol);
      score += this.evaluateThreats(toRow, toCol);
      // Less randomness for hard mode
      score += Math.random() * 2;
    } else {
      // Normal mode: add some randomness
      score += Math.random() * 5;
    }

    return score;
  }

  evaluatePositionBonus(piece, row, col) {
    let bonus = 0;
    
    // Pawn advancement bonus
    if (piece.type === 'pawn') {
      if (piece.color === 'white') {
        bonus += (6 - row) * 0.5; // Closer to promotion
      } else {
        bonus += (row - 1) * 0.5;
      }
    }
    
    // Knight on center is strong
    if (piece.type === 'knight') {
      if ((row >= 2 && row <= 5) && (col >= 2 && col <= 5)) {
        bonus += 2;
      }
    }
    
    // Rook on open files / 7th rank
    if (piece.type === 'rook') {
      const targetRank = piece.color === 'white' ? 1 : 6;
      if (row === targetRank) bonus += 3;
    }
    
    return bonus;
  }

  evaluatePieceSafety(fromRow, fromCol, toRow, toCol) {
    const piece = this.board[fromRow][fromCol];
    const pieceValue = this.getPieceValue(piece);
    
    // Simulate the move
    const originalTarget = this.board[toRow][toCol];
    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;
    
    // Check if the piece would be under attack
    const underAttack = this.isSquareUnderAttack(toRow, toCol, piece.color);
    
    // Restore board
    this.board[fromRow][fromCol] = piece;
    this.board[toRow][toCol] = originalTarget;
    
    if (underAttack) {
      return -pieceValue * 3; // Penalty for moving to attacked square
    }
    return 0;
  }

  evaluateThreats(toRow, toCol) {
    let threats = 0;
    const piece = this.board[toRow]?.[toCol];
    if (!piece) return 0;
    
    // Check if this move creates threats to enemy pieces
    const enemyColor = piece.color === 'white' ? 'black' : 'white';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const target = this.board[r][c];
        if (target && target.color === enemyColor) {
          if (this.canPieceAttack(toRow, toCol, r, c, piece, this.board)) {
            threats += this.getPieceValue(target) * 0.5;
          }
        }
      }
    }
    return threats;
  }

  makeBotMove(difficulty = 'normal') {
    const availableMoves = this.getAllValidMoves(this.currentPlayer);
    
    if (availableMoves.length === 0) {
      return false; // No valid moves available
    }

    let bestMove;

    if (difficulty === 'easy') {
      // Easy mode: pick somewhat random moves with slight capture preference
      const scoredMoves = availableMoves.map(move => ({
        move,
        score: this.evaluateMove(move.from.row, move.from.col, move.to.row, move.to.col, 'easy')
      }));
      scoredMoves.sort((a, b) => b.score - a.score);
      // Pick from top 5 moves randomly for variety
      const topMoves = scoredMoves.slice(0, Math.min(5, scoredMoves.length));
      bestMove = topMoves[Math.floor(Math.random() * topMoves.length)].move;
    } else {
      // Normal and Hard mode: evaluate and pick best move
      bestMove = availableMoves[0];
      let bestScore = this.evaluateMove(
        bestMove.from.row,
        bestMove.from.col,
        bestMove.to.row,
        bestMove.to.col,
        difficulty
      );

      for (let i = 1; i < availableMoves.length; i++) {
        const move = availableMoves[i];
        const score = this.evaluateMove(
          move.from.row,
          move.from.col,
          move.to.row,
          move.to.col,
          difficulty
        );

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    // Execute the best move
    const moveResult = this.movePiece(bestMove.from.row, bestMove.from.col, bestMove.to.row, bestMove.to.col);
    
    // Auto-promote pawn if needed (bot chooses queen by default, hard mode might pick knight in rare cases)
    if (moveResult && moveResult.promotion && this.pendingPromotion) {
      const promoType = difficulty === 'hard' ? this.chooseBestPromotion() : 'queen';
      this.promotePawn(this.pendingPromotion.row, this.pendingPromotion.col, promoType);
    }
    
    return true;
  }

  chooseBestPromotion() {
    // Usually queen is best, but check for knight fork opportunities
    // For simplicity, always promote to queen
    return 'queen';
  }
}
