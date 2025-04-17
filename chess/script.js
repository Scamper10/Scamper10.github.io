//	Forsyth-Edwards Notation
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0"

//#region	PIECE DEFINITIONS
new PieceType({
	identifier: "r",
	getTargets: (board, row, col, owner) => {
		let moves = []
		for (const axis of [0, 1]) {
			for (const sign of [-1, 1]) {
				let current = [row, col]
				current[axis] += sign
				let lookingAt = board.at(current[0], current[1])
				while (lookingAt === null) {
					moves.push({
						row: current[0],
						col: current[1]
					})
					current[axis] += sign
					lookingAt = board.at(current[0], current[1])
				}
				if (lookingAt !== undefined && lookingAt.owner !== owner) {
					moves.push({
						row: current[0],
						col: current[1]
					})
				}
			}
		}
		return moves
	},
	draw: (x, y, owner) => text(owner ? "r" : "R", x, y)
})
new PieceType({
	identifier: "n",
	getTargets: (board, row, col, owner) => {
		let moves = []
		for (const reverse of [false, true]) {
			const square = reverse ? [col, row] : [row, col]

			for (let dir = 0; dir < 4; dir++) {
				// binary as used in bishop
				// saying up and right doesn't make sense here

				const double = 4 * (dir >> 1) - 2
					, single = 2 * (dir & 0b01) - 1

					, rowIndex = +reverse
					, colIndex = +!reverse

				let current = [...square]
				current[0] += double
				current[1] += single

				const lookingAt = board.at(current[rowIndex], current[colIndex])
				if (lookingAt === null || lookingAt !== undefined && lookingAt.owner !== owner) {
					moves.push({
						row: current[rowIndex],
						col: current[colIndex]
					})
				}
			}
		}
		return moves
	},
	draw: (x, y, owner) => text(owner ? "n" : "N", x, y)
})
new PieceType({
	identifier: "b",
	getTargets: (board, row, col, owner) => {
		let moves = []
		for (let dir = 0; dir < 4; dir++) {
			// express dir in binary
			// 11 => up-right, 00 => down-left
			const up = 2 * (dir >> 1) - 1
				, right = 2 * (dir & 0b01) - 1

			let currentCol = col + up
			,	currentRow = row + right
			,	lookingAt = board.at(currentRow, currentCol)
			while (lookingAt === null) {
				moves.push({
					row: currentRow,
					col: currentCol
				})
				currentCol += up
				currentRow += right
				lookingAt = board.at(currentRow, currentCol)
			}
			if (lookingAt !== undefined && lookingAt.owner !== owner) {
				moves.push({
					row: currentRow,
					col: currentCol
				})
			}
		}
		return moves
	},
	draw: (x, y, owner) => text(owner ? "b" : "B", x, y)
})
new FusionPieceType({
	identifier: "q",
	componentIdentifiers: ["r", "b"],
	draw: (x, y, owner) => text(owner ? "q" : "Q", x, y)
})
new PieceType({ // k
	identifier: "k",
	getTargets: (board, row, col, owner) => {
		let moves = []
		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				if (i === 0 && j === 0) continue
				const newRow = row + i
					, newCol = col + j

					, lookingAt = board.at(newRow, newCol)
				if (
					lookingAt === undefined
					|| lookingAt !== null && lookingAt.owner === owner) continue

				moves.push({
					row: newRow,
					col: newCol
				})
			}
		}
		return moves
	},
	draw: (x, y, owner) => text(owner ? "k" : "K", x, y)
})
new PieceType({
	identifier: "p",
	getTargets: (board, row, col, owner) => {
		const startRow = 6 - 5 * owner
			, direction = owner ? 1 : -1
			, nextRow = row + direction
			, jumpRow = nextRow + direction
		let moves = []

		if (board.at(nextRow, col) === null) {
			moves.push({
				row: nextRow,
				col: col
			})

			if (row === startRow && board.at(jumpRow, col) === null) {
				moves.push({
					row: jumpRow,
					col: col,
					takenFunc: setEnPass,
					args: [nextRow, col]
				})
			}
		}
		for (const os of [-1, 1]) {
			const targetCol = col + os
				, lookingAt = board.at(nextRow, targetCol)
			if (
				lookingAt !== null
				&& lookingAt !== undefined
				&& lookingAt.owner !== owner
			) {
				// if capture space has opponent piece
				moves.push({
					row: nextRow,
					col: targetCol
				})
			} else if (enPassTarget !== null && enPassTarget[0] === nextRow && enPassTarget[1] === targetCol) {
				// if capture space is en passant square
				moves.push({
					row: nextRow,
					col: targetCol,
					takenFunc: enPassed,
					args: [row, targetCol]
				})
			}
		}

		return moves
	},
	draw: (x, y, owner) => text(owner ? "p" : "P", x, y)
})
//#endregion

