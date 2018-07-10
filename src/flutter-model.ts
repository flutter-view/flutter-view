export interface Widget {
	name: string
	value?: string
	params?: Param[]

	line?: number
	column?: number
}

export interface Param {
	type: 'literal' | 'expression' | 'widget' | 'widgets'
	name: string
	value: string | Widget | Widget[]

	line?: number
	column?: number
}

export interface Reference {
	type: 'method'
	name: string
}

export interface MethodReference extends Reference {
	type: 'method'
}