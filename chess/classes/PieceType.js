class PieceType {
	static all = {}

	constructor({ identifier, getTargets = null, draw }) {
		if (PieceType.all[identifier] !== undefined) throw Error("PieceType identifiers must be unique")

		this.identifier = identifier
		if(getTargets !== null) this.getTargets = getTargets
		this.draw = draw

		PieceType.all[identifier] = this
	}
}

class FusionPieceType extends PieceType {
	constructor({identifier, draw, componentIdentifiers}) {
		super({
			identifier,
			draw
		})
		this.componentIdentifiers = componentIdentifiers
	}

	getTargets(...args) {
		let moves = []
		for(const identifier of this.componentIdentifiers) {
			moves.push(...PieceType.all[identifier].getTargets(...args))
		}
		return moves
	}
}
