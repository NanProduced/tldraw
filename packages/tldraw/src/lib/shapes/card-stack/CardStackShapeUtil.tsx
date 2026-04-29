/* eslint-disable react-hooks/rules-of-hooks */
import {
	BaseFrameLikeShapeUtil,
	Geometry2d,
	Group2d,
	IndexKey,
	Rectangle2d,
	ShapeOptionsWithDisplayValues,
	TLBaseBoxShape,
	TLClickEventInfo,
	TLHandle,
	TLNoteShape,
	TLShape,
	exhaustiveSwitchError,
	getColorValue,
	lerp,
	useColorMode,
	useEditor,
	useValue,
} from '@tldraw/editor'
import classNames from 'classnames'
import React, { useCallback } from 'react'
import {
	TLCardStackShape,
	TLCardStackShapeProps,
	cardStackShapeMigrations,
	cardStackShapeProps,
} from '@tldraw/tlschema'
import { getDisplayValues } from '../shared/getDisplayValues'
import { renderPlaintextFromRichText } from '../../utils/text/richText'
import { TldrawUiTooltip } from '../../ui/components/primitives/TldrawUiTooltip'

/** @public */
export interface CardStackShapeUtilDisplayValues {
	fillColor: string
	strokeColor: string
	textColor: string
}

/** @public */
export interface CardStackShapeOptions
	extends ShapeOptionsWithDisplayValues<TLCardStackShape, CardStackShapeUtilDisplayValues> {
	showColors: boolean
}

const STACK_DEFAULT_WIDTH = 220
const STACK_DEFAULT_HEIGHT = 220
const STACK_OFFSET = 4
const MAX_FAN_ANGLE = 60

/** @public */
export class CardStackShapeUtil extends BaseFrameLikeShapeUtil<TLCardStackShape> {
	static override type = 'card-stack' as const
	static override props = cardStackShapeProps
	static override migrations = cardStackShapeMigrations

	override options: CardStackShapeOptions = {
		showColors: true,
		getDefaultDisplayValues(_editor, shape, theme, colorMode): CardStackShapeUtilDisplayValues {
			const { color } = shape.props
			const colors = theme.colors[colorMode]
			return {
				fillColor: getColorValue(colors, color, 'noteFill'),
				strokeColor: getColorValue(colors, color, 'noteBorder'),
				textColor: getColorValue(colors, color, 'noteText'),
			}
		},
		getCustomDisplayValues(): Partial<CardStackShapeUtilDisplayValues> {
			return {}
		},
	}

	override canEdit() {
		return true
	}

	override canResize() {
		return true
	}

	override canResizeChildren() {
		return true
	}

	override isExportBoundsContainer(): boolean {
		return true
	}

	getDefaultProps(): TLCardStackShape['props'] {
		return {
			w: STACK_DEFAULT_WIDTH,
			h: STACK_DEFAULT_HEIGHT,
			isExpanded: false,
			fanAngle: MAX_FAN_ANGLE,
			cardGap: 16,
			color: 'black',
			name: '',
		}
	}

	override getGeometry(shape: TLCardStackShape): Geometry2d {
		const { w, h } = shape.props
		const children = this.editor.getSortedChildIdsForParent(shape.id)

		if (children.length === 0) {
			return new Rectangle2d({ width: w, height: h, isFilled: true })
		}

		return new Group2d({
			children: [
				new Rectangle2d({ width: w, height: h, isFilled: true }),
				...children.map((childId) => {
					const childShape = this.editor.getShape(childId)!
					return this.editor
						.getShapeGeometry(childId)
						.transform(this.editor.getShapeLocalTransform(childShape)!, { isLabel: false })
				}),
			],
		})
	}

	override getHandles(shape: TLCardStackShape): TLHandle[] {
		const children = this.editor.getSortedChildIdsForParent(shape.id)
		if (children.length === 0) return []

		const { w, h, isExpanded } = shape.props
		const isCoarsePointer = this.editor.getInstanceState().isCoarsePointer
		if (isCoarsePointer) return []

		const zoom = this.editor.getEfficientZoomLevel()
		if (zoom < 0.25) return []

		const handles: TLHandle[] = []

		handles.push({
			id: 'toggle-expand',
			index: 'a1' as IndexKey,
			type: 'vertex',
			x: w / 2,
			y: h + 16,
		})

		if (isExpanded) {
			handles.push({
				id: 'fan-angle-control',
				index: 'a2' as IndexKey,
				type: 'vertex',
				x: w + 20,
				y: h / 2,
			})
		}

		return handles
	}

