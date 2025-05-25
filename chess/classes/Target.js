class Target {
	constructor({
		board
	  , row
	  , col
	  , takenFunc = null
	  , args = null
	  , skipDefaultDraw = false
	  , specialDraw = null
	}) {
		// apply constructor args directly to instance
		Object.assign(this, arguments[0])

		Object.freeze(this)
	}

	take(selected) {
		this.board.move(selected.row, selected.col, this.row, this.col)
		this.takenFunc?.(...this.args) // additional actions for castling/enPass
	}

	draw() {
		if(!this.skipDefaultDraw) this.#defaultDraw()
		this.specialDraw?.()
	}

	#defaultDraw() {
		noStroke()
		fill(0, 50)
		circle(
			(this.col + 0.5) * cellW
		  , (this.row + 0.5) * cellW
		  , 0.8 * cellW
		)
	}
}
