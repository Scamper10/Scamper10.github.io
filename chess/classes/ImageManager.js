class ImageManager {
	static #slashes = /[/\\]/
	#set = {}
	add(image, path, replace = false) {
		let {name, dir: userDir} = this.#splitPath(path)
		,	targetDir = this.#navToDir(userDir, true)

		if(!replace && targetDir[name] !== undefined) throw Error("Image name already taken, try setting replace = true")

		targetDir[name] = image
	}

	get(path) {
		let {name, dir} = this.#splitPath(path)
		return this.#navToDir(dir, false)[name]
	}

	#navToDir(dir, create) {
		if(dir === "") return this.#set

		let slashIndex
		,	currentDir = this.#set
		while((slashIndex = dir.indexOfRegex(ImageManager.#slashes)) !== -1) {
			if(slashIndex === 0) continue

			let nextKey = dir.slice(0, slashIndex)
			dir = dir.slice(slashIndex+1)

			if(currentDir[nextKey] === undefined) {
				if(!create) throw Error("Requested directory does not exist")
				currentDir[nextKey] = {}
			}
			currentDir = currentDir[nextKey]
		}

		currentDir[dir] ??= {}
		return currentDir[dir]
	}

	#splitPath(path) {
		if(typeof path !== "string") throw Error("Expected a string")

		let lastSlash = path.lastIndexOfRegex(ImageManager.#slashes)
		,	dir = path.slice(0, lastSlash)
		,	name = path.slice(lastSlash+1)

		if(name === "") throw Error("Expected an image path, received only a directory")

		return {dir, name}
	}
}
