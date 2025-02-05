class IcoSkele {
  constructor(path) {
    this.ready = false
    this.img = loadImage("images/" + path, () => {this.ready++})
  }

  show(x, y, w, h) {
    if(!this.ready) {return}
    image(this.img, x, y, w, h)
  }
}