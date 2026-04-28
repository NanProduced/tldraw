import {
	StateNode,
	TLPointerEventInfo,
	Vec,
	createShapeId,
	maybeSnapToGrid,
	toRichText,
} from '@tldraw/editor'

export class Pointing extends StateNode {
	static override id = 'pointing'

	override onPointerUp() {
		this.complete()
	}

	override onPointerMove(info: TLPointerEventInfo) {
		if (this.editor.inputs.getIsDragging()) {
			const originPagePoint = this.editor.inputs.getOriginPagePoint()

			const id = createShapeId()

			const creatingMarkId = this.editor.markHistoryStoppingPoint(`creating_mindmap_node:${id}`)
			const newPoint = maybeSnapToGrid(originPagePoint, this.editor)
			this.editor
				.createShapes([
					{
						id,
						type: 'mindmap-node',
						x: newPoint.x,
						y: newPoint.y,
						props: {
							w: 1,
							h: 1,
							scale: this.editor.getResizeScaleFactor(),
						},
					},
				])
				.select(id)

			const shape = this.editor.getShape(id)
			if (!shape) {
				this.cancel()
				return
			}

			this.editor.setCurrentTool('select.resizing', {
				...info,
				target: 'selection',
				handle: 'bottom_right',
				isCreating: true,
				creatingMarkId,
				creationCursorOffset: { x: 1, y: 1 },
				onInteractionEnd: 'mindmap-node',
			})
		}
	}

	override onCancel() {
		this.cancel()
	}

	override onComplete() {
		this.complete()
	}

	override onInterrupt() {
		this.cancel()
	}

	private complete() {
		const originPagePoint = this.editor.inputs.getOriginPagePoint()

		const id = createShapeId()

		this.editor.markHistoryStoppingPoint(`creating_mindmap_node:${id}`)

		const scale = this.editor.getResizeScaleFactor()

		const size = { w: 180, h: 60 }

		this.editor.createShapes([
			{
				id,
				type: 'mindmap-node',
				x: originPagePoint.x,
				y: originPagePoint.y,
				props: {
					scale,
					level: 0,
					richText: toRichText('Topic'),
					...size,
				},
			},
		])

		const shape = this.editor.getShape(id)
		if (!shape) {
			this.cancel()
			return
		}

		const { w, h } = shape.props

		const delta = new Vec(w / 2, h / 2).mul(scale)
		const parentTransform = this.editor.getShapeParentTransform(shape)
		if (parentTransform) delta.rot(-parentTransform.rotation())
		const newPoint = maybeSnapToGrid(new Vec(shape.x - delta.x, shape.y - delta.y), this.editor)
		this.editor.select(id)
		this.editor.updateShape({
			id: shape.id,
			type: 'mindmap-node',
			x: newPoint.x,
			y: newPoint.y,
			props: {
				...shape.props,
				w: w * scale,
				h: h * scale,
			},
		})

		this.editor.setEditingShape(id)

		if (this.editor.getInstanceState().isToolLocked) {
			this.parent.transition('idle')
		} else {
			this.editor.setCurrentTool('select', {})
		}
	}

	private cancel() {
		this.parent.transition('idle')
	}
}
