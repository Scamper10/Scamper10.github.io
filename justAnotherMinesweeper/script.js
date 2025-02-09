/* TODO:
	diff dropdown color on win
	feedback for when (flags >= mines)
		dig all unflagged button
	*custom difficulty
	better mine generation (density etc)
	false flags revealed on loss
	correct flags stay on loss
	flag colors
*/


// settings
let touchModifyTime = 10 // frames
let rectHandling = "square" // square, stretch
let difficulty = { // map should be bigger than 3x3
	rows: 10,
	cols: 10,
	mines: 10
} // 0-2, or an object as in difficulty.js
let currFlagColIdx = 0
function colors() {
	uiBaseCol = color(0, 127, 0)
	uiWinCol = color(0, 0, 255)
	uiLoseCol = color(255, 0, 0)
	uiTextCol = color(255)
	icoBgCol = color(140, 200, 60)
	icoBgColDark = color(0, 84, 0)
	customDiffBorderCol = color(0, 127, 0)
	customDiffBgCol = color(0, 84, 0)
	coverCol = color(127)
	safeCol = color(242, 192, 84)
	mineBgCol = color(237, 34, 93)
	highlightCol = color(255, 31, 255, 63)
	numColors = [
		color(0, 0),        // 0, transparent
		color(0, 0, 255),   // 1, blue
		color(0, 255, 0),   // 2, green
		color(255, 0, 0),   // 3, red
		color(0, 0, 127),   // 4, dark blue
		color(127, 0, 0),   // 5, dark red
		color(0, 127, 127), // 6, teal
		color(31, 31, 31),  // 7, dark grey
		color(127, 0, 127)  // 8, purple
	]
	flagCols = [
		color(255, 0, 0),   // 0, red
		color(255, 165, 0), // 1, orange
		color(255, 255, 0), // 2, yellow
		color(0, 255, 0),   // 3, green
		color(0, 0, 255),   // 4, blue
		color(127, 0, 127), // 5, purple
	]
}

let gameConBaseX

let map = []
	, rows
	, cols
	, mines
	, cellW
	, cellH
	, halfCellW
	, halfCellH
	, horizCenterOS
	, gameOver
	, digged
	, flags
	, uiClickables = []
	, touchTime = null
	, touchInp = null
	, touchDown = false
	, touchHeld = false
	, customizeDiff = false
	, customizeBg = null

// on startup
function setup() {
	canvas = createCanvas(windowWidth - 15, windowHeight - 15)

	imgStart()

	mainUI()

	colors()
	newLevel()
}

// every frame
function draw() {
	if (customizeDiff) {
		customizeDiffDraw()
		touchUpdate()
	} else {
		background(36) // webpage bg is color(18)
		touchUpdate()
		gameCon.draw()
		uiCon.draw()
	}
}
function drawFncs() {
	uiCon.myDraw = function () {
		// background
		switch (gameOver) {
			default:
				fill(uiBaseCol)
				break
			case "won":
				fill(uiWinCol)
				break
			case "lost":
				fill(uiLoseCol)
				break
		}
		noStroke()
		rect(0, 0, uiCon.w, uiCon.h)

		// icons
		// vars
		let mineIcoX = uiCon.h * 0.1
		let mineIcoY = uiCon.h * 0.1
		let mineIcoSize = uiCon.h * 0.8
		//
		let flaglessIcoX = uiCon.w * 0.25
		let flaglessIcoY = uiCon.h * 0.1
		let flaglessIcoSize = uiCon.h * 0.8

		// bgs
		fill(icoBgCol)
		rect(mineIcoX, mineIcoY, mineIcoSize, mineIcoSize)
		rect(flaglessIcoX, flaglessIcoY, flaglessIcoSize, flaglessIcoSize)

		// icons
		mineIco.show(mineIcoX, mineIcoY, mineIcoSize, mineIcoSize)
		flaglessIco.show(flaglessIcoX, flaglessIcoY, flaglessIcoSize, flaglessIcoSize)

		// text
		fill(uiTextCol)
		textAlign(LEFT, CENTER)
		textSize(0.6 * uiCon.h)
		text(mines, uiCon.h * 1.05, uiCon.h * 0.55)
		text(mines - flags, uiCon.w * 0.335, uiCon.h * 0.55)

		// difficulty selector
		for (let btn of uiClickables) {
			btn.draw()
		}
	}

	gameCon.myDraw = function () {
		for (let row of map) {
			for (let cell of row) {
				cell.draw()
			}
		}
	}
}

