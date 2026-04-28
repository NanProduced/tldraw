import { Editor, Vec, Box, TLShapeId } from '@tldraw/editor'
import { TLMindMapNodeShape } from '@tldraw/tlschema'

const HORIZONTAL_GAP = 80
const VERTICAL_GAP = 30

interface LayoutNode {
	id: TLShapeId
	shape: TLMindMapNodeShape
	bounds: Box
	children: LayoutNode[]
	x: number
	y: number
	width: number
	height: number
	mod: number
	thread?: LayoutNode
	ancestor?: LayoutNode
	change?: number
	shift?: number
}

function getChildNodes(editor: Editor, parentId: TLShapeId): TLMindMapNodeShape[] {
	const bindings = editor.getBindingsFromShape<TLMindMapNodeShape>(parentId, 'mindmap-edge')
	return bindings
		.map((b) => editor.getShape<TLMindMapNodeShape>(b.toId))
		.filter((s): s is TLMindMapNodeShape => s !== undefined && s.type === 'mindmap-node')
}

function isNodeCollapsed(editor: Editor, shapeId: TLShapeId): boolean {
	const shape = editor.getShape<TLMindMapNodeShape>(shapeId)
	return shape?.props.isCollapsed ?? false
}

function buildTree(
	editor: Editor,
	rootId: TLShapeId,
	parentX: number = 0,
	parentY: number = 0
): LayoutNode {
	const rootShape = editor.getShape<TLMindMapNodeShape>(rootId)!
	const bounds = Box.ZeroFix(editor.getShapePageBounds(rootId)!)

	const children: LayoutNode[] = []
	if (!isNodeCollapsed(editor, rootId)) {
		const childShapes = getChildNodes(editor, rootId)
		for (const child of childShapes) {
			children.push(buildTree(editor, child.id, parentX, parentY))
		}
	}

	return {
		id: rootId,
		shape: rootShape,
		bounds,
		children,
		x: parentX,
		y: parentY,
		width: bounds.width,
		height: bounds.height,
		mod: 0,
	}
}

function firstWalk(node: LayoutNode, level: number = 0): void {
	node.y = level

	for (const child of node.children) {
		firstWalk(child, level + 1)
	}

	if (node.children.length === 0) {
		if (node.thread) {
			node.x = node.thread.x + VERTICAL_GAP
		} else {
			node.x = 0
		}
	} else if (node.children.length === 1) {
		const child = node.children[0]
		if (node.thread) {
			node.x = node.thread.x + VERTICAL_GAP
		} else {
			node.x = child.x
		}
	} else {
		let left = node.children[0]
		let right = node.children[node.children.length - 1]
		let leftThread = left.thread
		let rightThread = right.thread

		let mid = (left.x + right.x) / 2

		if (node.thread) {
			node.x = node.thread.x + VERTICAL_GAP
			node.mod = node.x - mid
		} else {
			node.x = mid
		}

		executeShifts(node)

		const shift = node.children.length > 0 ? node.children[0].x : 0

		for (let i = 1; i < node.children.length; i++) {
			const child = node.children[i]
			const prev = node.children[i - 1]

			right = child
			rightThread = right.thread
			left = prev
			leftThread = left.thread

			let dist = VERTICAL_GAP + getMaxHeight(left) / 2 + getMaxHeight(right) / 2

			let subtreeLeft = left.x + left.mod
			let subtreeRight = right.x + right.mod

			while (leftThread && rightThread) {
				left = leftThread
				right = rightThread
				subtreeLeft = left.x + left.mod
				subtreeRight = right.x + right.mod

				const gap = subtreeLeft + dist - subtreeRight
				if (gap > 0) {
					moveSubtree(right, gap)
					executeShifts(node)
				}

				leftThread = left.thread
				rightThread = right.thread
			}

			if (leftThread && !rightThread) {
				right.thread = leftThread
			} else if (rightThread && !leftThread) {
				left.thread = rightThread
			}
		}

		if (node.children.length > 0) {
			const first = node.children[0]
			const last = node.children[node.children.length - 1]
			const firstThread = first.thread
			const lastThread = last.thread

			if (firstThread) {
				first.ancestor = firstThread.ancestor
			}
			if (lastThread) {
				last.ancestor = lastThread.ancestor
			}
		}
	}
}

function getMaxHeight(node: LayoutNode): number {
	let maxHeight = node.height
	for (const child of node.children) {
		maxHeight = Math.max(maxHeight, getMaxHeight(child))
	}
	return maxHeight
}

function moveSubtree(node: LayoutNode, shift: number): void {
	node.x += shift
	node.mod += shift
}

