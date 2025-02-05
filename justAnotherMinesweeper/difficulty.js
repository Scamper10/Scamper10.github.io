function setDifficulty(diff) {
  if (diff instanceof Object) {
    /*
      diff = {
        rows: __, cols: __, mines: __
      }
    */
    rows = diff.rows
    cols = diff.cols
    mines = diff.mines
    return
  }


  switch (diff) {
    case 0:
      rows = 9
      cols = 9
      mines = 10
      break
    default: case 1:
      rows = 16
      cols = 16
      mines = 40
      break
    case 2:
      rows = 16
      cols = 30
      mines = 99
      break
  }
}
