export function findAllArgsNamed(s) {
	console.log("finding all args named " + s + " from url " + window.location.href)
	return new URL(window.location.href).searchParams.getAll(s)
}

export function appendArg(url, arg)
{
	if (url.includes("?"))
		return url + "&" + arg
	else
		return url + "?" + arg
}