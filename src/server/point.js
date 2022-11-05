class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  move(direction) {
    return new Point(this.x + direction.x, this.y + direction.y)
  }

  negative() {
    return new Point(-this.x, -this.y);
  }

  copy() {
    return new Point(this.x, this.y);
  }

  toString() {
    return `Point (${this.x}, ${this.y})`;
  }

  toObject() {
    return { x: this.x, y: this.y };
  }
}

module.exports = Point;