export interface Widget {
	class: 'widget'
	generics?: string[]
	id?: string
	name: string
	value?: string
	constant: boolean
	params?: Param[]
	originalName?: string
	pugLine?: number
	pugColumn?: number
}

export interface Param {
	class: 'param',
	type: 'literal' | 'expression' | 'widget' | 'widgets' | 'array' | 'closure' | 'pug-line'
	name?: string
	value: string | Widget | Widget[] | string[]
	resolved: boolean
	originalName?: string
	pugLine?: number
	pugColumn?: number
}
