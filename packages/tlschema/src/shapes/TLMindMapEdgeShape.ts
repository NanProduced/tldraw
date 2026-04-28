import { createMigrationSequence } from '@tldraw/store'
import { structuredClone } from '@tldraw/utils'
import { T } from '@tldraw/validate'
import { VecModel, vecModelValidator } from '../misc/geometry-types'
import { createShapePropsMigrationIds } from '../records/TLShape'
import { RecordProps, TLPropsMigration, createPropsMigration } from '../recordsWithProps'
import { StyleProp } from '../styles/StyleProp'
import { DefaultColorStyle, TLDefaultColorStyle } from '../styles/TLColorStyle'
import { DefaultDashStyle, TLDefaultDashStyle } from '../styles/TLDashStyle'
import { DefaultSizeStyle, TLDefaultSizeStyle } from '../styles/TLSizeStyle'
import { TLBaseShape } from './TLBaseShape'

export interface TLMindMapEdgeShapeProps {
	color: TLDefaultColorStyle
	dash: TLDefaultDashStyle
	size: TLDefaultSizeStyle
	scale: number
}

export type TLMindMapEdgeShape = TLBaseShape<'mindmap-edge', TLMindMapEdgeShapeProps>

export const mindMapEdgeShapeProps: RecordProps<TLMindMapEdgeShape> = {
	color: DefaultColorStyle,
	dash: DefaultDashStyle,
	size: DefaultSizeStyle,
	scale: T.nonZeroNumber,
}

export const mindMapEdgeShapeVersions = createShapePropsMigrationIds('mindmap-edge', {
	InitialVersion: 1,
})

function propsMigration(migration: TLPropsMigration) {
	return createPropsMigration<TLMindMapEdgeShape>('shape', 'mindmap-edge', migration)
}

export const mindMapEdgeShapeMigrations = createMigrationSequence({
	sequenceId: 'com.tldraw.shape.mindmap-edge',
	retroactive: false,
	sequence: [
		propsMigration({
			id: mindMapEdgeShapeVersions.InitialVersion,
			up: (_props) => {
				// noop - initial version
			},
			down: 'retired',
		}),
	],
})
