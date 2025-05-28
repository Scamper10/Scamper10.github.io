//	Forsyth-Edwards Notation
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0"



//#region 	MAIN (p5)
function preload() {
	imgs = new ImageManager()
	for(const type of PieceType.all) type.loadRequiredImages?.(imgs)
}

function setup() {
	canvas = createCanvas(0, 0).elt
	windowResized()

	ellipseMode(CENTER)
	imageMode(CENTER)
	noLoop()

	let boardArr // for block scope

	// destructure from FEN (mixed scope)
	; ({
		board: boardArr
	  , activePlayer
	  , castling: castlingRights
	  , enPassTarget
	} = parseFEN(START_FEN))

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
				strokeWeight(1)
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

	// highlight
	if(selected !== null) {
		noStroke()
		fill(255, 255, 0, 48)
		rect(selected.col*cellW, selected.row*cellW, cellW)
	}

	// targets
	if (activeTargets !== null) {
		for (const target of activeTargets) {
			target.draw()
		}
	}

	// win screen
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
			target.take(selected)
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
	for (const {i, j} of traverse8by8()) {

		// filter only for active player's pieces
		const lookingAt = board.at(i, j)
		if (lookingAt === null || lookingAt.owner !== activePlayer) continue

		// get moves for current piece
		let moves = lookingAt.getTargets(i, j)

		// remove moves that end turn in check
		// for (let moveI = moves.length - 1; moveI >= 0; moveI--) {
		// 	let move = moves[moveI]
		// 	,	parallelUniverse = board.copy()
		// 	parallelUniverse.move(i, j, move.row, move.col)

		// 	if(isChecked(parallelUniverse, activePlayer)) moves.splice(moveI, 1)
		// }

		targets[String(i) + j] = moves
		targets.count += moves.length
	}
	return targets
}

function isChecked(board, player, forceKingPos = null) {
	for(const {i, j} of traverse8by8()) {
		let lookingAt = board.at(i, j)
		if(lookingAt === null || lookingAt.owner === player) continue

		let	possibleMoves = lookingAt.getTargets(i, j, true)
		,	kingPos = forceKingPos ?? board.getKingPos(player)

		for(const move of possibleMoves) {
			if(move.row === kingPos[0] && move.col === kingPos[1]) return true
		}
	}

	return false
}

function loseCastleSide(owner, row, col) {
	let startRow = 7*!owner
	if(row !== startRow) return null

	if(col === 0) return 0b10
	else if(col === 7) return 0b01
	else return null
}

function getCastleTargets(board, row, col, owner) {
	let moves = []

	for(const side of [0b10, 0b01]) {
		if(canCastle(board, side, owner)) {
			moves.push(new Target({
				board
			  , row
			  , col: col-side*4+6
			  , takenFunc: doCastle
			  , args: [board, owner, side]
			  , specialDraw: function() {
					let centerX = (this.col + 0.5) * cellW
					,	centerY = (this.row + 0.5) * cellW

					text(activePlayer ? "r" : "R", centerX, centerY)

					let lowY = centerY + 0.2*cellW
					,	sign = (3 - side*2)
					,	farXDist = sign * 0.1*cellW
					,	arrowDelta = sign * 0.05*cellW

					stroke(0, 50)
					strokeWeight(2)
					line(
						centerX - farXDist, lowY
					  ,	centerX + farXDist, lowY
					)
					centerX -= farXDist
					beginShape(); {
						vertex(centerX + arrowDelta, lowY - arrowDelta)
						vertex(centerX, lowY)
						vertex(centerX + arrowDelta, lowY + arrowDelta)
					} endShape()
				}
			}))
		}
	}

	return moves
}

// assumes normal initial king and rook positions
// (aka VERY hard-coded)
function canCastle(board, side, owner) {
	const kingCol = 4

	if(!(castlingRights[owner] & side)) return false

	let row = 7*!owner
	,	isLeftSide = side > 0b01 // bool
	,	checkDir = 1 - 2*isLeftSide // sign: which way to search columns
	,	firstCol = kingCol + checkDir // first column to search, always next to king

	for(let i = 0, col = firstCol; i < side+1; i++, col += checkDir) {

		// path must be empty
		if(board.at(row, col) !== null) return false

		// king cannot castle through check
		// don't need to check final king pos as it happens later
		if(abs(col-kingCol) > 1) continue
		if(isChecked(board, owner, [row, col])) return false
	}

	return true
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

/** @argument {Number} side - A two-bit value with only one bit set */
function loseCastle(player, side = null) {
	if(side === null) {
		castlingRights[player] = 0
		return
	}

	castlingRights[player] &= side^0b11 // turn off the passed bit
}

function doCastle(board, owner, side) {
	// with respect to rook:
	const row = 7*!owner
		, startCol = 7*!(side-1)
		, targetCol = 7-side*2
	board.move(row, startCol, row, targetCol)
	loseCastle(owner, side)
}
//#endregion

//#region	PARSING FEN
function parseFEN(fen) {
	const invalid = () => Error("Invalid FEN") // arrowed for correct stack info

	const parts = fen.split(" ")
	if(parts.length > 6 || parts.length === 0) {
		throw invalid()
	}

	const [position, turn, castlingStr, enPass, halfs, turns] = parts

		, board = parsePosition(position)

		, activePlayer = +(turn === "b")

	let castling = parseCastling(castlingStr)

	// french move
	let enPassTarget = enPass === "-" ? null : (() => {
		const [file, rank] = enPass.split("")
		,	row = 8 - rank
		,	col = file.charCodeAt(0) - 97
		if(row < 0 || row > 7) throw invalid()
		if(col < 0 || col > 7) throw invalid()
		return [row, col]
	})()

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

/** @returns Int: How many spaces to advance in the row */
function parseChar(char, destBoard, row, col) {
	const num = parseInt(char, 10)

	if (isNaN(num)) {
		// (char) is a letter
		const lowerChar = char.toLowerCase()
		if (![...PieceType.ids].includes(lowerChar)) {
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

function parseCastling(str) {
	let castling = { 0: 0, 1: 0 }
	if (str === "-") return castling // shortcut

	// could use for(const player of [0, 1])
	if (str.includes("K")) {
		castling[0] |= 0b01
	}
	if (str.includes("Q")) {
		castling[0] |= 0b10
	}
	if (str.includes("k")) {
		castling[1] |= 0b01
	}
	if (str.includes("q")) {
		castling[1] |= 0b10
	}

	return castling
}
//#endregion


function* traverse8by8() {
	for(let i = 0; i < 8; i++) {
		for(let j = 0; j < 8; j++) {
			yield {i, j}
		}
	}
}


/** Shallow copies key/value pairs into their respective group */
function partitionObject(object, condition) {
	let partedObj = {
		false: {},
		true: {}
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

Object.defineProperty(String.prototype, "indexOfRegex", {
	value: function(regex) {
		return this.match(regex)?.index ?? -1
	}
})

Object.defineProperty(String.prototype, "lastIndexOfRegex", {
	value: function(regex) {
		let index
		for(index = this.length-1; index > -1; index--) {
			if(this[index].match(regex) !== null) break
		}
		return index
	}
})


console.log("Chess: Script Loaded!");
