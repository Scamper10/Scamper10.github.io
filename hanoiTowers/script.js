const canvHolder = document.getElementById("canvHolder")
	, solveBtn = document.getElementById("solveBtn")
	, stepBtn = document.getElementById("stepBtn")
	, ringSubmBtn = document.getElementById("ringSubm")
	, moveSpdInp = document.getElementById("moveSpdInp")
solveBtnState(0)

// settings
const TOWER_SEP = 300
	, RING_MIN = 70
	, RING_MAX = 300
	, BAD_INP_COL = "#ffc3c3"
	, FRAMERATE = 60
	, TIME_COLORS = {
		// pre-solve
		0: [0, 0, 40],

		// mid-solve
		1: {
			// random?
			false: {
				// solveUsed?
				false: [0, 0, 0],
				true: [0, 100, 40]
			},
			true: {
				// solveUsed?
				false: [240, 100, 40],
				true: [280, 100, 40]
			}
		},

		// post-solve
		2: {
			// random?
			false: {
				// solveUsed?
				false: [120, 100, 60],
				true: [0, 100, 60]
			},
			true: {
				// solveUsed?
				false: [240, 100, 80],
				true: [280, 100, 80]
			}
		}
	}


// program vars
let ringNum = 6
	, shakeTimer = -1
	, lastMode = false // randomize: bool
	, timeTO = null
	, towers
	, selected
	, solveTimer
	, solveStack
	, score
	, time
	, solveUsed

	, activeState
	/*
	0: before solve
	1: solving
	3: solved
	*/

	, RING_SPACE
	, RING_DELTA
	, RING_H
	, RING_SEP
	, R_TXT_SIZE
	, SOLVE_DELAY

//#region   Main
function setup() {
	frameRate(FRAMERATE)
	createCanvas(1, 1).parent(canvHolder)
	windowResized()

	rectMode(CENTER)
	colorMode(HSB)

	applySpd()
	reset(lastMode)
}

function windowResized() {
	const bodyW = document.body.offsetWidth

	// get heights of other elements
	const eles = document.querySelectorAll(
		"body > *:not(#canvHolder):not(canvas):not(#meTxt)"
	)
	let otherHeightSum = 0.06 * windowHeight // make it a lil smaller
	for (const ele of Array.from(eles)) {
		otherHeightSum += ele.offsetHeight
	}

	const w = bodyW - 10 // body margin
	const h = windowHeight - otherHeightSum
	const minH = 0
	const side = min(w, max(minH, h))
	resizeCanvas(side, side)

	canvHolder.style.width = side + "px"
	canvHolder.style.height = side + "px"

	SCALER = side / 1000

	const meTxtW = document.getElementById("meTxt").offsetWidth
	const hW = document.getElementById("header").offsetWidth
	if ((bodyW - 40 - hW) / 2 < meTxtW) {
		meTxt.style.top = "unset"
		meTxt.style.bottom = "-0.5em"
	} else {
		meTxt.style.top = "-0.5em"
		meTxt.style.bottom = "unset"
	}
}

function draw() {
	tick()

	scale(SCALER)
	background(0, 0, 78)

	// towers & rings
	textSize(R_TXT_SIZE)
	textAlign(CENTER, CENTER)
	for (let t = 0; t < towers.length; t++) {
		// draw towers
		fill(0)
		let tX = 500 + TOWER_SEP * (t - 1)
		rect(tX, 650, 50, 400, 10)

		for (let d = towers[t].length - 1; d >= 0; d--) {

			// position rings
			let dSize = towers[t][d]
			let dY
			let dX = tX
			if (d === towers[t].length - 1 && t === selected) {
				dY = 200
				if (shakeTimer > 0) {
					dX += (shakeTimer % 4 - 2) * 10
				}
			} else {
				dY = 845 - RING_SEP - d * (RING_SPACE) - 0.5 * RING_H
			}
			let w = RING_MIN + dSize * RING_DELTA
			let p = (dSize - 1) / (ringNum - 1)
			if (isNaN(p)) {
				p = 0
			}

			// draw rings
			fill(lerp(0, 280, p), 100, 100)
			rect(dX, dY, w, RING_H)
			fill(0)
			text(dSize, dX, dY + 0.05 * RING_H)
		}
	}

	// draw base
	fill(0)
	rect(500, 850, 800, 10, 10)

	// timer
	textSize(48)
	textAlign(RIGHT, TOP)
	fill(getTimeCol())
	const txt = time
		.map(ele => ele.toString().padStart(2, "0")) // fixed lengths
		.join(":")
	text(txt, 980, 20)

	// move count
	textAlign(LEFT, TOP)
	text(score, 20, 20)
}

