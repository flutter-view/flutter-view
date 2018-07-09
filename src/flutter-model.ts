export interface Widget {
	name: string
	value?: string
	params?: Param[]
}

export interface Param {
	name: string
	value: string | Widget
}
