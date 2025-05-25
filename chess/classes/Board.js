class Board {
	#data
	#kingsPos = { 0: null, 1: null }
	constructor(data, knownKingsPos = null) {
		this.#data = data

		for(const {i, j} of traverse8by8()) {
			if(data[i][j] === null) continue
			if (!(data[i][j] instanceof Piece)) this.#convertFromChars()
			break
		}

		if (knownKingsPos !== null) {
			this.#kingsPos = knownKingsPos
			return
		}
		this.#findKings()
	}

	#convertFromChars() {
		for(const {i, j} of traverse8by8())
			this.#data[i][j] = this.#createPiece(this.#data[i][j])
	}
	#createPiece(char) {
		if (char === null) {
			return null
		}

		const lowerChar = char.toLowerCase()
			, isBlack = char === lowerChar

		return new Piece(this, PieceType.all[lowerChar], +isBlack)
	}

	#findKings() {
		let toFind = [0, 1] // list players still not found

		for(const {i, j} of traverse8by8()) {
			const lookingAt = this.at(i, j)
			if (lookingAt === null || lookingAt.identifier !== "k") continue

			this.#kingsPos[lookingAt.owner] = [i, j]
			let countToFind = toFind.remove(lookingAt.owner)
			if (countToFind === 0) break
		}
	}

	at(i, j) {
		return (this.#data[i] ?? [])[j]
	}

	#kingAt(row, col) {
		for (let player = 0; player <= 1; player++) {
			if (row === this.#kingsPos[player][0] && col === this.#kingsPos[player][1]) return player
		}
		return null
	}

	move(startRow, startCol, endRow, endCol) {
		let movingKing = this.#kingAt(startRow, startCol)
		if (movingKing !== null) this.#kingsPos[movingKing] = [endRow, endCol]

		this.#data[endRow][endCol] = this.#data[startRow][startCol]
		this.reset([startRow, startCol])
	}

	reset([row, col]) {
		this.#data[row][col] = null
	}

	copy() {
		let newArr = []
		for (const row of this.#data) {
			newArr.push([...row])
		}
		return new Board(newArr, { ...this.#kingsPos })
	}

	/**
	 * @returns {Number[]} [row, col]
	 */
	getKingPos(player) {
		return this.#kingsPos[player]
	}
}