	override onHandleClick(shape: TLCardStackShape, info: TLClickEventInfo): void {
		const { handle } = info
		if (handle.id === 'toggle-expand') {
			this.editor.updateShapes([
				{
					id: shape.id,
					type: shape.type,
					props: {
						isExpanded: !shape.props.isExpanded,
					},
				},
			])
		}
	}

	component(shape: TLCardStackShape) {
		const editor = useEditor()
		const colorMode = useColorMode()
		const dv = getDisplayValues(this, shape, colorMode)

		const { w, h, isExpanded, name } = shape.props

		const childIds = useValue(
			'childIds',
			() => editor.getSortedChildIdsForParent(shape.id),
			[editor, shape.id]
		)

		const children = childIds
			.map((id) => editor.getShape<TLNoteShape>(id))
			.filter((s): s is TLNoteShape => s !== undefined && s.type === 'note')

		const count = children.length
		const topNote = children[children.length - 1]

		const toggleExpand = useCallback(() => {
			editor.updateShapes([
				{
					id: shape.id,
					type: shape.type,
					props: {
						isExpanded: !isExpanded,
					},
				},
			])
		}, [editor, shape.id, isExpanded])

		return (
			<div
				className="tl-card-stack__container"
				style={{
					width: w,
					height: h,
				}}
			>
				{isExpanded ? (
					<FanLayout
						shape={shape}
						children={children}
						dv={dv}
					/>
				) : (
					<CollapsedLayout
						shape={shape}
						children={children}
						count={count}
						topNote={topNote}
						dv={dv}
					/>
				)}

				<TldrawUiTooltip content={isExpanded ? 'Collapse stack' : 'Expand stack'}>
					<button
						className="tl-card-stack__toggle"
						onClick={toggleExpand}
						style={{
							position: 'absolute',
							bottom: -24,
							left: '50%',
							transform: 'translateX(-50%)',
							background: dv.fillColor,
							border: `1px solid ${dv.strokeColor}`,
							borderRadius: 12,
							padding: '4px 12px',
							fontSize: 12,
							cursor: 'pointer',
							color: dv.textColor,
						}}
					>
						{isExpanded ? 'Collapse' : `Expand (${count})`}
					</button>
				</TldrawUiTooltip>

				{name && (
					<div
						className="tl-card-stack__label"
						style={{
							position: 'absolute',
							top: -24,
							left: 0,
							fontSize: 12,
							color: dv.textColor,
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							maxWidth: w,
						}}
					>
						{name}
					</div>
				)}
			</div>
		)
	}

	override getIndicatorPath(shape: TLCardStackShape): Path2D {
		const { w, h } = shape.props
		const path = new Path2D()
		path.rect(0, 0, w, h)
		return path
	}

	override getInterpolatedProps(
		startShape: TLCardStackShape,
		endShape: TLCardStackShape,
		t: number
	): TLCardStackShapeProps {
		return {
			...(t > 0.5 ? endShape.props : startShape.props),
			w: lerp(startShape.props.w, endShape.props.w, t),
			h: lerp(startShape.props.h, endShape.props.h, t),
		}
	}

	override onChildrenChange(stack: TLCardStackShape) {
		const children = this.editor.getSortedChildIdsForParent(stack.id)
		const noteChildren = children.filter(
			(id) => this.editor.getShape(id)?.type === 'note'
		)

		if (noteChildren.length === 0) {
			this.editor.deleteShapes([stack.id])
		}
	}
}

