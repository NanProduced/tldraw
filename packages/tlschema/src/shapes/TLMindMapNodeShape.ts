import { T } from '@tldraw/validate'
import { TLRichText, richTextValidator, toRichText } from '../misc/TLRichText'
import { createShapePropsMigrationIds, createShapePropsMigrationSequence } from '../records/TLShape'
import { RecordProps } from '../recordsWithProps'
import { StyleProp } from '../styles/StyleProp'
import { DefaultColorStyle, TLDefaultColorStyle } from '../styles/TLColorStyle'
import { DefaultFillStyle, TLDefaultFillStyle } from '../styles/TLFillStyle'
import { DefaultFontStyle, TLDefaultFontStyle } from '../styles/TLFontStyle'
import { DefaultHorizontalAlignStyle, TLDefaultHorizontalAlignStyle } from '../styles/TLHorizontalAlignStyle'
import { DefaultSizeStyle, TLDefaultSizeStyle } from '../styles/TLSizeStyle'
import { DefaultVerticalAlignStyle, TLDefaultVerticalAlignStyle } from '../styles/TLVerticalAlignStyle'
import { TLBaseShape } from './TLBaseShape'

export const MindMapNodeColorScheme = StyleProp.defineEnum('tldraw:mindMapColorScheme', {
	defaultValue: 'default',
	values: ['default', 'ocean', 'forest', 'sunset'],
})

export type TLMindMapNodeColorScheme = T.TypeOf<typeof MindMapNodeColorScheme>

export interface TLMindMapNodeShapeProps {
	colorScheme: TLMindMapNodeColorScheme
	color: TLDefaultColorStyle
	fill: TLDefaultFillStyle
	size: TLDefaultSizeStyle
	font: TLDefaultFontStyle
	align: TLDefaultHorizontalAlignStyle
	verticalAlign: TLDefaultVerticalAlignStyle
	richText: TLRichText
	w: number
	h: number
	growY: number
	scale: number
	isCollapsed: boolean
	level: number
}

export type TLMindMapNodeShape = TLBaseShape<'mindmap-node', TLMindMapNodeShapeProps>

export const mindMapNodeShapeProps: RecordProps<TLMindMapNodeShape> = {
	colorScheme: MindMapNodeColorScheme,
	color: DefaultColorStyle,
	fill: DefaultFillStyle,
	size: DefaultSizeStyle,	font: DefaultFontStyle,
	align: DefaultHorizontalAlignStyle,
	verticalAlign: DefaultVerticalAlignStyle,
	richText: richTextValidator,
	w: T.nonZeroNumber,
	h: T.nonZeroNumber,
	growY: T.positiveNumber,
	scale: T.nonZeroNumber,
	isCollapsed: T.boolean,
	level: T.number,
}

const mindMapNodeShapeVersions = createShapePropsMigrationIds('mindmap-node', {
	InitialVersion: 1,
})

export { mindMapNodeShapeVersions as mindMapNodeShapeVersions }

export const mindMapNodeShapeMigrations = createShapePropsMigrationSequence({
	sequence: [
		{
			id: mindMapNodeShapeVersions.InitialVersion,
			up: (_props) => {
				// noop - initial version
			},
			down: 'retired',
		},
	],
})
