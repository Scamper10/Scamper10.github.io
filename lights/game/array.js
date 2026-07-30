/**
 * @template T
 * @param {T} defaultValue
 * @returns {T[][]}
 */
function createArray(width, height, defaultValue) {
	function createRow() {
		let row = []
		fillSupplied(row, () => defaultValue, 0, width)
		return row
	}

	let result = []
	fillSupplied(result, createRow, 0, height)
	return result
}

/**
 * @description mutates `array` by replacing values from `start` inclusive to `end` exclusive
 * @template T
 * @param {(i:int) => T} supplier
 * @param {T[]} array
 */
function fillSupplied(array, supplier, start=0, end=array.length) {
	for(let i = start; i < end; i++) {
		array[i] = supplier(i)
	}
}


/**
 * Extra values in a larger array are silently ignored
 * @template T1,T2,R
 * @param {T1[][]} array1
 * @param {T2[][]} array2
 * @param {(value1:T1, value2:T2) => R} mergeFn
 * @returns {R[][]} A new array
 */
function merge2d(array1, array2, mergeFn) {
	let result = []
	const resultHeight = Math.min(array1.length, array2.length)
	for(let j = 0; j < resultHeight; j++) {
		let row = []
		const rowWidth = Math.min(array1[j].length, array2[j].length)
		for(let i = 0; i < rowWidth; i++) {
			row.push(
				mergeFn(array1[j][i], array2[j][i])
			)
		}
		result.push(row)
	}
	return result
}


/**
 * Calls `deepCopy` on elements if it exists,
 * calls itself on Arrays,
 * otherwise uses the element
 * @template T
 * @param {T[]} input
 * @returns {T[]}
 */
function deepCopyArray(input) {
	let result = []
	input.forEach(element => {
		if(typeof element.deepCopy == "function") {
			result.push(element.deepCopy())
		} else if(element instanceof Array) {
			result.push(deepCopyArray(element))
		} else {
			result.push(element)
		}
	})
	return result
}