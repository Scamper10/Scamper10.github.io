/**
 * @param {boolean[][]} grid
 * @returns {boolean[][]} a representation of the grid, where `true` marks cells that should be triggered
 */
function getSolveTriggers(grid) {
	let initialChaseCopy = deepCopyArray(grid)
	const flippedInFirstChase = lightChase(initialChaseCopy)

	if(!isNotSolved(initialChaseCopy))
		return flippedInFirstChase

	let solutionTriggers
	const finalPattern = 2**grid[0].length - 1
	for(let pattern = 0b1; pattern <= finalPattern; pattern++) {
		let bruteForceCopy = deepCopyArray(initialChaseCopy)

		const flippedTopRowIndices = patternToIndices(pattern)
		for(const i of flippedTopRowIndices) {
			triggerFlips(bruteForceCopy, i, 0)
		}

		const flippedInTestChase = lightChase(bruteForceCopy)

		if(isNotSolved(bruteForceCopy))
			continue

		// solve found
		solutionTriggers = merge2d(flippedInFirstChase, flippedInTestChase, (flippedInFirst, flippedInTest) => Boolean(flippedInFirst ^ flippedInTest))
		for(const i of flippedTopRowIndices) {
			flipSingleUnchecked(solutionTriggers, i, 0)
		}
		return solutionTriggers
	}
}


/**
 * @param {boolean[][]} grid is mutated, assumes square
 * @returns {boolean[][]} a representation of the grid, where `true` marks cells that were triggered
 */
function lightChase(grid) {
	const gridHeight = grid.length
	let flipGrid = createArray(grid[0].length, grid.length, false)
	for(let j = 0; j < gridHeight-1; j++) {
		const nextRowJ = j+1
		    , gridWidth = grid[j].length
		for(let i = 0; i < gridWidth; i++) {
			if(grid[j][i]) {
				triggerFlips(grid, i, nextRowJ)
				// old flipGrid value unchecked as cells are only hit once
				flipGrid[nextRowJ][i] = true
			}
		}
	}
	return flipGrid
}


function isNotSolved(grid) {
	return grid.some(row => row.some(value => value === true))
}


/**
 * @param {int} pattern Interpreted as bits,
 *     where `1` triggers a flip over the corresponding cell.
 *     The LSB corresponds to the lowest index.
 * @returns {int[]} A list of indices specified by the `pattern`
 */
function patternToIndices(pattern) {
	let result = []
	  , i = 0
	while(pattern > 0) {
		const bit = pattern & 1
		if(bit)
			result.push(i)

		pattern >>= 1
		i++
	}
	return result
}