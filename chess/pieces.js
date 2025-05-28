new PieceType({ // r
	identifier: "r"
  , getTargets: (board, row, col, owner) => {
		let moves = []
		,	moveAppend = {}
		,	side = loseCastleSide(owner, row, col)

		if(side !== null) {
			moveAppend = {
				takenFunc: loseCastle
			  , args: [owner, side]
			}
		}

		// for 4 cardinal directions
		for (const axis of [0, 1]) {
			for (const directionSign of [-1, 1]) {

				let current = [row, col]
				current[axis] += directionSign
				let lookingAt = board.at(current[0], current[1])

				// traverse through empty squares
				while (lookingAt === null) {
					moves.push(new Target({
						board
					  , row: current[0]
					  , col: current[1]
					  , ...moveAppend
					}))
					current[axis] += directionSign
					lookingAt = board.at(current[0], current[1])
				}

				// account for possible capture
				if (lookingAt !== undefined && lookingAt.owner !== owner) {
					moves.push(new Target({
						board
					  , row: current[0]
					  , col: current[1]
					  , ...moveAppend
					}))
				}
			}
		}

		return moves
	}
  , draw: PieceType.AUTO
  , loadRequiredImages: PieceType.AUTO
})
new PieceType({ // n
	identifier: "n"
  , getTargets: (board, row, col, owner) => {
		let moves = []
		for (const reverse of [false, true]) {
			const square = reverse ? [col, row] : [row, col]

			for (let dir = 0; dir < 4; dir++) {
				// binary as used in bishop
				// saying up and right doesn't make sense here

				const double = 4 * (dir >> 1) - 2 	// ±2
					, single = 2 * (dir & 0b01) - 1 // ±1

					, rowIndex = +reverse
					, colIndex = +!reverse

				let current = [...square]
				current[0] += double
				current[1] += single

				const lookingAt = board.at(current[rowIndex], current[colIndex])

				if (lookingAt === null || lookingAt !== undefined && lookingAt.owner !== owner) {
					moves.push(new Target({
						board
					  , row: current[rowIndex]
					  , col: current[colIndex]
					}))
				}
			}
		}
		return moves
	}
  , draw: PieceType.AUTO
  , loadRequiredImages: PieceType.AUTO
})
new PieceType({ // b
	identifier: "b"
  , getTargets: (board, row, col, owner) => {
		let moves = []
		for (let dir = 0; dir < 4; dir++) {
			// express dir in binary
			// 11 => up-right, 00 => down-left

			// both ±1
			const up = 2 * (dir >> 1) - 1
				, right = 2 * (dir & 0b01) - 1

			let currentCol = col + up
			,	currentRow = row + right
			,	lookingAt = board.at(currentRow, currentCol)

			// traverse through empty squares
			while (lookingAt === null) {
				moves.push(new Target({
					board
				  , row: currentRow
				  , col: currentCol
				}))
				currentCol += up
				currentRow += right
				lookingAt = board.at(currentRow, currentCol)
			}

			if (lookingAt !== undefined && lookingAt.owner !== owner) {
				moves.push(new Target({
					board
				  , row: currentRow
				  , col: currentCol
				}))
			}
		}
		return moves
	}
  , draw: PieceType.AUTO
  , loadRequiredImages: PieceType.AUTO
})
new FusionPieceType({ // q
	identifier: "q"
  , componentIdentifiers: ["r", "b"]
  , draw: PieceType.AUTO
  , loadRequiredImages: PieceType.AUTO
})
new PieceType({ // k
	identifier: "k"
  , getTargets: (board, row, col, owner, searchingCheck) => {
		let moves = []

		if(!searchingCheck) moves.push(...getCastleTargets(board, row, col, owner))

		// regular moveset
		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				if (i === 0 && j === 0) continue
				const newRow = row + i
					, newCol = col + j

					, lookingAt = board.at(newRow, newCol)
				if (lookingAt === undefined || lookingAt !== null && lookingAt.owner === owner) continue

				moves.push(new Target({
					board
				  , row: newRow
				  , col: newCol
				  , takenFunc: loseCastle
				  , args: [owner, null]
				}))
			}
		}

		return moves
	}
  , draw: PieceType.AUTO
  , loadRequiredImages: PieceType.AUTO
})
new PieceType({ // p
	identifier: "p"
  , getTargets: (board, row, col, owner) => {
		const startRow = 6 - 5 * owner
			, direction = owner ? 1 : -1
			, nextRow = row + direction
			, jumpRow = nextRow + direction
		let moves = []

		// forward
		if (board.at(nextRow, col) === null) {
			moves.push(new Target({
				board
			  , row: nextRow
			  , col
			}))

			if (row === startRow && board.at(jumpRow, col) === null) {
				moves.push(new Target({
					board
				  , row: jumpRow
				  , col
				  , takenFunc: setEnPass
				  , args: [[nextRow, col]]
				}))
			}
		}

		// diagonal
		for (const os of [-1, 1]) {
			const targetCol = col + os
				, lookingAt = board.at(nextRow, targetCol)
			if (
				// capture space has opponent piece
				lookingAt !== null
				&& lookingAt !== undefined
				&& lookingAt.owner !== owner
			) {
				moves.push(new Target({
					board
				  , row: nextRow
				  , col: targetCol
				}))
			} else if (
				// capture space is en passant square
				enPassTarget !== null
				&& enPassTarget[0] === nextRow
				&& enPassTarget[1] === targetCol
			) {
				moves.push(new Target({
					board
				  , row: nextRow
				  , col: targetCol
				  , takenFunc: enPassed
				  , args: [[row, targetCol]]
				  , specialDraw: function() {
						let centerX = (this.col+0.5) * cellW
						,	crossY = (this.row+(activePlayer ? 0.25 : 0.75)) * cellW
						text("x", centerX, crossY)
				  	}
				}))
			}
		}

		return moves
	}
  , draw: PieceType.AUTO
  , loadRequiredImages: PieceType.AUTO
})
