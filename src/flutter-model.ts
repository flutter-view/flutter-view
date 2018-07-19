export interface Widget {
	class: 'widget'
	name: string
	value?: string
	constant: boolean
	params?: Param[]
}

export interface Param {
	class: 'param',
	type: 'literal' | 'expression' | 'widget' | 'widgets' | 'array'
	name?: string
	value: string | Widget | Widget[]
}

export interface Reference {
	class: 'ref',
	type: 'method'
	name: string
}

export interface MethodReference extends Reference {
	class: 'ref',
	type: 'method'
}
