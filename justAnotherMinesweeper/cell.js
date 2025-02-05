class Cell {
  constructor(row, col) {
    this.row = row
    this.col = col
    this.tile = "safe" // "safe" or "mine"
    this.cover = true // unrevealed if true
    this.flag = null
    this.risk = 0 // # neighbours which are mines
    this.partOf = false // used for recursive dig
    this.highlight = false
  }

  draw() {
    let x = this.col*cellW
    let y = this.row*cellH

    // is middleMouse on this cell ?
    let mClickThis = touchDown ?
      touchHeld
      && inBounds(mouseX-gameCon.x, mouseY-gameCon.y, x, y, cellW, cellH)
      :
      mouseIsPressed 
      && mouseButton == CENTER
      && inBounds(mouseX-gameCon.x, mouseY-gameCon.y, x, y, cellW, cellH)
    //
    
    stroke(63)
    textAlign(CENTER, CENTER)

    if(this.cover) {
      fill(coverCol)
      rect(x, y, cellW, cellH)
      if(this.flag) {
        fill(this.flag.col)
        rect(x+0.1*cellW, y+0.1*cellH, 0.8*cellW, 0.8*cellH)
      }
    }
    else {
      switch(this.tile) {
        case "safe":
          {
            fill(safeCol)
            rect(x, y, cellW, cellH)

            let riskDisplay = mClickThis ? this.risk-this.getNearFlags() : this.risk
            let displaySizeFactor = mClickThis ? 0.5 : 0.8

            fill(numColors[this.risk])
            noStroke()
            textSize(displaySizeFactor*min(cellW, cellH))
            text(riskDisplay, x+halfCellW, y+1.1*halfCellH)
            break
          }
        case "mine":
          fill(mineBgCol)
          rect(x, y, cellW, cellH)
          break
      }
    }

    // neighbour highlights
    if(mClickThis) {
      for(let nei of this.neighbours) {
        nei.highlight = true
      }
    }

    // own highlight
    if(this.highlight) {
      fill(highlightCol)
      rect(x, y, cellW, cellH)
    }
    this.highlight = false
  }

  lClick() {
    if(this.cover) {
      if(this.flag) {
        this.unflag()
      }
      else {
        if(digged == 0) {
          genMines(this)
          this.recDig()
        }
        else {
          this.dig()
        }
      }
    } 
    else {
      let nearFlags = this.getNearFlags()
      if(nearFlags >= this.risk) {
        for(let nei of this.neighbours) {
          nei.dig()
        }
      }
    }
  }

  rClick() {
    if(this.flag) {
      this.unflag()
    } else if(this.cover) {
      this.reflag()
    }
  }

  reflag() {
    flags++
    this.flag = {col: flagCols[currFlagColIdx]}
  }
  
  unflag() {
    flags--
    this.flag = null
  }

  dig() {
    // exits if flagged
    // goes recursive if dug cell is 0
    // else as expected
    
    if(this.flag) {return}
    if(!this.cover) {return}
    if(this.risk == 0 && !this.partOf) {
      this.recDig()
      return
    }

    // actual digging
    this.cover = false
    digged++

    // game end conditions
    if(this.tile == "mine") {
      lose()
      return
    }
    if(digged == rows*cols-mines) {
      win()
    }
  }

  recDig() {
    this._myReccur()
    this._resetReccur()
  }
  _myReccur() { // recursive dig
    this.partOf = true

    this.dig()
    
    for(let nei of this.neighbours) {
      if(nei.partOf == true) {continue}
      if(!nei.cover) {continue}
      if(nei.risk == 0) {
        nei._myReccur()
      } else {
        nei.dig()
        nei.partOf = true
      }
    }
  }
  _resetReccur() {
    for(let row of map) {
      for(let cell of row) {
        cell.partOf = false
      }
    }
  }

  get neighbours() {
    let arr = []
    for(let i = -1; i <= 1; i++) {
      if(!map[this.row+i]) {continue}
      for(let j = -1; j <= 1; j++) {
        if(!map[this.row+i][this.col+j]) {continue}
        let nei = map[this.row+i][this.col+j]
        if(nei == this) {continue}
        arr.push(nei)
      }
    }
    return arr
  }

  getNearFlags() {
    let nearFlags = 0
    for(let nei of this.neighbours) {
      if(nei.flag) {
        nearFlags++
      }
    }
    return nearFlags
  }
  
  getOrthNeighbours() {
    let arr = []
    if(map[this.row-1]) {
      arr.push(map[this.row-1][this.col])
    }
    if(map[this.row][this.col+1]) {
      arr.push(map[this.row][this.col+1])
    }
    if(map[this.row+1]) {
      arr.push(map[this.row+1][this.col])
    }
    if(map[this.row][this.col-1]) {
      arr.push(map[this.row][this.col-1])
    }
    return arr
  } // unused
}