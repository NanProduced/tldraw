/* eslint-disable react-hooks/rules-of-hooks */
import {
	BaseBoxShapeUtil,
	Box,
	Editor,
	Geometry2d,
	Group2d,
	HTMLContainer,
	Rectangle2d,
	SVGContainer,
	SvgExportContext,
	TLShapeUtilCanvasSvgDef,
	TLShapeUtilConstructor,
	Vec,
	VecLike,
	getColorValue,
	toRichText,
	useColorMode,
	useEditor,
	useValue,
} from '@tldraw/editor'
import React, { useCallback, useMemo } from 'react'
import {
	LABEL_FONT_SIZES,
	LABEL_PADDING,
	STROKE_SIZES,
	getFontFamily,
} from '../shared/default-shape-constants'
import { DEFAULT_FILL_COLOR_NAMES } from '../shared/defaultFills'
import { getThemeFontFaces } from '../shared/defaultFonts'
import { getFillDefForCanvas, getFillDefForExport } from '../shared/defaultStyleDefs'
import { ShapeOptionsWithDisplayValues, getDisplayValues } from '../shared/getDisplayValues'
import { RichTextLabel, RichTextSVG } from '../shared/RichTextLabel'
import { useIsReadyForEditing } from '../shared/useEditablePlainText'
import { useEfficientZoomThreshold } from '../shared/useEfficientZoomThreshold'
import {
	MindMapNodeColorScheme,
	TLMindMapNodeShape,
	TLMindMapNodeShapeProps,
	mindMapNodeShapeMigrations,
	mindMapNodeShapeProps,
} from '@tldraw/tlschema'
import { isEmptyRichText, renderPlaintextFromRichText } from '../../utils/text/richText'

const COLOR_SCHEMES: Record<string, string[]> = {
	default: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#eab308'],
	ocean: ['#0ea5e9', '#06b6d4', '#14b8a6', '#22c55e', '#84cc16', '#a3e635'],
	forest: ['#16a34a', '#15803d', '#166534', '#14532d', '#4d7c0f', '#365314'],
	sunset: ['#f97316', '#fb923c', '#fdba74', '#fcd34d', '#fde047', '#fef08a'],
}

interface MindMapNodeShapeUtilDisplayValues {
	strokeColor: string
	strokeWidth: number
	fillColor: string
	patternFillFallbackColor: string
	labelColor: string
	labelFontFamily: string
	labelFontSize: number
	labelLineHeight: number
	labelPadding: number
}

interface MindMapNodeShapeOptions
	extends ShapeOptionsWithDisplayValues<TLMindMapNodeShape, MindMapNodeShapeUtilDisplayValues> {
	showTextOutline: boolean
}

const COLLAPSE_BUTTON_SIZE = 20
const ADD_BUTTON_SIZE = 24

function getColorForLevel(level: number, colorScheme: string): string {
	const colors = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.default
	return colors[level % colors.length]
}

export class MindMapNodeShapeUtil extends BaseBoxShapeUtil<TLMindMapNodeShape> {
	static override type = 'mindmap-node' as const
	static override props = mindMapNodeShapeProps
	static override migrations = mindMapNodeShapeMigrations

	static override configure<T extends TLShapeUtilConstructor<any, any>>(
		this: T,
		options: T extends new (...args: any[]) => { options: infer Options } ? Partial<Options> : never
	): T {
		return super.configure(options) as T
	}

	override options: MindMapNodeShapeOptions = {
		showTextOutline: true,
		getDefaultDisplayValues(_editor, shape, theme, colorMode): MindMapNodeShapeUtilDisplayValues {
			const { size, font } = shape.props
			const colors = theme.colors[colorMode]
			const levelColor = getColorForLevel(shape.props.level, shape.props.colorScheme)

			return {
				strokeColor: levelColor,
				strokeWidth: theme.strokeWidth * STROKE_SIZES[size],
				fillColor:
					shape.props.fill === 'none'
						? 'transparent'
						: shape.props.fill === 'semi'
							? levelColor + '33'
							: levelColor + '44',
				patternFillFallbackColor: levelColor,
				labelColor: getColorValue(colors, 'black', 'solid'),
				labelFontFamily: getFontFamily(theme, font),
				labelFontSize: theme.fontSize * LABEL_FONT_SIZES[size],
				labelLineHeight: theme.lineHeight,
				labelPadding: LABEL_PADDING,
			}
		},
		getCustomDisplayValues(_editor, _shape): Partial<MindMapNodeShapeUtilDisplayValues> {
			return {}
		},
	}

