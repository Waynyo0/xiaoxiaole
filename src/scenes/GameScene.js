import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  ROWS,
  COLS,
  BOARD_X,
  BOARD_Y,
  TILE_SIZE,
  DRAG_THRESHOLD,
  CASCADE_CAP,
  SWAP_MS,
  CLEAR_MS,
  CLOCK_STEPS,
} from '../data/config.js';
import { getLevel } from '../data/levels.js';
import { pieceKey } from '../data/asset-manifest.js';
import { generateBoard, swapCreatesMatch, hasValidMove, areAdjacent } from '../core/board.js';
import { findMatches, collectClearSet } from '../core/match.js';
import { computeRoundScore, computeStars, computePropScore } from '../core/score.js';
import { shuffleBoard } from '../core/shuffle.js';
import { clearRow, clear3x3 } from '../core/props.js';
import { createRng, timeSeed } from '../core/rng.js';
import * as save from '../app/save.js';
import { audio } from '../app/audio.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.levelId = data.levelId || 1;
    this.resume = !!data.resume;
  }

  create() {
    this.level = getLevel(this.levelId);
    this.moves = this.level.moves;
    this.score = 0;
    this.target = this.level.target;
    this.state = 'IDLE';
    this.armedType = null;
    this.selected = null;
    this.seed = timeSeed();
    this.rng = createRng(this.seed);
    this.busy = false;

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_game').setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.board = null;
    this.tiles = [];
    for (let r = 0; r < ROWS; r++) this.tiles.push(new Array(COLS).fill(null));
    this.boardContainer = this.add.container(0, 0);

    this.selectRing = this.add
      .graphics()
      .lineStyle(4, 0xffffff, 0.95)
      .strokeCircle(0, 0, TILE_SIZE * 0.46)
      .setDepth(30)
      .setVisible(false);

    if (this.resume) {
      this.restoreCurrentGame();
    } else {
      this.board = generateBoard(this.rng);
    }

    this.rebuildSprites(false);
    this.setupInput();
    this.launchUI();
  }

  restoreCurrentGame() {
    const cg = save.getSave().currentGame;
    if (cg && cg.levelId === this.levelId && Array.isArray(cg.board)) {
      this.board = cg.board.map((row) => row.slice());
      this.score = cg.score;
      this.moves = cg.movesLeft;
    } else {
      this.board = generateBoard(this.rng);
    }
  }

  typeAt(r, c) {
    return this.board[r][c];
  }

  cellFromPointer(px, py) {
    const c = Math.floor((px - BOARD_X) / TILE_SIZE);
    const r = Math.floor((py - BOARD_Y) / TILE_SIZE);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    return { r, c };
  }

  launchUI() {
    this.scene.launch('UI', {
      levelId: this.levelId,
      moves: this.moves,
      score: this.score,
      target: this.target,
      resume: this.resume,
    });
  }

  rebuildSprites(animate) {
    this.boardContainer.removeAll(true);
    this.tiles = [];
    for (let r = 0; r < ROWS; r++) this.tiles.push(new Array(COLS).fill(null));
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const type = this.board[r][c];
        if (type == null) continue;
        const x = BOARD_X + c * TILE_SIZE + TILE_SIZE / 2;
        const y = BOARD_Y + r * TILE_SIZE + TILE_SIZE / 2;
        const sprite = this.add
          .image(x, y, pieceKey(type))
          .setDisplaySize(TILE_SIZE * 0.88, TILE_SIZE * 0.88);
        this.boardContainer.add(sprite);
        this.tiles[r][c] = sprite;
        if (animate) {
          const sx = sprite.scaleX;
          const sy = sprite.scaleY;
          sprite.setScale(0);
          this.tweens.add({
            targets: sprite,
            scaleX: sx,
            scaleY: sy,
            duration: 160,
            ease: 'Cubic.Out',
          });
        }
      }
    }
  }

  setupInput() {
    let downCell = null;
    let downX = 0;
    let downY = 0;
    let dragging = false;

    this.input.on('pointerdown', (p) => {
      audio.unlock();
      const cell = this.cellFromPointer(p.x, p.y);
      if (!cell) return;
      if (this.armedType) {
        this.applyPropAt(cell);
        return;
      }
      if (this.state !== 'IDLE') return;
      downCell = cell;
      downX = p.x;
      downY = p.y;
      dragging = false;
    });

    this.input.on('pointermove', (p) => {
      if (!downCell || dragging || this.state !== 'IDLE') return;
      if (!p.isDown) return;
      const dx = p.x - downX;
      const dy = p.y - downY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < DRAG_THRESHOLD) return;
      dragging = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        const dir = dx > 0 ? { r: 0, c: 1 } : { r: 0, c: -1 };
        const target = { r: downCell.r + dir.r, c: downCell.c + dir.c };
        if (this.validCell(target)) this.trySwap(downCell, target);
      } else {
        const dir = dy > 0 ? { r: 1, c: 0 } : { r: -1, c: 0 };
        const target = { r: downCell.r + dir.r, c: downCell.c + dir.c };
        if (this.validCell(target)) this.trySwap(downCell, target);
      }
      downCell = null;
    });

    this.input.on('pointerup', (p) => {
      if (dragging || !downCell) {
        downCell = null;
        dragging = false;
        return;
      }
      dragging = false;
      const cell = this.cellFromPointer(p.x, p.y);
      if (!cell) {
        downCell = null;
        return;
      }
      if (this.state !== 'IDLE') {
        downCell = null;
        return;
      }
      if (!this.selected) {
        this.selected = cell;
        this.showRing(cell);
      } else if (this.selected.r === cell.r && this.selected.c === cell.c) {
        this.selected = null;
        this.hideRing();
      } else if (areAdjacent(this.selected, cell)) {
        const a = this.selected;
        this.selected = null;
        this.hideRing();
        this.trySwap(a, cell);
      } else {
        this.selected = cell;
        this.showRing(cell);
      }
      downCell = null;
    });
  }

  validCell(cell) {
    return cell && cell.r >= 0 && cell.r < ROWS && cell.c >= 0 && cell.c < COLS;
  }

  showRing(cell) {
    this.selectRing.setVisible(true);
    this.selectRing.setPosition(
      BOARD_X + cell.c * TILE_SIZE + TILE_SIZE / 2,
      BOARD_Y + cell.r * TILE_SIZE + TILE_SIZE / 2
    );
  }

  hideRing() {
    this.selectRing.setVisible(false);
  }

  setState(s) {
    this.state = s;
    this.events.emit('state', s);
  }

  emitScore() {
    this.events.emit('score', this.score);
  }

  emitMoves() {
    this.events.emit('moves', this.moves);
  }

  trySwap(a, b) {
    if (this.state !== 'IDLE') return;
    const willMatch = swapCreatesMatch(this.board, a, b);
    this.setState('SWAPPING');
    audio.playSfx('swap');
    const spriteA = this.tiles[a.r][a.c];
    const spriteB = this.tiles[b.r][b.c];
    const pa = { x: BOARD_X + a.c * TILE_SIZE + TILE_SIZE / 2, y: BOARD_Y + a.r * TILE_SIZE + TILE_SIZE / 2 };
    const pb = { x: BOARD_X + b.c * TILE_SIZE + TILE_SIZE / 2, y: BOARD_Y + b.r * TILE_SIZE + TILE_SIZE / 2 };

    const tweenTo = (x1, y1, x2, y2) =>
      new Promise((res) => {
        this.tweens.add({ targets: spriteA, x: x1, y: y1, duration: SWAP_MS, onComplete: res });
        this.tweens.add({ targets: spriteB, x: x2, y: y2, duration: SWAP_MS });
      });

    const revert = async () => {
      await tweenTo(pa.x, pa.y, pb.x, pb.y);
      audio.playSfx('invalid');
      audio.vibrate(30);
      this.setState('IDLE');
    };

    const commit = async () => {
      const t = this.board[a.r][a.c];
      this.board[a.r][a.c] = this.board[b.r][b.c];
      this.board[b.r][b.c] = t;
      this.moves -= 1;
      this.emitMoves();
      await this.resolve();
    };

    tweenTo(pb.x, pb.y, pa.x, pa.y).then(() => {
      if (willMatch) commit();
      else revert();
    });
  }

  async resolve() {
    this.setState('RESOLVING');
    let round = 1;
    let guard = 0;
    while (guard < CASCADE_CAP) {
      const groups = findMatches(this.board);
      if (groups.length === 0) break;
      const roundScore = computeRoundScore(groups, round);
      this.score += roundScore;
      this.emitScore();
      audio.playSfx(round > 1 ? 'combo' : 'match');
      const cells = collectClearSet(groups);
      await this.animateClear(cells);
      await this.animateDrop();
      round++;
      guard++;
    }
    if (guard >= CASCADE_CAP) {
      this.board = shuffleBoard(this.board, this.rng);
      this.rebuildSprites(true);
    }
    if (!hasValidMove(this.board)) {
      await this.doShuffle();
    }
    this.saveCurrent();
    if (this.moves <= 0) {
      await this.settle();
    } else {
      this.setState('IDLE');
    }
  }

  async animateClear(cells) {
    const tweens = [];
    for (const [r, c] of cells) {
      const sprite = this.tiles[r][c];
      this.board[r][c] = null;
      if (sprite) {
        tweens.push(
          new Promise((res) => {
            this.tweens.add({
              targets: sprite,
              scale: 0,
              alpha: 0,
              duration: CLEAR_MS,
              onComplete: () => {
                sprite.destroy();
                res();
              },
            });
          })
        );
      }
      this.tiles[r][c] = null;
    }
    await Promise.all(tweens);
  }

  async animateDrop() {
    // 重力 + 补充
    for (let c = 0; c < COLS; c++) {
      const col = [];
      for (let r = ROWS - 1; r >= 0; r--) {
        if (this.board[r][c] != null) col.push(this.board[r][c]);
      }
      while (col.length < ROWS) col.push(this.rng.int(6));
      col.reverse();
      for (let r = 0; r < ROWS; r++) this.board[r][c] = col[r];
    }
    this.rebuildSprites(true);
    await this.delay(CLEAR_MS + 40);
  }

  async doShuffle() {
    this.setState('SHUFFLING');
    audio.playSfx('shuffle');
    this.events.emit('toast', 'shuffle');
    this.board = shuffleBoard(this.board, this.rng);
    this.rebuildSprites(true);
    await this.delay(320);
    if (!hasValidMove(this.board)) {
      this.board = generateBoard(this.rng);
      this.rebuildSprites(true);
    }
    this.saveCurrent();
    this.setState('IDLE');
  }

  async settle() {
    this.setState('SETTLING');
    const stars = computeStars(this.score, this.level.stars);
    const won = this.score >= this.target;
    save.recordLevelResult(this.levelId, stars, this.score);
    save.clearCurrentGame();
    if (won) audio.playSfx('win');
    else audio.playSfx('lose');
    this.setState('ENDED');
    this.events.emit('level-end', {
      won,
      score: this.score,
      stars,
      levelId: this.levelId,
      target: this.target,
      best: save.getSave().bestScores[this.levelId] || 0,
    });
  }

  // 道具
  armProp(type) {
    if (this.state !== 'IDLE') return;
    if (this.armedType === type) {
      this.armedType = null;
      this.events.emit('prop-armed', null);
      return;
    }
    if (save.getSave().props[type] <= 0) {
      this.events.emit('toast', 'outOfStock');
      return;
    }
    this.armedType = type;
    this.events.emit('prop-armed', type);
    this.events.emit('toast', type === 'rocket' ? 'chooseRow' : 'chooseTarget');
  }

  cancelProp() {
    this.armedType = null;
    this.events.emit('prop-armed', null);
  }

  useClock() {
    if (this.state !== 'IDLE' || this.moves <= 0) return;
    if (!save.useProp('clock')) {
      this.events.emit('toast', 'outOfStock');
      return;
    }
    this.moves += CLOCK_STEPS;
    this.emitMoves();
    audio.playSfx('clock');
    this.saveCurrent();
    this.events.emit('props', save.getSave().props);
  }

  applyPropAt(cell) {
    const type = this.armedType;
    this.armedType = null;
    this.events.emit('prop-armed', null);
    if (!type) return;
    if (this.state !== 'IDLE') return;
    if (!save.useProp(type)) {
      this.events.emit('toast', 'outOfStock');
      return;
    }
    this.events.emit('props', save.getSave().props);
    let cleared;
    if (type === 'rocket') {
      cleared = clearRow(this.board, cell.r);
      audio.playSfx('rocket');
    } else if (type === 'bomb') {
      cleared = clear3x3(this.board, cell.r, cell.c);
      audio.playSfx('bomb');
      audio.vibrate(40);
    } else {
      cleared = [];
    }
    if (cleared.length > 0) {
      this.score += computePropScore(cleared.length);
      this.emitScore();
      this.setState('RESOLVING');
      this.animateClear(cleared.map((c) => [c.r, c.c])).then(() => this.animateDrop()).then(() => this.afterPropResolve());
    } else {
      this.setState('IDLE');
    }
  }

  async afterPropResolve() {
    this.setState('RESOLVING');
    let round = 1;
    let guard = 0;
    while (guard < CASCADE_CAP) {
      const groups = findMatches(this.board);
      if (groups.length === 0) break;
      this.score += computeRoundScore(groups, round);
      this.emitScore();
      audio.playSfx(round > 1 ? 'combo' : 'match');
      const cells = collectClearSet(groups);
      await this.animateClear(cells);
      await this.animateDrop();
      round++;
      guard++;
    }
    if (!hasValidMove(this.board)) {
      await this.doShuffle();
    }
    this.saveCurrent();
    if (this.moves <= 0) await this.settle();
    else this.setState('IDLE');
  }

  saveCurrent() {
    save.setCurrentGame({
      levelId: this.levelId,
      score: this.score,
      movesLeft: this.moves,
      board: this.board.map((row) => row.slice()),
      state: 'IDLE',
      seed: this.seed,
      savedAt: Date.now(),
    });
  }

  delay(ms) {
    return new Promise((res) => this.time.delayedCall(ms, res));
  }
}
