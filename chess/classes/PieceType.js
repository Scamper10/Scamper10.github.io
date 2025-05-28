class PieceType {
	static #list = {}
	
	static all = {*[Symbol.iterator]() {
		for(const type of Object.values(PieceType.#list)) {
			yield type
		}
	}}

	static ids = {[Symbol.iterator]() {
		return Object.keys(PieceType.#list)[Symbol.iterator]()
	}}

	constructor({
		  identifier
		, getTargets = null
		, draw
		, loadRequiredImages
	}) {
		if(PieceType.#list[identifier] !== undefined) throw Error("PieceType identifiers must be unique")

		this.identifier = identifier
		if(getTargets !== null) this.getTargets = getTargets
		this.loadRequiredImages = loadRequiredImages === PieceType.AUTO ? makeLoadRequiredFunc(identifier) : loadRequiredImages
		this.draw = draw === PieceType.AUTO ? makeDrawFunc(identifier) : draw

		PieceType.#list[identifier] = this
	}

	static getId(id) {
		return PieceType.#list[id]
	}
}

class FusionPieceType extends PieceType {
	constructor({
		  identifier
		, draw
		, loadRequiredImages
		, componentIdentifiers
	}) {
		super({
			  identifier
			, loadRequiredImages
			, draw
		})
		this.componentIdentifiers = componentIdentifiers
	}

	getTargets(...args) {
		let moves = []
		for(const identifier of this.componentIdentifiers) {
			moves.push(...PieceType.getId(identifier).getTargets(...args))
		}
		return moves
	}
}

Object.defineProperty(PieceType, "AUTO", {
	value: "auto"
})

function makeLoadRequiredFunc(id) {
	return function() {
		for(let player = 0; player <= 1; player++) {
			let path = `${player}/${id}`
			loadImage(
				`pieceImgs/${path}.png`
			  , (image) => imgs.add(image, path)
			  , () => {
					let graphics = createGraphics(128, 128)
					graphics.fill(0)
					graphics.textAlign(CENTER, CENTER)
					graphics.textSize(96)
					graphics.text(player ? id : id.toUpperCase(), 64, 64)
					imgs.add(graphics, path)
				}
			)
		}
  	}
}
function makeDrawFunc(id) {
	return function(x, y, owner) {
		let side = 0.75*cellW
		image(imgs.get(`${owner}/${id}`), x, y, side, side)
	}
}