	override canEdit(shape: TLMindMapNodeShape) {
		return true
	}

	override canBind(): boolean {
		return true
	}

	override getDefaultProps(): TLMindMapNodeShape['props'] {
		return {
			colorScheme: 'default',
			color: 'black',
			fill: 'semi',
			size: 'm',
			font: 'draw',
			align: 'middle',
			verticalAlign: 'middle',
			richText: toRichText(''),
			w: 160,
			h: 50,
			growY: 0,
			scale: 1,
			isCollapsed: false,
			level: 0,
		}
	}

	override getGeometry(shape: TLMindMapNodeShape): Geometry2d {
		const { props } = shape
		const { scale } = props
		const dv = getDisplayValues(this, shape)

		const scaledW = Math.max(1, props.w)
		const scaledH = Math.max(1, props.h + props.growY)
		const unscaledShapeW = scaledW / scale
		const unscaledShapeH = scaledH / scale

		const isEmptyLabel = isEmptyRichText(props.richText)
		const unscaledLabelSize = isEmptyLabel
			? { w: 0, h: 0 }
			: this.getUnscaledLabelSize(shape)

		const unscaledMinWidth = Math.min(100, unscaledShapeW / 2)
		const unscaledMinHeight = Math.min(
			dv.labelFontSize * dv.labelLineHeight + dv.labelPadding * 2,
			unscaledShapeH / 2
		)

		const unscaledLabelW = Math.min(
			unscaledShapeW,
			Math.max(
				unscaledLabelSize.w,
				Math.min(unscaledMinWidth, Math.max(1, unscaledShapeW - 16))
			)
		)
		const unscaledLabelH = Math.min(
			unscaledShapeH,
			Math.max(
				unscaledLabelSize.h,
				Math.min(unscaledMinHeight, Math.max(1, unscaledShapeH - 16))
			)
		)

		const unscaledX = (unscaledShapeW - unscaledLabelW) / 2
		const unscaledY = (unscaledShapeH - unscaledLabelH) / 2

		const labelBounds = {
			x: unscaledX * scale,
			y: unscaledY * scale,
			width: unscaledLabelW * scale,
			height: unscaledLabelH * scale,
		}

		const mainBounds = new Rectangle2d({
			x: 0,
			y: 0,
			width: scaledW,
			height: scaledH,
			isFilled: true,
		})

		return new Group2d({
			children: [
				mainBounds,
				new Rectangle2d({
					...labelBounds,
					isFilled: true,
					isLabel: true,
					excludeFromShapeBounds: true,
					isEmptyLabel: isEmptyLabel,
				}),
			],
		})
	}

	override getText(shape: TLMindMapNodeShape) {
		return renderPlaintextFromRichText(this.editor, shape.props.richText)
	}

	private getUnscaledLabelSize(shape: TLMindMapNodeShape): { w: number; h: number } {
		const { props } = shape
		const { scale, w, h } = props
		const dv = getDisplayValues(this, shape)

		const unscaledW = w / scale
		const unscaledH = h / scale

		if (isEmptyRichText(props.richText)) {
			return { w: 0, h: 0 }
		}

		const { width, height } = this.editor.textMeasure.measureRichText(
			props.richText,
			{
				fontFamily: dv.labelFontFamily,
				fontSize: dv.labelFontSize,
				lineHeight: dv.labelLineHeight,
				padding: dv.labelPadding,
			},
			{
				maxWidth: unscaledW - 32,
			}
		)

		return { w: width + dv.labelPadding * 2, h: height + dv.labelPadding * 2 }
	}