function customizeDiffDraw() {
	const c = createVector(width / 2, height / 2)

	// background image
	image(customizeBg, 0, 0)
	background(0, 50)

	// big box
	uiClickables[0].draw()

	// inputs
	const labAlign = c.x - 0.2 * width
	const labYOs = 0.035 * height
	const txts = ["Rows", "Columns", "Mines"]
	for (let i = 1; i < 4; i++) {
		// box
		const box = uiClickables[i]
		box.draw()

		// label
		textAlign(LEFT, CENTER)
		textSize(0.04 * width)
		fill(255)
		stroke(0)
		text(txts[i - 1], labAlign, box.y + labYOs)
	}
	NumIn.cursorT++
	NumIn.cursorT %= 60

	// title
	textAlign(CENTER, CENTER)
	textSize(0.06 * width)
	text("Custom Difficulty", c.x, 0.32 * height)
}

// on mousedown, return after click is processed
function mousePressed() {
	let conditsResult = clickConditions()
	if (conditsResult !== null) {
		return conditsResult
	}
	if (gameOver) {
		newLevel()
	} else {
		cellClick(mouseX - gameCon.absX, mouseY - gameCon.absY) // abs values already set
	}
}

// if click absorbed, return bool for contextMenu
// else return null
function clickConditions() {

	// canvas check
	if (!inBounds(mouseX, mouseY)) {
		return true
	}

	let absorb = false
	for (let item of uiClickables.toReversed()) {
		if (item.tryClick(mouseX, mouseY)) {
			absorb = true
		}
	}
	if (absorb) {
		return false // seperate so all outsideClicks run
	}

	if (!gameCon.inBounds(mouseX, mouseY)) {
		return false
	}
	return null
}

function touchStarted() {
	if (gameOver) {
		newLevel()
		return
	}
	if (touchTime < 0) {
		touchInp = "double"
		touchTime = null
		// handle double
		mouseButton = RIGHT
		mousePressed()
	} else {
		touchInp = "single"
		touchTime = -touchModifyTime
	}
	touchDown = true
}

function touchEnded() {
	touchDown = false
}

function touchUpdate() {
	if (touchDown) {
		if (touchTime !== null && touchTime >= 0) {
			touchHeld = true
			touchInp = null
		} else {
			touchHeld = false
		}
	} else {
		if (touchHeld) {
			touchHeld = false
			touchTime = null
		} else if (touchTime == 0) {
			touchInp = "single"
			touchTime = null
			// handle single
			mouseButton = LEFT
			mousePressed()
			return
		}
	}
	if (touchTime !== null) {
		touchTime++
	}
}

function cellClick(x, y) {
	let clickC = floor(x / cellW)
	let clickR = floor(y / cellH)
	if (touchInp !== null) {
		switch (touchInp) {
			case "single":
				map[clickR][clickC].lClick()
				break
			case "double":
				map[clickR][clickC].rClick()
				break
		}
	}
	else {
		switch (mouseButton) {
			case LEFT:
				map[clickR][clickC].lClick()
				break
			case RIGHT:
				map[clickR][clickC].rClick()
				break
		}
	}
}

function keyPressed() {
	if (keyCode === BACKSPACE) {
		NumIn.active?.back()
	} else {
		NumIn.active?.type(key)
	}
}


function imgStart() {
	mineIco = new IcoSkele("mineIco.png")
	flaglessIco = new IcoSkele("flaglessIco.png")
	// coggIco = new IcoSkele("coggIco.png")
}


// new level var setup, calls genMap
function newLevel() {
	setDifficulty(difficulty)
	cellW = gameConBaseW / cols
	cellH = gameConBaseH / rows
	if (rectHandling == "square") {
		cellW = min(cellW, cellH)
		cellH = min(cellW, cellH)
	}
	halfCellW = cellW / 2
	halfCellH = cellH / 2
	gameOver = null
	digged = 0
	flags = 0
	gameCon.w = cellW * cols
	gameCon.h = cellH * rows
	gameCon.x = gameConBaseX + (gameConBaseW - gameCon.w) / 2
	genMap()
}

// new level structure
function genMap() {
	map = []
	for (let i = 0; i < rows; i++) {
		map.push([])
		for (let j = 0; j < cols; j++) {
			map[i].push(new Cell(i, j))
		}
	}
}

// add mines, calcs risks
function genMines(startCell) {
	let availablePlaces = map.flat().filter(item => ![...startCell.neighbours, startCell].includes(item))
	let numToPlace = mines
	while (numToPlace > 0) {
		// pick target from available cells
		let targetIdx = floor(random(availablePlaces.length))
		let target = availablePlaces[targetIdx]

		// place mine and update placing logic
		target.tile = "mine"
		availablePlaces.splice(targetIdx, 1)
		numToPlace--

		// do risks
		for (let cell of target.neighbours) {
			cell.risk++
		}

		// exit early if no cells left
		if (availablePlaces.length == 0) {
			mines -= numToPlace
			break
		}
	}
}

