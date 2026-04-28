import { T } from '@tldraw/validate'
import {
	createBindingPropsMigrationIds,
	createBindingPropsMigrationSequence,
} from '../records/TLBinding'
import { RecordProps } from '../recordsWithProps'
import { TLBaseBinding } from './TLBaseBinding'

export interface TLMindMapEdgeBindingProps {
	childAnchor: 'left' | 'right' | 'top' | 'bottom'
	parentAnchor: 'left' | 'right' | 'top' | 'bottom'
}

export type TLMindMapEdgeBinding = TLBaseBinding<'mindmap-edge', TLMindMapEdgeBindingProps>

export const mindMapEdgeBindingProps: RecordProps<TLMindMapEdgeBinding> = {
	childAnchor: T.literalEnum('left', 'right', 'top', 'bottom'),
	parentAnchor: T.literalEnum('left', 'right', 'top', 'bottom'),
}

export const mindMapEdgeBindingVersions = createBindingPropsMigrationIds('mindmap-edge', {
	InitialVersion: 1,
})

export { mindMapEdgeBindingVersions as mindMapEdgeBindingVersions }

export const mindMapEdgeBindingMigrations = createBindingPropsMigrationSequence({
	sequence: [
		{
			id: mindMapEdgeBindingVersions.InitialVersion,
			up: (_props) => {
				// noop - initial version
			},
			down: 'retired',
		},
	],
})