function tick() {
	if (shakeTimer > 0) {
		shakeTimer--
	}

	if (solveTimer > 0) {
		solveTimer--
	} else if (solveTimer > -1) {
		autoSolveStep()
	}
}

function keyPressed() {
	const active = document.activeElement
	if (active.tagName === "INPUT") {
		if (active.id === "ringInp" && keyCode === ENTER) {
			applyNum()
		}
		return
	}
	if (solveTimer > -1) {
		return
	}
	let num = parseInt(key, 10)
	if (!isNaN(num) && num <= 3 && num >= 1) {
		clickT(num - 1)
	}
}

function mousePressed() {
	if (solveTimer > -1) {
		return
	}
	if (mouseY > 425 * SCALER && mouseY < 875 * SCALER) {
		let clicked = null
		for (let i = 3; i >= 1; i--) {
			if (mouseX < i * width / 3) {
				clicked = i
			}
		}
		if (clicked !== null) {
			clickT(clicked - 1)
		}
	}
}

function touchStarted() {
	mousePressed()
}
//#endregion

//#region   Tower manip
function clickT(t) {
	if (selected === null) {
		if (towers[t].length > 0) {
			selected = t;
		}
	} else if (t === selected) {
		selected = null;
	} else if (towers[selected].at(-1) > towers[t].at(-1)) {
		shakeTimer = 16;
	} else {
		solveStack = []
		moveDisc(selected, t)
		selected = null;
	}
}

function moveDisc(src, dest) {
	// pre-move checks
	if (isSolved()) {
		unsolve()
	} else if (activeState === 0) {
		activeState = 1
		startTimer()
	}

	// move
	towers[dest].push(towers[src].pop())
	score++

	// post-move checks
	if (isSolved()) {
		finishSolve()
	} else if (!lastMode && isReset()) {
		activeState = 0
		score = 0
		resetTimer()
	}
}

function reset(randomize) {
	applyNum()

	lastMode = randomize

	towers = [
		[],
		[],
		[]
	];
	for (let i = ringNum; i > 0; i--) {
		const t = randomize ? floor(random(3)) : 0
		towers[t].push(i);
	}
	selected = null

	activeState = 0
	score = 0
	resetTimer()

	solveStack = [];
	solveTimer = -1
	solveUsed = false
	solveBtnState(0)

	RING_DELTA = (RING_MAX - RING_MIN) / ringNum;
	RING_SPACE = constrain(380 / ringNum, 10, 60)
	RING_H = 5 / 6 * RING_SPACE
	RING_SEP = 1 / 6 * RING_SPACE
	R_TXT_SIZE = 0.8 * RING_H
}
//#endregion

//#region	Timing
function startTimer() {
	timeTO = setInterval(incTimer, 1000);
}

function incTimer() {
	time[2]++
	for (let i = 2; i >= 1; i--) {
		if (time[i] === 60) {
			time[i] = 0
			time[i - 1]++
		}
	}
}

function stopTimer() {
	clearInterval(timeTO)
	timeTO = null
}

function resetTimer() {
	stopTimer()
	time = Array(3).fill(0)
}


function getTimeCol() {
	if (activeState === 0) {
		return color(TIME_COLORS[0])
	}
	return color(TIME_COLORS[activeState][lastMode][solveUsed])
}
//#endregion

//#region   Solving
function startAutoSolve() {
	selected = null
	solveBtnState(1)
	autoSolveStep()
}
function autoSolveStep() {
	solveTimer = SOLVE_DELAY - 1
	solveStep()
}

