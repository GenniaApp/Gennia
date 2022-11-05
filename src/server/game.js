const GameMap = require('./map');


class Game {
  constructor(gameSpeed, mapWidth, mapHeight, mountain, city, swamp) {
    this.map = new GameMap(mapWidth, mapHeight);
    this.lobby = new Lobby();

    this.players = [];
    setInterval(this.update.bind(this), 1000 / gameSpeed);
  }

  handleInput(socket, command) {
    var playerID = socket.id;
    var deque = this.lobby.deques.get(playerID);
    deque.push(command);
  }

  update() {
    this.map.updateTurn();
    this.map.updateUnit();

    if (this.map.turn % 50 === 0) {
      console.info(`Turn ${this.map.turn}`);
    }
    
  }
}

module.exports = Game;