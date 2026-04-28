import {
	BindingOnChangeOptions,
	BindingOnCreateOptions,
	BindingOnShapeChangeOptions,
	BindingOnShapeDeleteOptions,
	BindingOnShapeIsolateOptions,
	BindingUtil,
	Box,
	Editor,
	TLShape,
	TLShapeId,
	Vec,
} from '@tldraw/editor'
import {
	TLMindMapEdgeBinding,
	TLMindMapEdgeBindingProps,
	mindMapEdgeBindingMigrations,
	mindMapEdgeBindingProps,
} from '@tldraw/tlschema'
import { TLMindMapNodeShape } from '@tldraw/tlschema'

export class MindMapEdgeBindingUtil extends BindingUtil<TLMindMapEdgeBinding> {
	static override type = 'mindmap-edge'

	static override props = mindMapEdgeBindingProps
	static override migrations = mindMapEdgeBindingMigrations

	override getDefaultProps(): Partial<TLMindMapEdgeBindingProps> {
		return {
			childAnchor: 'left',
			parentAnchor: 'right',
		}
	}

	override onAfterCreate({ binding }: BindingOnCreateOptions<TLMindMapEdgeBinding>): void {
		this.updateParentLevel(binding.fromId, binding.toId)
		this.triggerLayout(binding.fromId)
	}

	override onAfterChange({ bindingAfter }: BindingOnChangeOptions<TLMindMapEdgeBinding>): void {
		this.triggerLayout(bindingAfter.fromId)
	}

	override onAfterChangeFromShape({
		shapeBefore,
		shapeAfter,
	}: BindingOnShapeChangeOptions<TLMindMapEdgeBinding>): void {
		this.triggerLayout(shapeAfter.id)
	}

	override onAfterChangeToShape({
		binding,
		shapeBefore,
		shapeAfter,
	}: BindingOnShapeChangeOptions<TLMindMapEdgeBinding>): void {
		this.triggerLayout(binding.fromId)
	}

	override onBeforeIsolateFromShape({
		binding,
	}: BindingOnShapeIsolateOptions<TLMindMapEdgeBinding>): void {
		// Isolate just breaks the connection, no special handling needed
	}

	override onAfterDeleteFromShape({
		binding,
	}: BindingOnShapeDeleteOptions<TLMindMapEdgeBinding>): void {
		this.handleCascadeDelete(binding.toId)
	}

	override onAfterDeleteToShape({
		binding,
	}: BindingOnShapeDeleteOptions<TLMindMapEdgeBinding>): void {
		this.editor.deleteBinding(binding.id)
	}

	private updateParentLevel(parentId: TLShapeId, childId: TLShapeId): void {
		const parent = this.editor.getShape<TLMindMapNodeShape>(parentId)
		const child = this.editor.getShape<TLMindMapNodeShape>(childId)

		if (parent && child && parent.type === 'mindmap-node' && child.type === 'mindmap-node') {
			const newLevel = parent.props.level + 1
			if (child.props.level !== newLevel) {
				this.editor.updateShape({
					...child,
					props: { ...child.props, level: newLevel },
				})
				this.updateChildLevels(childId, newLevel)
			}
		}
	}

	private updateChildLevels(parentId: TLShapeId, parentLevel: number): void {
		const childBindings = this.editor.getBindingsFromShape(parentId, 'mindmap-edge')
		for (const binding of childBindings) {
			const child = this.editor.getShape<TLMindMapNodeShape>(binding.toId)
			if (child && child.type === 'mindmap-node') {
				const newLevel = parentLevel + 1
				if (child.props.level !== newLevel) {
					this.editor.updateShape({
						...child,
						props: { ...child.props, level: newLevel },
					})
					this.updateChildLevels(child.id, newLevel)
				}
			}
		}
	}

	private handleCascadeDelete(shapeId: TLShapeId): void {
		const childBindings = this.editor.getBindingsFromShape(shapeId, 'mindmap-edge')
		const childIds = childBindings.map((b) => b.toId)

		if (childIds.length > 0) {
			this.editor.deleteShapes(childIds)
		}
	}

	private triggerLayout(rootShapeId: TLShapeId): void {
		const rootId = this.findRootNode(rootShapeId)
		if (rootId) {
			this.editor.emit('mindmap:layout', { rootId })
		}
	}

	private findRootNode(shapeId: TLShapeId): TLShapeId | null {
		const parentBindings = this.editor.getBindingsToShape(shapeId, 'mindmap-edge')
		if (parentBindings.length === 0) {
			return shapeId
		}
		return this.findRootNode(parentBindings[0].fromId)
	}
}

export function getMindMapEdgePath(
	editor: Editor,
	parentShape: TLShape,
	childShape: TLShape,
	parentAnchor: 'left' | 'right' | 'top' | 'bottom',
	childAnchor: 'left' | 'right' | 'top' | 'bottom'
): { path: string; startPoint: Vec; endPoint: Vec } {
	const parentBounds = Box.ZeroFix(editor.getShapePageBounds(parentShape)!)
	const childBounds = Box.ZeroFix(editor.getShapePageBounds(childShape)!)

	const parentPoint = getAnchorPoint(parentBounds, parentAnchor)
	const childPoint = getAnchorPoint(childBounds, childAnchor)

	const path = createBezierPath(parentPoint, childPoint, parentAnchor, childAnchor)

	return { path, startPoint: parentPoint, endPoint: childPoint }
}

function getAnchorPoint(bounds: Box, anchor: 'left' | 'right' | 'top' | 'bottom'): Vec {
	switch (anchor) {
		case 'left':
			return new Vec(bounds.minX, bounds.center.y)
		case 'right':
			return new Vec(bounds.maxX, bounds.center.y)
		case 'top':
			return new Vec(bounds.center.x, bounds.minY)
		case 'bottom':
			return new Vec(bounds.center.x, bounds.maxY)
	}
}

function createBezierPath(
	start: Vec,
	end: Vec,
	startAnchor: 'left' | 'right' | 'top' | 'bottom',
	endAnchor: 'left' | 'right' | 'top' | 'bottom'
): string {
	const dx = end.x - start.x
	const dy = end.y - start.y
	const distance = Math.sqrt(dx * dx + dy * dy)
	const controlOffset = Math.min(distance * 0.5, 60)

	let cp1: Vec
	let cp2: Vec

	if (startAnchor === 'right' && endAnchor === 'left') {
		cp1 = new Vec(start.x + controlOffset, start.y)
		cp2 = new Vec(end.x - controlOffset, end.y)
	} else if (startAnchor === 'left' && endAnchor === 'right') {
		cp1 = new Vec(start.x - controlOffset, start.y)
		cp2 = new Vec(end.x + controlOffset, end.y)
	} else if (startAnchor === 'bottom' && endAnchor === 'top') {
		cp1 = new Vec(start.x, start.y + controlOffset)
		cp2 = new Vec(end.x, end.y - controlOffset)
	} else if (startAnchor === 'top' && endAnchor === 'bottom') {
		cp1 = new Vec(start.x, start.y - controlOffset)
		cp2 = new Vec(end.x, end.y + controlOffset)
	} else {
		cp1 = new Vec(start.x + controlOffset, start.y)
		cp2 = new Vec(end.x - controlOffset, end.y)
	}

	return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`
}