function lose() {
	for (let row of map) {
		for (let cell of row) {
			if (cell.tile == "mine") {
				cell.cover = false
			}
		}
	}
	gameOver = "lost"
}

function win() {
	if (gameOver != "lost") {
		gameOver = "won"
	}
}

function customDiffSelect() {
	customizeDiff = true

	//#TODO doesn't work on mobile
	// screenshot for background
	customizeBg = createGraphics(width, height)
	customizeBg.copy(
		canvas, 0, 0, width, height,
		0, 0, width, height
	)

	uiClickables = []

	// big box
	let bg = new Clickable(
		0.2 * width,
		0.25 * height,
		0.6 * width,
		0.5 * height
	)
	bg.draw = function () {
		stroke(customDiffBorderCol)
		strokeWeight(3)
		fill(customDiffBgCol)
		rect(this.x, this.y, this.w, this.h, 10)
	}
	bg._onClick = function () { }
	bg._onOutsideClick = function () {
		customizeDiff = false
		mainUI()
		return true
	}
	uiClickables.push(bg)

	// create input boxes
	const defs = [rows, cols, mines]
	const c = createVector(width / 2, height / 2)
	const left = c.x + 0.1 * width
	for (let i = 0; i < 3; i++) {
		uiClickables.push(new NumIn(
			left,
			(0.395 + 0.09 * i) * height,
			0.1 * width,
			0.07 * height,
			defs[i]
		))
	}
}

function mainUI() {
	uiClickables = []
	let side = min(windowWidth - 15, windowHeight - 15)

	uiCon = new Container(width / 2 - side / 2, 0, side, 0.09 * side)
	gameConBaseX = 0.05 * width
	gameConBaseW = 0.9 * width
	gameConBaseH = 0.9 * height
	gameCon = new Container(gameConBaseX, 0.1 * side, gameConBaseW, gameConBaseH)
	drawFncs()

	diffDropdown = new DiffDropdown(uiCon.w * 0.5, uiCon.h * 0.15, uiCon.h * 2, uiCon.h * 0.7)
	uiCon.push(diffDropdown)
	uiClickables.push(diffDropdown)
}

// 2 args: returns true if a point is on the canvas, otherwise false
// 6 args: same but for area specified by args 3-6
function inBounds(x, y, left = 0, top = 0, w = width, h = height) {
	return (x > left && x < w + left && y > top && y < h + top)
}

// prevent default right click
document.addEventListener('contextmenu', prevRC)
function prevRC(event) {
	if (event.target == canvas.canvas) {
		if (inBounds(event.offsetX, event.offsetY)) {
			event.preventDefault();
		}
	}
}

String.prototype.toTitleCase = function () {
	let str = this.toCamelCase()
	return str.substring(0, 1).toUpperCase().concat(str.substring(1))
}

String.prototype.toCamelCase = function () {
	let str = this
	let id = str.indexOf(" ")
	while (id != -1) {
		str = str.substring(0, id).concat(str.substring(id + 1, id + 2).toUpperCase(), str.substring(id + 2))
		id = str.indexOf(" ")
	}
	return str
}

//#db
console.showMap = {
	risks: (page = 1) => {
		if (digged == 0) {
			console.warn("Not generated")
			return
		}
		const MAX_TABLE_WIDTH = 20
		let max = ceil(cols / MAX_TABLE_WIDTH)
		let start = (page - 1) * MAX_TABLE_WIDTH
		if (page >= max) {
			page = max
			start = cols - MAX_TABLE_WIDTH
		}
		console.log(`Showing page ${page} of ${max}`)
		let array = []
		for (let i = start; i < cols; i++) {
			array.push("" + i)
		}
		console.table(
			map.map((row) => row.map((cell) => {
				if (cell.tile == "mine") {
					return ""
				}
				return cell.risk
			})), array
		)
	},
	covers: (page = 1) => {
		const MAX_TABLE_WIDTH = 20
		let max = ceil(cols / MAX_TABLE_WIDTH)
		let start = (page - 1) * MAX_TABLE_WIDTH
		if (page >= max) {
			page = max
			start = cols - MAX_TABLE_WIDTH
		}
		console.log(`Showing page ${page} of ${max}`)
		let array = []
		for (let i = start; i < cols; i++) {
			array.push("" + i)
		}
		console.table(
			map.map((row) => row.map((cell) => {
				if (cell.cover) {
					return 1
				}
				return 0
			})), array
		)
	}
}
