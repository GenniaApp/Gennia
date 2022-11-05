const Block = require('./block');
const Point = require('./point');

const directions = [
  new Point(-1, -1), new Point(0, -1), new Point(1, -1),
  new Point(-1, 0), new Point(0, 0), new Point(1, 0),
  new Point(-1, 1), new Point(0, 1), new Point(1, 1)
];

function calcDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getRandomInt(min, max) {
  var minInt = Math.ceil(min);
  var maxInt = Math.floor(max);
  return Math.floor(Math.random() * (maxInt - minInt)) + minInt;
}

class GameMap {
  constructor(width, height, kings) {
    this.width = parseInt(kings.length * 4 + 10 * width);
    this.height = parseInt(kings.length * 4 + 10 * height);
    this.kings = kings;
    this.map = Array.from(Array(this.width), () => Array(this.height).fill(null));
    this.turn = 0
  }

  generate() {
    console.log("Width:", this.width, "Height:", this.height)
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        this.map[i][j] = new Block(i, j, 'Plain')
      }
    }

    let generals = new Array()
    // Generate the king
    for (let i = 0; i < this.kings.length; ++i) {
      let pos = null;
      while (true) {
        let x = getRandomInt(0, this.width);
        let y = getRandomInt(0, this.height);
        pos = new Point(x, y);
        let block = this.getBlock(pos);
        if (block.type !== "King") {
          let flag = true
          for (let j = 0; j < i; ++j)
            if (calcDistance(generals[j], new Point(x, y)) <= 6) {
              flag = false
              break
            }
          if (flag) {
            block.initKing(this.kings[i]);
            break;
          }
        }
      }
      generals.push({ x: pos.x, y: pos.y, player: this.kings[i] })
      console.log(i)
    }
    // Generate the mountain
    // TODO

    return new Promise(function (resolve, reject) {
      console.log('Map generated successfully')
      resolve(generals)
    })
  }

  // initMap(data) {
  //   data = data || Array.from(Array(this.width), () => Array(this.height).fill("Plain"));
  //   for (let i = 0; i < this.width; i++) {
  //     for (let j = 0; j < this.height; j++) {
  //       this.map[i][j] = new Block(i, j, data[i][j])
  //     }
  //   }
  // }

  getBlock(point) {
    return this.map[point.x][point.y]
  }

  ownBlock(player, point) {
    return player === this.getBlock(point).player
  }

  transferBlock(point, player) {
    this.map[point.x][point.y].player = player
    this.map[point.x][point.y].unit = Math.floor(this.map[point.x][point.y].unit / 2)
  }

  withinMap(point) {
    return 0 <= point.x && point.x < this.width && 0 <= point.y && point.y < this.height;
  }

  updateTurn() {
    this.turn++;
  }

  updateUnit() {
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        switch (this.map[i][j].type) {
          case "Plain":
            if (this.map[i][j].player && this.turn % 50 === 0)
              ++this.map[i][j].unit;
            break;
          case "King":
            if (this.turn % 2 === 0)
              ++this.map[i][j].unit;
            break;
          case "City":
            if (this.map[i][j].player && this.turn % 2 === 0)
              ++this.map[i][j].unit;
            break;
          case "Swamp":
            if (this.map[i][j].player && this.turn % 2 === 0)
              --this.map[i][j].unit;
            if (this.map[i][j].unit === 0)
              this.map[i][j].player = null;
            break;
          default:
            break;
        }
      }
    }
  }

  command(player, type, focusData, dirData) {
    var focus = new Point(focusData.x, focusData.y);
    var dir = new Point(dirData.x, dirData.y);
    var newFocus = focus.move(dir);
    if (this.commandable(player, focus, newFocus)) {
      switch (type) {
        case "Click":
          this.moveAllMovableUnit(player, focus, newFocus);
          break;
        case "DoubleClick":
          this.moveHalfMovableUnit(player, focus, newFocus);
          break;
        default:
          console.warn("Unexpected type of command", type);
      }
    }
  }

  commandable(player, focus, newFocus) {
    var isOwner = this.ownBlock(player, focus);
    var possibleMove = this.withinMap(focus) && this.withinMap(newFocus);
    var notMountain = this.getBlock(newFocus).type !== "Mountain";
    return isOwner && possibleMove && notMountain
  }

  moveAllMovableUnit(player, focus, newFocus) {
    var unit = this.getBlock(focus).getMovableUnit();
    this.moveUnit(player, unit, focus, newFocus);
  }

  moveHalfMovableUnit(player, focus, newFocus) {
    var unit = this.getBlock(focus).getMovableUnit();
    var halfUnit = Math.ceil(unit / 2);
    this.moveUnit(player, halfUnit, focus, newFocus);
  }

  moveUnit(player, unit, focus, newFocus) {
    this.getBlock(focus).leaveUnit(unit);
    this.getBlock(newFocus).enterUnit(player, unit);
  }

  buildBarrier() {
    // TODO
  }

  // getViewWhole() {
  //   var viewWhole = Array.from(Array(this.width), () => Array(this.height).fill(null));
  //   for (let i = 0; i < this.width; i++) {
  //     for (let j = 0; j < this.height; j++) {
  //       viewWhole[i][j] = this.getBlock(new Point(i, j)).getView();
  //     }
  //   }
  //   return viewWhole;
  // }

  getViewPlayer(player) {
    // Get the view of the player from the whole map
    console.log("Player is", player.username);
    var viewPlayer = Array.from(Array(this.width), () => Array(this.height).fill(null));

    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        var point = new Point(i, j);
        var block = this.getBlock(point);
        if (block.type === 'Mountain' || block.type === 'City') {
          viewPlayer[i][j] = { type: 'Obstacle', color: null, unit: null };
        } else {
          viewPlayer[i][j] = { type: 'Fog', color: null, unit: null };
        }
      }
    }
    for (let i = 0; i < this.width; i++) {
      for (let j = 0; j < this.height; j++) {
        var point = new Point(i, j);
        if (this.ownBlock(player, point)) {
          viewPlayer[point.x][point.y] = {
            type: this.map[point.x][point.y].type,
            color: player.color,
            unit: this.map[point.x][point.y].unit
          }
          directions.forEach(dir => {
            const newPoint = point.move(dir);
            if (this.withinMap(newPoint)) {
              viewPlayer[newPoint.x][newPoint.y] = {
                type: this.map[newPoint.x][newPoint.y].type,
                color: this.map[newPoint.x][newPoint.y].player ?
                  this.map[newPoint.x][newPoint.y].player.color : null,
                unit: this.map[newPoint.x][newPoint.y].unit
              }
            }
          })
        }
      }
    }
    return new Promise(function (resolve, reject) {
      console.log('View of player generated successfully')
      resolve(viewPlayer)
    })
  }

  // makeKing() {
  //   // Very dangerous and have upper bound for join new player
  //   while (true) {
  //     var x = getRandomInt(0, this.width);
  //     var y = getRandomInt(0, this.height);
  //     var block = this.getBlock(new Point(x, y));
  //     if (block.type !== "King") {
  //       block.setUnit(1);
  //       block.setType("King");
  //       return block
  //     }
  //   }
  // }
}

module.exports = GameMap;