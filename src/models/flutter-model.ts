export interface Widget {
	class: 'widget'
	generics?: string[]
	id?: string
	name: string
	value?: string
	constant: boolean
	params?: Param[]
}

export interface Param {
	class: 'param',
	type: 'literal' | 'expression' | 'widget' | 'widgets' | 'array' | 'closure'
	name?: string
	value: string | Widget | Widget[] | string[]
	resolved: boolean
}