//#region 	MAIN (p5)
function setup() {
	canvas = createCanvas(0, 0).elt
	windowResized()

	ellipseMode(CENTER)
	noLoop()

	let boardArr // for block scope
	; ({board: boardArr, activePlayer, castling: castlingRights, enPassTarget} = parseFEN(START_FEN))

	// global
	selected = null
	activeTargets = []
	preserveEnPass = false
	allTargets = {}
	board = new Board(boardArr)
	allTargets = calcAllTargets()
	loser = null
}

function windowResized() {
	const side = min(windowWidth-17, windowHeight-17)
	resizeCanvas(side, side)

	cellW = side/8

	textSize(0.03*side)
	textAlign(CENTER, CENTER)

	redraw()
}

function draw() {
	background(255)

	// board & pieces
	for (let i = 0, offset = 0; i < 8; i++, offset = i%2) {
		for(let j = 0; j < 8; j++) {
			if ((j + offset) % 2 === 0) {
				stroke(130)
				fill(200)
				rect(j*cellW, i*cellW, cellW)
			}

			if(board.at(i, j) === null) continue

			fill(0)
			board.at(i, j).draw(
				(j + 0.5) * cellW,
				(i + 0.5) * cellW
			)
		}
	}

	if(selected !== null) {
		noStroke()
		fill(255, 255, 0, 48)
		rect(selected.col*cellW, selected.row*cellW, cellW)
	}

	if (activeTargets !== null) {
		for (const {row, col, invalid} of activeTargets) {
			noStroke()
			invalid ? fill(255, 0, 0, 50) : fill(0, 50)
			circle((col + 0.5) * cellW, (row + 0.5) * cellW, 0.8 * cellW)
		}
	}

	if(loser !== null) {
		let names = ["White", "Black"]
		background(0, 100)
		fill(255, 0, 0)
		textSize(0.075*width)
		text(names[+!loser] + " wins!", width / 2, height / 2)
	}
}
//#endregion

//#region 	CLICKING
function mousePressed(event) {
	if(event.target !== canvas) {
		return true
	}

	const row = floor(mouseY/cellW)
		, col = floor(mouseX/cellW)
		, clickedPiece = board.at(row, col)


	if(selected === null) {
		clickNew(row, col, clickedPiece)
	} else {
		if(!tryTargets(row, col)) {
			if(!clickNew(row, col, clickedPiece)) deselect()
		}
	}

	redraw()
}

function clickNew(row, col, clickedPiece) {
	if (clickedPiece === null || clickedPiece.owner !== activePlayer) return false

	selected = {
		row: row,
		col: col,
		piece: clickedPiece
	}
	activeTargets = allTargets[String(row)+col]
	return true
}

function tryTargets(row, col) {
	for (const target of activeTargets) {
		if (target.row === row && target.col === col) {
			board.move(selected.row, selected.col, row, col)
			target.takenFunc?.(target.args) // additional actions for castling/enPass
			endTurn()
			return true
		}
	}
	return false
}

function deselect() {
	selected = null
	activeTargets = []
}
//#endregion

//#region	MOVE CALCULATION

// happens before a turn (end of last turn)
function calcAllTargets() {
	let targets = {count: 0}

	// for each square in the board:
	for (const {value: {i, j}} of traverse8by8()) {

		// filter only for active player's pieces
		const lookingAt = board.at(i, j)
		if (lookingAt === null || lookingAt.owner !== activePlayer) continue

		// get moves according to piece rules
		let moves = lookingAt.getTargets(i, j)

		// remove illegal moves
		for (let moveI = moves.length - 1; moveI >= 0; moveI--) {
			let move = moves[moveI]
			,	parallelUniverse = board.copy()
			parallelUniverse.move(i, j, move.row, move.col)

			if(isChecked(parallelUniverse, activePlayer)) moves.splice(moveI, 1)
		}

		targets[String(i) + j] = moves
		targets.count += moves.length
	}
	return targets
}