function executeShifts(node: LayoutNode): void {
	let shift = 0
	let change = 0

	for (let i = node.children.length - 1; i >= 0; i--) {
		const child = node.children[i]
		if (child.shift && child.change) {
			child.x += shift
			child.mod += shift
			change += child.change
			shift += child.shift + change
		}
	}
}

function secondWalk(node: LayoutNode, modSum: number = 0, xMin: number = Infinity): number {
	node.x += modSum
	modSum += node.mod

	if (node.x < xMin) {
		xMin = node.x
	}

	for (const child of node.children) {
		xMin = secondWalk(child, modSum, xMin)
	}

	return xMin
}

function thirdWalk(node: LayoutNode, xOffset: number, yOffset: number): void {
	node.x += xOffset
	node.y = node.y * (VERTICAL_GAP + getAverageHeight(node)) + yOffset

	for (const child of node.children) {
		thirdWalk(child, xOffset, yOffset)
	}
}

function getAverageHeight(node: LayoutNode): number {
	let totalHeight = node.height
	let count = 1

	for (const child of node.children) {
		const result = getAverageHeight(child)
		totalHeight += result
		count++
	}

	return totalHeight / count
}

function calculatePositions(
	editor: Editor,
	root: LayoutNode
): Map<TLShapeId, { x: number; y: number }> {
	firstWalk(root)
	const xMin = secondWalk(root)

	const rootBounds = Box.ZeroFix(editor.getShapePageBounds(root.id)!)
	const originalRootX = rootBounds.minX
	const originalRootY = rootBounds.minY

	thirdWalk(root, -xMin + originalRootX, originalRootY)

	const positions = new Map<TLShapeId, { x: number; y: number }>()

	function collectPositions(node: LayoutNode, parentX: number = 0, parentY: number = 0) {
		const x = parentX + node.x + HORIZONTAL_GAP * (node === root ? 0 : 1)
		const y = parentY + node.y - node.height / 2

		positions.set(node.id, { x, y })

		for (const child of node.children) {
			collectPositions(child, x, y)
		}
	}

	collectPositions(root)

	return positions
}

export function reingoldTilfordLayout(
	editor: Editor,
	rootId: TLShapeId
): Map<TLShapeId, { x: number; y: number }> {
	const tree = buildTree(editor, rootId)
	return calculatePositions(editor, tree)
}

interface AnimationState {
	startPositions: Map<TLShapeId, Vec>
	endPositions: Map<TLShapeId, Vec>
	startTime: number
	duration: number
	active: boolean
}

const animationStates = new WeakMap<Editor, AnimationState>()

export function startLayoutAnimation(
	editor: Editor,
	rootId: TLShapeId,
	duration: number = 300
): void {
	const newPositions = reingoldTilfordLayout(editor, rootId)

	const startPositions = new Map<TLShapeId, Vec>()
	const endPositions = new Map<TLShapeId, Vec>()

	function collectAllNodes(nodeId: TLShapeId) {
		const bounds = Box.ZeroFix(editor.getShapePageBounds(nodeId)!)
		startPositions.set(nodeId, new Vec(bounds.minX, bounds.minY))

		const newPos = newPositions.get(nodeId)
		if (newPos) {
			endPositions.set(nodeId, new Vec(newPos.x, newPos.y))
		}

		if (!isNodeCollapsed(editor, nodeId)) {
			const children = getChildNodes(editor, nodeId)
			for (const child of children) {
				collectAllNodes(child.id)
			}
		}
	}

	collectAllNodes(rootId)

	const animationState: AnimationState = {
		startPositions,
		endPositions,
		startTime: performance.now(),
		duration,
		active: true,
	}

	animationStates.set(editor, animationState)

	function animate() {
		const state = animationStates.get(editor)
		if (!state || !state.active) return

		const elapsed = performance.now() - state.startTime
		const progress = Math.min(elapsed / state.duration, 1)

		const easeProgress = easeInOutCubic(progress)

		editor.batch(() => {
			for (const [nodeId, endPos] of state.endPositions) {
				const startPos = state.startPositions.get(nodeId)
				if (!startPos) continue

				const x = lerp(startPos.x, endPos.x, easeProgress)
				const y = lerp(startPos.y, endPos.y, easeProgress)

				const shape = editor.getShape(nodeId)
				if (shape) {
					editor.updateShape({
						...shape,
						x,
						y,
					})
				}
			}
		})

		if (progress < 1) {
			requestAnimationFrame(animate)
		} else {
			state.active = false
		}
	}

	requestAnimationFrame(animate)
}

function easeInOutCubic(t: number): number {
	return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t
}

export function cancelLayoutAnimation(editor: Editor): void {
	const state = animationStates.get(editor)
	if (state) {
		state.active = false
	}
}
