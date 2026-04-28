import { StateNode, TLKeyboardEventInfo, TLPointerEventInfo } from '@tldraw/editor'
import { startEditingShapeWithRichText } from '../../../tools/SelectTool/selectHelpers'

export class Idle extends StateNode {
	static override id = 'idle'

	override onPointerDown(info: TLPointerEventInfo) {
		const { editor } = this
		const { currentPagePoint } = editor.inputs

		const hitShape = editor.getShapeAtPoint(currentPagePoint, {
			hitInside: true,
			margin: 0,
			filter: (shape) => shape.type === 'mindmap-node',
		})

		if (hitShape) {
			editor.select(hitShape.id)
			editor.setCurrentTool('select')
			return
		}

		this.parent.transition('pointing', info)
	}

	override onEnter() {
		this.editor.setCursor({ type: 'cross', rotation: 0 })
	}

	override onKeyUp(info: TLKeyboardEventInfo) {
		const { editor } = this
		if (info.key === 'Enter') {
			const onlySelectedShape = editor.getOnlySelectedShape()
			if (editor.canEditShape(onlySelectedShape) && onlySelectedShape?.type === 'mindmap-node') {
				startEditingShapeWithRichText(editor, onlySelectedShape, { selectAll: true })
			}
		}
	}

	override onCancel() {
		this.editor.setCurrentTool('select')
	}
}