function CollapsedLayout({
	shape,
	children,
	count,
	topNote,
	dv,
}: {
	shape: TLCardStackShape
	children: TLNoteShape[]
	count: number
	topNote: TLNoteShape | undefined
	dv: CardStackShapeUtilDisplayValues
}) {
	const editor = useEditor()
	const { w, h } = shape.props

	return (
		<>
			{children.slice(0, Math.min(5, count - 1)).map((child, i) => {
				const offset = (count - 1 - i) * STACK_OFFSET
				return (
					<div
						key={child.id}
						className="tl-card-stack__background-card"
						style={{
							position: 'absolute',
							left: offset,
							top: offset,
							width: w - offset * 2,
							height: h - offset * 2,
							backgroundColor: dv.fillColor,
							borderRadius: 4,
							opacity: 0.5 + i * 0.1,
							border: `1px solid ${dv.strokeColor}`,
						}}
					/>
				)
			})}

			{count > 0 && (
				<div
					className="tl-card-stack__count-badge"
					style={{
						position: 'absolute',
						top: 8,
						right: 8,
						background: dv.strokeColor,
						color: dv.textColor,
						borderRadius: 10,
						minWidth: 20,
						height: 20,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						fontSize: 11,
						fontWeight: 'bold',
						padding: '0 6px',
					}}
				>
					{count}
				</div>
			)}

			{topNote && (
				<div
					className="tl-card-stack__top-note"
					style={{
						position: 'absolute',
						inset: 0,
						display: 'flex',
						flexDirection: 'column',
						padding: 16,
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							fontSize: 14,
							color: dv.textColor,
							fontWeight: 500,
							marginBottom: 8,
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}
					>
						{getNotePreviewText(editor, topNote)}
					</div>
					{topNote.props.voteCount > 0 && (
						<div
							style={{
								fontSize: 12,
								color: dv.textColor,
								opacity: 0.7,
							}}
						>
							{topNote.props.voteCount} votes
						</div>
					)}
					{topNote.props.tags.length > 0 && (
						<div
							style={{
								display: 'flex',
								flexWrap: 'wrap',
								gap: 4,
								marginTop: 'auto',
							}}
						>
							{topNote.props.tags.slice(0, 3).map((tag) => (
								<span
									key={tag}
									style={{
										fontSize: 10,
										background: dv.strokeColor,
										color: dv.textColor,
										padding: '2px 6px',
										borderRadius: 4,
										opacity: 0.8,
									}}
								>
									#{tag}
								</span>
							))}
						</div>
					)}
				</div>
			)}

			{!topNote && (
				<div
					style={{
						position: 'absolute',
						inset: 0,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: dv.textColor,
						opacity: 0.5,
						fontSize: 14,
					}}
				>
					Drop notes here
				</div>
			)}
		</>
	)
}

function FanLayout({
	shape,
	children,
	dv,
}: {
	shape: TLCardStackShape
	children: TLNoteShape[]
	dv: CardStackShapeUtilDisplayValues
}) {
	const editor = useEditor()
	const { w, h, fanAngle } = shape.props

	const centerX = w / 2
	const centerY = h
	const radius = Math.min(w, h) * 0.6

	const count = children.length

	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				overflow: 'visible',
			}}
		>
			{children.map((child, i) => {
				const angle = count === 1 
					? -90 
					: -90 - fanAngle / 2 + (fanAngle / (count - 1)) * i
				const angleRad = (angle * Math.PI) / 180

				const x = centerX + Math.cos(angleRad) * radius - 100
				const y = centerY + Math.sin(angleRad) * radius - 100

				const previewText = getNotePreviewText(editor, child)
				const isTop = i === children.length - 1

				return (
					<TldrawUiTooltip key={child.id} content={previewText || 'Note'}>
						<div
							className={classNames('tl-card-stack__fan-card', {
								'tl-card-stack__fan-card--top': isTop,
							})}
							style={{
								position: 'absolute',
								left: x,
								top: y,
								width: 200,
								height: 200,
								backgroundColor: getNoteColor(editor, child),
								borderRadius: 4,
								border: `2px solid ${isTop ? dv.strokeColor : 'transparent'}`,
								boxShadow: isTop
									? '0 4px 12px rgba(0,0,0,0.15)'
									: '0 2px 6px rgba(0,0,0,0.1)',
								transform: `rotate(${angle}deg)`,
								transformOrigin: 'bottom center',
								padding: 12,
								overflow: 'hidden',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
								zIndex: i,
							}}
						>
							<div
								style={{
									fontSize: 12,
									color: dv.textColor,
									fontWeight: 500,
									whiteSpace: 'nowrap',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									marginBottom: 4,
								}}
							>
								{previewText || 'Empty note'}
							</div>

							{child.props.voteCount > 0 && (
								<div
									style={{
										fontSize: 10,
										color: dv.textColor,
										opacity: 0.7,
									}}
								>
									⭐ {child.props.voteCount}
								</div>
							)}

							{child.props.tags.length > 0 && (
								<div
									style={{
										display: 'flex',
										flexWrap: 'wrap',
										gap: 2,
										marginTop: 8,
									}}
								>
									{child.props.tags.slice(0, 2).map((tag) => (
										<span
											key={tag}
											style={{
												fontSize: 9,
												background: 'rgba(0,0,0,0.1)',
												color: dv.textColor,
												padding: '1px 4px',
												borderRadius: 3,
											}}
										>
											#{tag}
										</span>
									))}
								</div>
							)}
						</div>
					</TldrawUiTooltip>
				)
			})}
		</div>
	)
}

function getNotePreviewText(editor: ReturnType<typeof useEditor>, shape: TLNoteShape): string {
	const text = renderPlaintextFromRichText(editor, shape.props.richText)
	return text || ''
}

function getNoteColor(editor: ReturnType<typeof useEditor>, shape: TLNoteShape): string {
	const theme = editor.getCurrentTheme()
	const colorMode = editor.user.getIsDarkMode() ? 'dark' : 'light'
	const colors = theme.colors[colorMode]
	return getColorValue(colors, shape.props.color, 'noteFill')
}
