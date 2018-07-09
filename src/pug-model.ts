export interface Node {
	type: 'Block' | 'Tag'
	line: number
	column?: number
}

export interface Block extends Node {
	type: 'Block'
	nodes: Node[]
}

export interface Tag extends Node {
	type: 'Tag'
	name: string
	selfClosing: boolean
	block: Block
	attrs?: Attribute[]
	// attributeBlocks?: AttributeBlock[]
	isInline?: boolean

}

export interface Attribute {
	name: string
	val: string
	mustEscape: boolean
}
