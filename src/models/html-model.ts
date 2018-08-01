export interface Element {
	type: 'tag' | 'text'
}

export interface Tag {
	type: 'tag',
	name: string
	attribs?: Map<string, string>
	children?: Element[]
}

export interface Text {
	type: 'text',
	data: string
}
