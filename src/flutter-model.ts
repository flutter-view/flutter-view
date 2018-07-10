export interface Widget {
	name: string
	value?: string
	params?: Param[]

	line?: number
	column?: number
}

export interface Param {
	type: 'literal' | 'reference' | 'widget' | 'widgets'
	name: string
	value: string | Widget | Widget[]

	line?: number
	column?: number
}
