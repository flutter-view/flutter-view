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

export interface CSSStyleValue {
	type: string
}

export interface CSSURL extends CSSStyleValue {
	type: 'url'
	url: string
}

export interface CSSAssetURL extends CSSStyleValue {
	type: 'asset'
	url: string
}

export interface CSSLinearGradientURL extends CSSStyleValue {
	type: 'linear-gradient'
	angle?: number
	colors: CSSColorStop[]
}

export interface CSSColorStop {
	color: string,
	percentage?: number
}

export enum ToDirection {
	top = 'top',
	topRight = 'top right',
	right = 'right',
	bottomRight = 'bottom right',
	bottom = 'bottom',
	bottomLeft = 'bottom left',
	left = 'left',
	topLeft = 'top left'
}
