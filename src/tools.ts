
export function unquote(text: string) : string {
	if(!text) return ''
	if(text.startsWith('"') && text.endsWith('"')) {
		return text.substring(1, text.length-1)
	}
	if(text.startsWith("'") && text.endsWith("'")) {
		return text.substring(1, text.length-1)
	}
	return text
}

export function multiline(...lines: string[]) : string {
	return lines.join('\n')
}
