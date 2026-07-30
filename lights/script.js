let
  CELL_WIDTH
, CELL_HEIGHT
, CELL_MARGIN_WIDTH
, CELL_MARGIN_HEIGHT
, CELL_SPACE_WIDTH
, CELL_SPACE_HEIGHT
, HINT_DIAMETER
, lights

/** @type {null | {i:int, j:int}[]} */
let hints

function setup() {
	createCanvas().parent("canvas-holder")
	windowResized()
	noStroke()

	resetGridToRandom()
}

function windowResized() {
	let side = min(windowWidth-16, windowHeight-16)
	resizeCanvas(side, side)

	let
	  totalMarginWidth  = width  * CELL_MARGIN_PERCENT
	, totalMarginHeight = height * CELL_MARGIN_PERCENT
	, totalCellWidth  = width  - totalMarginWidth
	, totalCellHeight = height - totalMarginHeight

	CELL_MARGIN_WIDTH  = totalMarginWidth  / (GRID_WIDTH + 1)
	CELL_MARGIN_HEIGHT = totalMarginHeight / (GRID_HEIGHT + 1)
	CELL_WIDTH  = totalCellWidth  / GRID_WIDTH
	CELL_HEIGHT = totalCellHeight / GRID_HEIGHT
	CELL_SPACE_WIDTH  = CELL_MARGIN_WIDTH  + CELL_WIDTH
	CELL_SPACE_HEIGHT = CELL_MARGIN_HEIGHT + CELL_HEIGHT

	HINT_DIAMETER = CELL_WIDTH * HINT_DIAMETER_PERCENT
}

function triggerRandomFlips() {
	for(let j = 0; j < GRID_HEIGHT; j++) {
		for(let i = 0; i < GRID_WIDTH; i++) {
			if(randomBool(0.5))
				triggerFlips(lights, i, j)
		}
	}
}


function resetGridToRandom() {
	hints = null
	lights = createArray(GRID_WIDTH, GRID_HEIGHT, false)
	triggerRandomFlips()
}


function draw() {
	myBackground()

	for(let j = 0; j < GRID_HEIGHT; j++) {
		for(let i = 0; i < GRID_WIDTH; i++) {
			let x = toLeftX(i)
			  , y = toTopY(j)

			lights[j][i] ? fillLit() : fillUnlit()
			rect(x, y, CELL_WIDTH, CELL_HEIGHT)
		}
	}

	if(hints === null)
		return
	for(const {i, j} of hints) {
		fillHint()
		circle(toCenterX(i), toCenterY(j), HINT_DIAMETER)
	}
}


function mousePressed() {
	const i = toI(mouseX)
	    , j = toJ(mouseY)

	if(isInvalid(lights, i, j))
		return

	triggerFlips(lights, i, j)
	
	if(hints !== null) {
		calculateHints()
	}
}

function triggerFlips(grid, i, j) {
	flipSingleSafe(grid, i, j)
	flipSingleSafe(grid, i-1, j)
	flipSingleSafe(grid, i+1, j)
	flipSingleSafe(grid, i, j-1)
	flipSingleSafe(grid, i, j+1)
}

function flipSingleSafe(grid, i, j) {
	if(isInvalid(grid, i, j))
		return

	flipSingleUnchecked(grid, i, j)
}
function flipSingleUnchecked(grid, i, j) {
	const oldValue = grid[j][i]
	grid[j][i] = !oldValue
}


document.getElementById("solve-button").addEventListener("click", calculateHints)
document.getElementById("randomize-button").addEventListener("click", resetGridToRandom)


function calculateHints() {
	hints = []
	const solutionTriggers = getSolveTriggers(lights)
	for(let j = 0; j < GRID_HEIGHT; j++) {
		for(let i = 0; i < GRID_WIDTH; i++) {
			if(!solutionTriggers[j][i])
				continue

			hints.push({i, j})
		}
	}
}


function isInvalid(grid, i, j) {
	return (
		   i < 0
		|| j < 0
		|| j >= grid.length
		|| i >= grid[j].length
	)
}


function toLeftX(i) {
	return i * CELL_SPACE_WIDTH + CELL_MARGIN_WIDTH
}
function toTopY(j) {
	return j * CELL_SPACE_HEIGHT + CELL_MARGIN_HEIGHT
}

function toCenterX(i) {
	return toLeftX(i) + CELL_WIDTH / 2
}
function toCenterY(j) {
	return toTopY(j) + CELL_HEIGHT / 2
}

function toI(x) {
	return Math.floor((x - CELL_MARGIN_WIDTH) / CELL_SPACE_WIDTH)
}
function toJ(y) {
	return Math.floor((y - CELL_MARGIN_HEIGHT) / CELL_SPACE_HEIGHT)
}

/** In reading order, from 0 */
function toFlatIndex(i, j) {
	return j*GRID_WIDTH + i
}
/** @param flatIndex In reading order, from 0 */
function toIndices(flatIndex) {
	return {
	    i: flatIndex % GRID_WIDTH
	  , j: Math.floor(flatIndex / GRID_WIDTH)
	}
}


function randomBool(truePercent) {
	return Math.random() < truePercent
}