	component(shape: TLMindMapNodeShape) {
		const { id, type, props } = shape
		const { editor } = this
		const isOnlySelected = useValue(
			'isMindMapNodeOnlySelected',
			() => shape.id === editor.getOnlySelectedShapeId(),
			[editor]
		)
		const isReadyForEditing = useIsReadyForEditing(editor, shape.id)
		const isForceSolid = useEfficientZoomThreshold(0.25 / shape.props.scale)
		const colorMode = useColorMode()
		const dv = getDisplayValues(this, shape, colorMode)

		const { w, h, richText, isCollapsed, level, colorScheme } = props
		const isEmpty = isEmptyRichText(richText)
		const showHtmlContainer = isReadyForEditing || !isEmpty

		const children = this.getChildNodes(shape.id)
		const hasChildren = children.length > 0

		return (
			<>
				<SVGContainer>
					<MindMapNodeBody
						shape={shape}
						strokeColor={dv.strokeColor}
						strokeWidth={dv.strokeWidth}
						fillColor={dv.fillColor}
						forceSolid={isForceSolid}
					/>
				</SVGContainer>

				{showHtmlContainer && (
					<HTMLContainer
						style={{
							overflow: 'hidden',
							width: w,
							height: h + props.growY,
						}}
					>
						<RichTextLabel
							shapeId={id}
							type={type}
							fontFamily={dv.labelFontFamily}
							fontSize={dv.labelFontSize}
							lineHeight={dv.labelLineHeight}
							padding={dv.labelPadding}
							textAlign="center"
							verticalAlign="middle"
							richText={richText}
							isSelected={isOnlySelected}
							labelColor={dv.labelColor}
							wrap
							showTextOutline={this.options.showTextOutline}
							style={
								shape.props.scale !== 1
									? {
											transform: `scale(${shape.props.scale})`,
											transformOrigin: 'top left',
											width: shape.props.w / shape.props.scale,
											height: (shape.props.h + props.growY) / shape.props.scale,
										}
									: undefined
							}
						/>
					</HTMLContainer>
				)}

				{hasChildren && (
					<CollapseButton
						shapeId={shape.id}
						isCollapsed={isCollapsed}
						position={{ x: w - COLLAPSE_BUTTON_SIZE / 2, y: h / 2 }}
					/>
				)}

				<AddChildButton
					shapeId={shape.id}
					position={{ x: w, y: h / 2 }}
					level={level}
					colorScheme={colorScheme}
				/>
			</>
		)
	}

	private getChildNodes(parentId: string): TLMindMapNodeShape[] {
		const bindings = this.editor.getBindingsFromShape<TLMindMapNodeShape>(parentId, 'mindmap-edge')
		return bindings
			.map((b) => this.editor.getShape<TLMindMapNodeShape>(b.toId))
			.filter((s): s is TLMindMapNodeShape => s !== undefined && s.type === 'mindmap-node')
	}

	override getIndicatorPath(shape: TLMindMapNodeShape): Path2D | undefined {
		const { w, h } = shape.props
		const path = new Path2D()
		const radius = 8

		path.moveTo(radius, 0)
		path.lineTo(w - radius, 0)
		path.arcTo(w, 0, w, radius, radius)
		path.lineTo(w, h - radius)
		path.arcTo(w, h, w - radius, h, radius)
		path.lineTo(radius, h)
		path.arcTo(0, h, 0, h - radius, radius)
		path.lineTo(0, radius)
		path.arcTo(0, 0, radius, 0, radius)
		path.closePath()

		return path
	}

	override toSvg(shape: TLMindMapNodeShape, ctx: SvgExportContext) {
		const dv = getDisplayValues(this, shape, ctx.colorMode)
		const { richText, fill, scale, growY, w, h } = shape.props

		ctx.addExportDef(getFillDefForExport(fill))

		let textEl
		if (!isEmptyRichText(richText)) {
			const bounds = new Box(0, 0, w / scale, (h + growY) / scale)
			textEl = (
				<RichTextSVG
					fontSize={dv.labelFontSize}
					fontFamily={dv.labelFontFamily}
					lineHeight={dv.labelLineHeight}
					textAlign="center"
					verticalAlign="middle"
					labelColor={dv.labelColor}
					padding={dv.labelPadding}
					showTextOutline={this.options.showTextOutline}
					bounds={bounds}
					richText={richText}
				/>
			)
		}

		return (
			<>
				<MindMapNodeBodySvg
					shape={shape}
					strokeColor={dv.strokeColor}
					strokeWidth={dv.strokeWidth}
					fillColor={dv.fillColor}
				/>
				{textEl}
			</>
		)
	}

	override getCanvasSvgDefs(): TLShapeUtilCanvasSvgDef[] {
		return [getFillDefForCanvas()]
	}
}

function MindMapNodeBody({
	shape,
	strokeColor,
	strokeWidth,
	fillColor,
	forceSolid,
}: {
	shape: TLMindMapNodeShape
	strokeColor: string
	strokeWidth: number
	fillColor: string
	forceSolid: boolean
}) {
	const { w, h } = shape.props
	const radius = 8

	return (
		<g>
			<rect
				x={strokeWidth / 2}
				y={strokeWidth / 2}
				width={w - strokeWidth}
				height={h - strokeWidth}
				rx={radius}
				ry={radius}
				fill={fillColor}
				stroke={strokeColor}
				strokeWidth={strokeWidth}
			/>
		</g>
	)
}