function solveStep() {
	if (!solveUsed) {
		solveUsed = true
	}
	if (solveStack.length === 0) {

		// if not solved, but stack empty
		solveStack.push(new Instr(false, ringNum, 2))
	}

	const [o, d] = expandStackTop()
	moveDisc(o, d)

	if (towers[2].length === ringNum) {
		finishSolve()
		return
	}
}
function expandStackTop() {

	const instr = solveStack.pop()
		, r = instr.r
		, dest = instr.dest
		, [orig, h] = findRing(r)

	// stop condition
	if (instr.single || r === 1) {
		return [orig, dest]
	}

	if (orig === dest) {
		solveStack.push(new Instr(false, r - 1, dest))
	} else {
		const other = 3 - orig - dest

		// push in reverse order
		solveStack.push(new Instr(false, r - 1, dest))
		solveStack.push(new Instr(true, r, dest))
		if (towers[orig][h + 1] !== undefined || towers[dest].at(-1) < r) {
			solveStack.push(new Instr(false, r - 1, other))
		}
	}

	// re-call until stop condition reached
	return expandStackTop()

	// could be done with while loop
	// but consts not useable in condition
}
function findRing(r) {
	for (let t = 0; t < 3; t++) {
		let tower = towers[t]
		for (let i = 0; i < tower.length; i++) {
			if (tower[i] === r) {
				return [t, i]
			}
		}
	}

	return -1
}

class Instr {
	constructor(single, r, dest) {
		this.single = single
		this.r = r
		this.dest = dest
	}
}


function finishSolve() {
	solveTimer = -1
	stopTimer()
	activeState = 2
	solveStack = []
	solveBtnState(3)
}

function pauseSolve() {
	solveTimer = -1
	solveBtnState(2)
}

function resumeSolve() {
	solveTimer = 0
	selected = null
	solveBtnState(1)
}

function isReset() {
	return towers[0].length === ringNum
}
function isSolved() {
	return towers[2].length === ringNum
}
//#endregion

//#region   Inputs

stepBtn.onclick = function () {
	selected = null
	solveStep()
}

ringSubmBtn.onclick = () => reset(lastMode)
function applyNum() {
	let inp = document.getElementById("ringInp")
		, n = parseInt(inp.value, 10)

	if (n < 1) {
		n = 1
		inp.style.backgroundColor = BAD_INP_COL
	} else if (n > 64) {
		n = 64
		inp.style.backgroundColor = BAD_INP_COL
	} else if (n % 1 > 0) {
		n = Math.round(n)
		inp.style.backgroundColor = BAD_INP_COL
	} else {
		inp.style.backgroundColor = "#ffffff"
	}

	ringNum = n
}

moveSpdInp.max = FRAMERATE
moveSpdInp.onchange = applySpd
function applySpd() {
	const inp = moveSpdInp
	spd = inp.value

	if (spd === "") {
		inp.style.backgroundColor = BAD_INP_COL
		inp.title = "Must be a valid number."
	}
	else if (spd <= 0) {
		inp.style.backgroundColor = BAD_INP_COL
		inp.title = "Must be greater than 0."
		return
	} else if (spd > FRAMERATE) {
		inp.style.backgroundColor = BAD_INP_COL
		inp.title = `Must be less than or equal to ${FRAMERATE}`
		return
	} else {
		SOLVE_DELAY = FRAMERATE / spd
		solveTimer = min(solveTimer, SOLVE_DELAY)
		inp.style.backgroundColor = "#ffffff"
		inp.title = `Must be >0 and ≤${FRAMERATE}`
	}

}

/*
0 - before solve
1 - while solving
2 - after pause
3 - solved
*/
function solveBtnState(n) {
	stepBtn.disabled = n === 1 || n === 3
	solveBtn.disabled = n === 3

	const txts = ["Solve", "Pause", "Resume", "Done"]
	const funcs = [startAutoSolve, pauseSolve, resumeSolve]

	solveBtn.innerHTML = txts[n]
	solveBtn.onclick = funcs[n]
}

function unsolve() {
	solveBtnState(0)
}
//#endregion