function isChecked(source, player) {
	const allTypes = {...PieceType.all}

	let {true: fusions, false: bases} = partitionObject(allTypes, ele => ele instanceof FusionPieceType)

	for(const identifier in bases) {
		console.log(identifier)
		bases[identifier] = {
			piece: bases[identifier],
			associatedFusionIds: []
		}
	}
	for(const piece of Object.values(fusions)) {
		for(const identifier of piece.componentIdentifiers) {
			let list = bases[identifier].associatedFusionIds
			if(!list.includes(piece.identifier)) list.push(piece.identifier)
		}
	}

	for(const linkedPiece of Object.values(bases)) {
		if(isCheckedBy(source, player, linkedPiece)) return true
	}

	return false
}

function isCheckedBy(source, player, {piece, associatedFusionIds}) {
	const kingPos = source.getKingPos(player)
		, args = [source, kingPos[0], kingPos[1], player]

	for (const move of piece.getTargets(...args)) {
		const lookingAt = source.at(move.row, move.col)
		if (
			lookingAt !== null
			&& (piece.identifier === lookingAt.identifier || associatedFusionIds.includes(lookingAt.identifier))
			&& lookingAt.owner !== player
		) return true
	}
	return false
}
//#endregion

//#region	TURN CONTROL
function endTurn() {
	activePlayer = (activePlayer+1) % 2
	deselect()

	if(!preserveEnPass) {
		enPassTarget = null
	}
	preserveEnPass = false

	allTargets = calcAllTargets()
	if(allTargets.count === 0) checkmate(activePlayer)
}

function checkmate(losingPlayer) {
	loser = losingPlayer
}
//#endregion

//#region	PIECE MOVED FUNCTIONS
function setEnPass(square) {
	preserveEnPass = true
	enPassTarget = square
}
function enPassed(square) {
	board.reset(square)
}
//#endregion

//#region	PARSING FEN
function parseFEN(fen) {
	const invalid = () => Error("Invalid FEN") // arrowed for correct stack info

	const parts = fen.split(" ")
	if(parts.length > 6 || parts.length === 0) {
		throw invalid()
	}

	const [position, turn, castling, enPass, halfs, turns] = parts

		, board = parsePosition(position)

		, activePlayer = +(turn === "b")

	// ...castling

	// french move
	let enPassTarget
	if(enPass === "-") {
		enPassTarget = null
	} else {
		const [file, rank] = enPass.split()
		,	row = 8 - rank
		,	col = file.charCodeAt(0) - 65
		if(row < 0 || row > 7) throw invalid()
		if(col < 0 || col > 7) throw invalid()
		enPassTarget = [row, col]
	}

	return {board, activePlayer, castling, enPassTarget}
}

function parsePosition(pos) {
	// create null array
	let board = []
	for (let i = 0; i < 8; i++) {
		let row = []
		for (let j = 0; j < 8; j++) {
			row[j] = null
		}
		board[i] = row
	}

	// split position into rows
	const rows = pos.split("/")
	if (rows.length > 8 || rows.length === 0) {
		throw invalid()
	}

	// check and parse each row
	for(let row = 0; row < rows.length; row++) {
		let fenRow = rows[row]
		,	currentCol = 0

		if (fenRow.length < 1 || fenRow.length > 8) {
			throw invalid()
		}

		// convert each row character onto the board
		while (fenRow.length > 0) {
			currentCol += parseChar(fenRow[0], board, row, currentCol)
			fenRow = fenRow.substring(1)
		}
	}
	return board
}

/**
 * @returns Int: How many spaces to advance in the row
 */
function parseChar(char, destBoard, row, col) {
	const num = parseInt(char, 10)

	if (isNaN(num)) {
		// (char) is a letter
		const lowerChar = char.toLowerCase()
		if (!Object.keys(PieceType.all).includes(lowerChar)) {
			throw invalid()
		}

		destBoard[row][col] = char
		return 1
	}

	// (char) is a number
	if (num < 1 || num > 8) {
		throw invalid()
	}
	return num
}
//#endregion


function* traverse8by8() {
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			yield {value: {i, j}, done: false}
		}
	}
}


function partitionObject(object, condition) {
	let partedObj = {
		false: [],
		true: []
	}
	for(const identifier in object) {
		partedObj[condition(object[identifier])][identifier] = object[identifier]
	}
	return partedObj
}


Object.defineProperty(Array.prototype, "remove", {
	value: function(ele) {
	let i = this.indexOf(ele)
	if(i === -1) return -1
	this.splice(i, 1)
	return this.length
}
})


console.log("Script Loaded!");
