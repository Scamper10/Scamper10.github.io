function TextMissingURLParamDefaulted(missingParamKey, defaultValueParamKey) {
	return `Could not get valid ${missingParamKey} from URL search parameters, falling back to ${defaultValueParamKey}`
}

/**
 * @param {string[]} missingParamKeys
 * @param {any[]} defaults
 */
function TextMissingManyURLParamsDefaulted(missingParamKeys, defaults) {
	return `Could not get valid values for search params: [ ${missingParamKeys.join(", ")} ], using defaults [ ${defaults.join(", ")} ]`
}