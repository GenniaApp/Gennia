class Player {
  constructor(id, socket_id, username, color) {
    this.id = id;
    this.socket_id = socket_id;
    this.username = username;
    this.color = color;
    this.isRoomHost = false;
    this.forceStart = false;
    this.isDead = false;
    this.operatedTurn = 0; // Mark if the player moved on the current turn
    this.land = [];
  }

  trans() {
    // Disable `land` using because it will cause
    // `Converting circular structure / Maximum call stack size exceeded` error
    return {
      id: this.id,
      socket_id: this.socket_id,
      username: this.username,
      color: this.color,
      isRoomHost: this.isRoomHost,
      forceStart: this.forceStart,
      isDead: this.isDead,
      operatedTurn: this.operatedTurn
    }
  }

  setRoomHost(value) {
    this.isRoomHost = value;
  }

  initKing(block) {
    this.king = block;
    this.winLand(block);
  }

  getNumberOfLand() {
    return this.land.length;
  }

  winLand(block) {
    this.land.push(block);
    block.player = this;
  }

  loseLand(block) {
    var pos = this.land.indexOf(block);
    if (pos !== -1) {
      this.land.splice(pos, 1);
    }
  }

  getTotalUnit() {
    var reducer = (value, land) => value + land.unit;
    return this.land.reduce(reducer, 0);
  }

  beDominated() {
    this.king.setType("City");
    this.land.forEach(block => {
      this.king.player.winLand(block);
    });
  }

  beNeutralized() {
    this.land.forEach(block => {
      block.beNeutralized();
    });
  }
}

module.exports = Player;