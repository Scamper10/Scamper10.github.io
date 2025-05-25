class Piece {
	#board
	#info
	#owner
	constructor(board, pieceInfo, owner) {
		this.#board = board
		this.#info = pieceInfo
		this.#owner = owner
	}

	draw(x, y) {
		this.#info.draw(x, y, this.#owner)
	}

	getTargets(row, col, searchingCheck = false) {
		return this.#info.getTargets(this.#board, row, col, this.#owner, searchingCheck)
	}

	get owner() {return this.#owner}

	get identifier() {return this.#info.identifier}
}
