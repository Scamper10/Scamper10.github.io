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

	const { width:gridWidth, height:gridHeight } = getGridDimensions()

	let
	  totalMarginWidth  = width  * CELL_MARGIN_PERCENT
	, totalMarginHeight = height * CELL_MARGIN_PERCENT
	, totalCellWidth  = width  - totalMarginWidth
	, totalCellHeight = height - totalMarginHeight

	CELL_MARGIN_WIDTH  = totalMarginWidth  / (gridWidth + 1)
	CELL_MARGIN_HEIGHT = totalMarginHeight / (gridHeight + 1)
	CELL_WIDTH  = totalCellWidth  / gridWidth
	CELL_HEIGHT = totalCellHeight / gridHeight
	CELL_SPACE_WIDTH  = CELL_MARGIN_WIDTH  + CELL_WIDTH
	CELL_SPACE_HEIGHT = CELL_MARGIN_HEIGHT + CELL_HEIGHT

	HINT_DIAMETER = Math.min(CELL_WIDTH, CELL_HEIGHT) * HINT_DIAMETER_PERCENT
}

function triggerRandomFlips() {
	const { width, height } = getGridDimensions()
	for(let j = 0; j < height; j++) {
		for(let i = 0; i < width; i++) {
			if(randomBool(0.5))
				triggerFlips(lights, i, j)
		}
	}
}


/** @type {{ width:int, height:int } | undefined} */
let cachedDimensions

function getGridDimensions() {
	if(cachedDimensions)
		return cachedDimensions

	const params = new URL(document.URL).searchParams
	    , widthFromParam = +params.get(WIDTH_URL_PARAM)
	    , heightFromParam = +params.get(HEIGHT_URL_PARAM)

	const {
	    width:resultWidth
	  , height:resultHeight
	} = validateAndDefaultGridDimensions(widthFromParam, heightFromParam)
	
	cachedDimensions = {width: resultWidth, height: resultHeight}
	return cachedDimensions
}

function validateAndDefaultGridDimensions(width, height) {
	const widthIsValid = isValidIntLength(width)
		, heightIsValid = isValidIntLength(height)

	if(widthIsValid) {
		if(heightIsValid)
			return { width, height }
		
		console.warn(TextMissingURLParamDefaulted(HEIGHT_URL_PARAM, WIDTH_URL_PARAM))
		return { width, height:width }
	}
	// width invalid

	if(heightIsValid) {
		console.warn(TextMissingURLParamDefaulted(WIDTH_URL_PARAM, HEIGHT_URL_PARAM))
		return { width:height, height }
	}
	// both invalid

	console.warn(TextMissingManyURLParamsDefaulted(
	    [ WIDTH_URL_PARAM, HEIGHT_URL_PARAM ]
	  , [ MISSING_DIMENSIONS_FALLBACK_WIDTH, MISSING_DIMENSIONS_FALLBACK_HEIGHT ]
	))
	return { width:MISSING_DIMENSIONS_FALLBACK_WIDTH, height:MISSING_DIMENSIONS_FALLBACK_HEIGHT }
}


function resetGridToRandom() {
	deactivateHints()
	const { width, height } = getGridDimensions()
	lights = createArray(width, height, false)
	triggerRandomFlips()
}


function draw() {
	myBackground()

	const { width:gridWidth, height:gridHeight } = getGridDimensions()

	for(let j = 0; j < gridHeight; j++) {
		for(let i = 0; i < gridWidth; i++) {
			let x = toLeftX(i)
			  , y = toTopY(j)

			lights[j][i] ? fillLit() : fillUnlit()
			rect(x, y, CELL_WIDTH, CELL_HEIGHT)
		}
	}

	if(!hintsAreActive())
		return
	for(const {i, j} of hints) {
		fillHint()
		circle(toCenterX(i), toCenterY(j), HINT_DIAMETER)
	}
}


function mousePressed() {
	const i = toI(mouseX)
	    , j = toJ(mouseY)

	if(isLocationInvalid(lights, i, j))
		return

	triggerFlips(lights, i, j)
	
	if(hintsAreActive()) {
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
	if(isLocationInvalid(grid, i, j))
		return

	flipSingleUnchecked(grid, i, j)
}
function flipSingleUnchecked(grid, i, j) {
	const oldValue = grid[j][i]
	grid[j][i] = !oldValue
}


const SOLVE_TOGGLE_BUTTON = document.getElementById("solve-toggle-button")
SOLVE_TOGGLE_BUTTON.addEventListener("click", function(event) {
	if(hintsAreActive()) {
		deactivateHints()
	} else {
		activateHints()
	}
})
SOLVE_TOGGLE_BUTTON.innerText = TextActivateHints


document.getElementById("randomize-button").addEventListener("click", resetGridToRandom)


function hintsAreActive() {
	return hints !== null
}
function deactivateHints() {
	hints = null
	SOLVE_TOGGLE_BUTTON.innerText = TextActivateHints
}
function activateHints() {
	calculateHints()
	SOLVE_TOGGLE_BUTTON.innerText = TextDeactivateHints
}

function calculateHints() {
	hints = []
	const solutionTriggers = getSolveTriggers(lights)
		, { width, height } = getGridDimensions()
	for(let j = 0; j < height; j++) {
		for(let i = 0; i < width; i++) {
			if(!solutionTriggers[j][i])
				continue

			hints.push({i, j})
		}
	}
}


function isLocationInvalid(grid, i, j) {
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
	const { width } = getGridDimensions()
	return j*width + i
}
/** @param flatIndex In reading order, from 0 */
function toIndices(flatIndex) {
	const { width } = getGridDimensions()
	return {
	    i: flatIndex % width
	  , j: Math.floor(flatIndex / width)
	}
}


function randomBool(truePercent) {
	return Math.random() < truePercent
}


function isValidIntLength(number) {
	return number > 0 && Number.isInteger(number)
}