function MindMapNodeBodySvg({
	shape,
	strokeColor,
	strokeWidth,
	fillColor,
}: {
	shape: TLMindMapNodeShape
	strokeColor: string
	strokeWidth: number
	fillColor: string
}) {
	const { w, h, scale } = shape.props
	const radius = 8 / scale

	return (
		<rect
			x={strokeWidth / 2}
			y={strokeWidth / 2}
			width={w / scale - strokeWidth}
			height={h / scale - strokeWidth}
			rx={radius}
			ry={radius}
			fill={fillColor}
			stroke={strokeColor}
			strokeWidth={strokeWidth}
		/>
	)
}

function CollapseButton({
	shapeId,
	isCollapsed,
	position,
}: {
	shapeId: string
	isCollapsed: boolean
	position: VecLike
}) {
	const editor = useEditor()
	const hideButton = useEfficientZoomThreshold()

	const handleClick = useCallback(
		(e: React.PointerEvent) => {
			editor.markEventAsHandled(e)
			const shape = editor.getShape<TLMindMapNodeShape>(shapeId)
			if (shape) {
				editor.updateShape({
					...shape,
					props: { ...shape.props, isCollapsed: !shape.props.isCollapsed },
				})
			}
		},
		[editor, shapeId]
	)

	if (hideButton) return null

	return (
		<div
			style={{
				position: 'absolute',
				left: position.x - COLLAPSE_BUTTON_SIZE / 2,
				top: position.y - COLLAPSE_BUTTON_SIZE / 2,
				width: COLLAPSE_BUTTON_SIZE,
				height: COLLAPSE_BUTTON_SIZE,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				cursor: 'pointer',
				backgroundColor: 'white',
				border: '1px solid #e5e7eb',
				borderRadius: '50%',
				boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
				zIndex: 100,
			}}
			onPointerDown={handleClick}
			title={isCollapsed ? 'Expand' : 'Collapse'}
		>
			<svg
				width="12"
				height="12"
				viewBox="0 0 12 12"
				fill="none"
				style={{
					transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
					transition: 'transform 0.15s ease',
				}}
			>
				<path d="M4 2L8 6L4 10" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		</div>
	)
}

function AddChildButton({
	shapeId,
	position,
	level,
	colorScheme,
}: {
	shapeId: string
	position: VecLike
	level: number
	colorScheme: string
}) {
	const editor = useEditor()
	const hideButton = useEfficientZoomThreshold()

	const handleClick = useCallback(
		(e: React.PointerEvent) => {
			editor.markEventAsHandled(e)
			const parentShape = editor.getShape<TLMindMapNodeShape>(shapeId)
			if (!parentShape) return

			const id = editor.createShapeId()
			const parentBounds = editor.getShapePageBounds(shapeId)!
			const newX = parentBounds.maxX + 100
			const newY = parentBounds.center.y

			editor
				.createShapes([
					{
						id,
						type: 'mindmap-node',
						x: newX,
						y: newY,
						props: {
							...parentShape.props,
							level: level + 1,
							richText: toRichText('New Node'),
							w: 140,
							h: 45,
						},
					},
				])
				.select(id)

			editor.createBinding({
				type: 'mindmap-edge',
				fromId: shapeId,
				toId: id,
				props: {
					childAnchor: 'left',
					parentAnchor: 'right',
				},
			})

			editor.setEditingShape(id)
		},
		[editor, shapeId, level]
	)

	if (hideButton) return null

	const buttonColor = getColorForLevel(level + 1, colorScheme)

	return (
		<div
			style={{
				position: 'absolute',
				left: position.x - ADD_BUTTON_SIZE / 2 + 8,
				top: position.y - ADD_BUTTON_SIZE / 2,
				width: ADD_BUTTON_SIZE,
				height: ADD_BUTTON_SIZE,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				cursor: 'pointer',
				backgroundColor: buttonColor,
				borderRadius: '50%',
				boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
				zIndex: 100,
				opacity: 0,
				transition: 'opacity 0.15s ease',
				'&:hover': {
					opacity: 1,
				} as React.CSSProperties,
			}}
			className="tl-mindmap-add-button"
			onPointerDown={handleClick}
			title="Add child node"
		>
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
				<path d="M7 1V13M1 7H13" stroke="white" strokeWidth="2" strokeLinecap="round" />
			</svg>
		</div>
	)
}
