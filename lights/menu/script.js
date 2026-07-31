const SIZE_SELECTOR_CLASS = "set-size"
    , REDIRECT_TARGET = "../game/index.html"
	, SiZE_DATA_ATTRIBUTE = "data-size"


const sizeSelectors = document.getElementsByClassName(SIZE_SELECTOR_CLASS)

for(const element of sizeSelectors) {
	element.addEventListener("click", event => {
		const url = new URL(REDIRECT_TARGET, location)
		    , size = element.getAttribute(SiZE_DATA_ATTRIBUTE)
		url.searchParams.append(WIDTH_URL_PARAM, +size)
		url.searchParams.append(HEIGHT_URL_PARAM, +size)

		location = url
	})
}