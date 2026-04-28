import { T } from '@tldraw/validate'
import { createShapePropsMigrationIds, createShapePropsMigrationSequence } from '../records/TLShape'
import { RecordProps } from '../recordsWithProps'
import { DefaultColorStyle, TLDefaultColorStyle } from '../styles/TLColorStyle'
import { TLBaseShape } from './TLBaseShape'

/**
 * Properties for a card stack shape. Card stacks are containers that organize multiple note shapes
 * in a stacked layout. When collapsed, only the top card is visible with a count indicator.
 * When expanded, cards fan out in a semi-circular arrangement.
 *
 * @public
 */
export interface TLCardStackShapeProps {
	/** Width of the stack container */
	w: number
	/** Height of the stack container */
	h: number
	/** Whether the stack is expanded (cards fanned out) or collapsed */
	isExpanded: boolean
	/** The angle (in degrees) for the fan layout when expanded */
	fanAngle: number
	/** Gap between cards when stacked */
	cardGap: number
	/** Color style for the stack border and indicators */
	color: TLDefaultColorStyle
	/** Display name for the stack */
	name: string
}

/**
 * A card stack shape that acts as a container for organizing note shapes.
 * Card stacks provide a way to group and manage multiple notes in a compact,
 * stackable format with collapse/expand behavior.
 *
 * @public
 */
export type TLCardStackShape = TLBaseShape<'card-stack', TLCardStackShapeProps>

/**
 * Validation schema for card stack shape properties.
 *
 * @public
 */
export const cardStackShapeProps: RecordProps<TLCardStackShape> = {
	w: T.nonZeroNumber,
	h: T.nonZeroNumber,
	isExpanded: T.boolean,
	fanAngle: T.number,
	cardGap: T.positiveNumber,
	color: { validate: (v: unknown) => DefaultColorStyle.validate(v) as TLDefaultColorStyle },
	name: T.string,
}

const Versions = createShapePropsMigrationIds('card-stack', {
	InitialVersion: 1,
})

/**
 * Version identifiers for card stack shape migrations.
 *
 * @public
 */
export { Versions as cardStackShapeVersions }

/**
 * Migration sequence for card stack shapes.
 *
 * @public
 */
export const cardStackShapeMigrations = createShapePropsMigrationSequence({
	sequence: [
		{
			id: Versions.InitialVersion,
			up: (_props) => {
				// No migration needed for initial version
			},
			down: 'retired',
		},
	],
})
