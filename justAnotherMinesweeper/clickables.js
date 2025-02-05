class Clickable {
  constructor(x, y, w, h) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.absX = null
    this.absY = null
  }

  inBounds(x, y) {
    this.abs()
    return inBounds(x, y, this.absX, this.absY, this.w, this.h)
  }

  abs() {
    if (this.parent === undefined || this.parent === null) {
      [this.absX, this.absY] = [this.x, this.y]
      return
    }
    if (this.parent.getOffset === undefined) {
      [this.absX, this.absY] = [this.parent.x + this.x, this.parent.y + this.y]
      return
    }
    let parOs = this.parent.getOffset()
    [this.absX, this.absY] = [this.x + parOs[0], this.y + parOs[1]]
    return
  }

  tryClick(x, y) { // returns bool for click absorbed
    if (!this.inBounds(x, y)) {
      // clicked outside
      if (this._onOutsideClick === undefined) {
        return false
      }
      if (this._onOutsideClick()) {
        return true
      }
      return false
    }

    this._onClick()
    return true
  }

  /* CLICKING
    call tryClick() unconditionally
    subclass must define own
      _onClick()
      _onOutsideClick() -> bool for if click absorbed
  */
}

class Container extends Clickable {
  constructor(x, y, w, h) {
    super(x, y, w, h)
    this.myDraw = null
    this.elems = []
  }

  draw() {
    push()
    translate(this.x, this.y)
    this.myDraw()
    pop()

    // DRAWING
    // instance must define own myDraw()
  }

  // array methods
  push(element) {
    element.parent = this
    return this.elems.push(element)
  }
  includes(element) {
    return this.elems.includes(element)
  }
  remove(element) {
    let index = this.elems.indexOf(element)
    if (index == -1) {
      return false
    }
    return this.elems.splice(index, 1)
  }
}

class DiffDropdown extends Clickable {
  constructor(x, y, w, h) {
    super(x, y, w, h)
    this.parent = null
    this.open = false
  }

  draw() {
    fill(icoBgColDark)
    if (this.open) {
      fill("#dd7cb1")
    }
    rect(this.x, this.y, this.w, this.h)

    let diffTxt = "Custom"
    if (!(difficulty instanceof Object)) {
      diffTxt = DiffButton.lookup[difficulty]
    }
    textAlign(LEFT, CENTER)
    textSize(uiCon.h * 0.4)
    fill(255)
    text(diffTxt, this.x + this.w * 0.1, this.y + this.h * 0.55)
  }

  _onClick() {
    if (this.open) {
      return this.close()
    }

    this.open = true
    for (let i = 0; i < 4; i++) {
      uiClickables.push(new DiffButton(
        i,
        this.x + this.w / 20,
        this.y + this.h
      ))
    }
  }

  _onOutsideClick() { // returns bool for click absorbed
    if (this.open) {
      this.close()
      return true
    }
    return false
  }

  close() {
    uiClickables = uiClickables.filter(ele => {
      return !(ele instanceof DiffButton)
    })
    this.open = false
  }
}

class DiffButton extends Clickable {
  static lookup = ["Easy", "Normal", "Hard", "Custom"]

  constructor(idx, x, y) {
    let w = uiCon.w * 0.2
      , h = uiCon.h * 0.6
    super(
      x,
      y + idx * h,
      w,
      h
    )

    this.parent = uiCon
    this.diff = idx
  }

  draw() {
    noStroke()
    fill(0)
    rect(this.x, this.y, this.w, this.h)
    fill(255)
    textAlign(LEFT, CENTER)
    text(DiffButton.lookup[this.diff], this.x + 0.1 * this.w, this.y + this.h * 0.5)
  }

  _onClick() {
    if (this.diff < 3) {
      difficulty = this.diff
    } else {
      customDiffSelect()
    }
    diffDropdown.close()
    newLevel()
  }
}

class NumIn extends Clickable {
  static active = null
  static cursorT = 0

  constructor(x, y, w, h, def) {
    super(x, y, w, h)
    this.value = def
    this.active = false
  }

  draw() {
    rectMode(CORNER)
    fill(255)
    strokeWeight(1)
    stroke(0)
    rect(this.x, this.y, this.w, this.h)

    textAlign(LEFT, BOTTOM)
    textSize(0.8 * this.h)
    const w = textWidth(this.value)
    const ava = 0.8 * this.w
    if (w > ava) {
      textSize(textSize() * ava / w)
    }

    const txtLftMargin = this.x + 0.1 * this.w
    fill(0)
    if (this.active && NumIn.cursorT < 30) {
      rect(
        txtLftMargin + textWidth(this.value) + 0.1 * textSize(),
        this.y + 0.9 * this.h,
        0.07 * textSize(),
        -0.9 * textSize()
      )
    }

    text(this.value, txtLftMargin, this.y + this.h)
  }

  type(char) {
    if (isNaN(parseInt(char, 10))) {
      return
    }
    this.value = parseInt(this.value.toString() + char)
  }

  back() {
    debugger
    this.value = parseInt(this.value.toString().substring(0, -1))
  }

  _onClick() {
    NumIn.cursorT = 0
    this.active = true
    NumIn.active = this
  }

  _onOutsideClick() {
    this.active = false
    if (NumIn.active === this) {
      NumIn.active = null
    }
    return false
  }
}
