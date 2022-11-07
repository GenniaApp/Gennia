class Block {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.unit = 0;
    this.player = null;
  }

  setUnit(unit) {
    this.unit = unit;
  }

  setType(type) {
    this.type = type;
  }

  beDominated(player, unit) {
    this.unit = unit - this.unit;
    if (this.type === 'King' && this.player !== player) this.type = 'City'
    this.player = player;
    this.player.winLand(this);
  }

  initKing(player) {
    this.type = 'King';
    this.unit = 1;
    this.player = player;
  }

  enterUnit(player, unit) {
    if (this.player === player) {
      this.unit += unit;
    } else {
      if (this.unit >= unit) {
        this.unit -= unit;
      } else if (this.unit < unit) {
        this.beDominated(player, unit);
      }
    }
  }

  leaveUnit(unit) {
    this.unit -= unit;
  }

  getMovableUnit() {
    return Math.max(this.unit - 1, 0)
  }

  getView() {
    return {
      type: this.type,
      unit: this.unit,
      player: this.player
    }
  }
}

module.exports = Block;