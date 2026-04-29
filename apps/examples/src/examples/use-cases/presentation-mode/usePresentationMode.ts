import {
	Box,
	Editor,
	TLArrowBinding,
	TLArrowShape,
	TLFrameShape,
	TLShapeId,
	atom,
	computed,
	transact,
} from '@tldraw/editor'
import { EASINGS } from '@tldraw/editor'
import { FrameBranch, FrameMeta, PresentationFrame, PresentationScreenMode, PresentationState } from './types'

export const $presentationState = atom<PresentationState>('presentation state', {
	isActive: false,
	currentFrameId: null,
	screenMode: 'normal',
	showNotes: true,
	showFrameList: true,
	selectedBranch: null,
	pendingBranches: [],
})

export function getFrames(editor: Editor): TLFrameShape[] {
	const pageId = editor.getCurrentPageId()
	if (!pageId) return []

	return editor
		.getSortedChildIdsForParent(pageId)
		.map((id) => editor.getShape(id))
		.filter((shape): shape is TLFrameShape => shape?.type === 'frame')
}

export function getFramesWithOrder(editor: Editor): PresentationFrame[] {
	const frames = getFrames(editor)
	return frames
		.map((shape) => ({
			shape,
			index: (shape.meta as FrameMeta)?.presentationOrder ?? getDefaultOrder(shape),
		}))
		.sort((a, b) => a.index - b.index)
		.map((frame, i) => ({ ...frame, index: i }))
}

function getDefaultOrder(shape: TLFrameShape): number {
	return shape.x + shape.y * 10000
}

export function updateFrameOrder(editor: Editor, frameId: TLShapeId, newOrder: number) {
	const shape = editor.getShape(frameId)
	if (!shape || shape.type !== 'frame') return

	editor.updateShapes([
		{
			id: frameId,
			type: 'frame',
			meta: {
				...shape.meta,
				presentationOrder: newOrder,
			} as FrameMeta,
		},
	])
}

export function getAllArrowShapes(editor: Editor): TLArrowShape[] {
	const pageId = editor.getCurrentPageId()
	if (!pageId) return []

	return editor
		.getSortedChildIdsForParent(pageId)
		.map((id) => editor.getShape(id))
		.filter((shape): shape is TLArrowShape => shape?.type === 'arrow')
}

export function getArrowBindings(editor: Editor, arrow: TLArrowShape): { start?: TLArrowBinding; end?: TLArrowBinding } {
	const bindings = editor.getBindingsFromShape(arrow.id, 'arrow') as TLArrowBinding[]
	return {
		start: bindings.find((b) => b.props.terminal === 'start'),
		end: bindings.find((b) => b.props.terminal === 'end'),
	}
}

export function getOutgoingBranches(editor: Editor, frameId: TLShapeId): FrameBranch[] {
	const arrows = getAllArrowShapes(editor)
	if (arrows.length === 0) return []

	const branches: FrameBranch[] = []

	for (const arrow of arrows) {
		const bindings = getArrowBindings(editor, arrow)

		if (!bindings.start || bindings.start.toId !== frameId) continue

		if (!bindings.end) continue

		const targetShape = editor.getShape(bindings.end.toId)
		if (!targetShape || targetShape.type !== 'frame') continue

		const targetFrame = targetShape as TLFrameShape

		const alreadyExists = branches.some((b) => b.targetFrameId === targetFrame.id)
		if (alreadyExists) continue

		branches.push({
			targetFrameId: targetFrame.id,
			targetFrameName: targetFrame.props.name || 'Frame',
			arrowId: arrow.id,
		})
	}

	return branches
}

export function zoomToFrame(editor: Editor, frame: TLFrameShape, animate: boolean = true) {
	const bounds = editor.getShapePageBounds(frame.id)
	if (!bounds) return

	editor.stopCameraAnimation()
	editor.zoomToBounds(bounds, {
		inset: 0,
		animation: animate
			? {
					duration: 500,
					easing: EASINGS.easeInOutCubic,
				}
			: undefined,
	})
}

export function startPresentation(editor: Editor) {
	const frames = getFramesWithOrder(editor)
	if (frames.length === 0) return

	const firstFrame = frames[0].shape

	transact(() => {
		$presentationState.set({
			isActive: true,
			currentFrameId: firstFrame.id,
			screenMode: 'normal',
			showNotes: true,
			showFrameList: true,
			selectedBranch: null,
			pendingBranches: [],
		})

		zoomToFrame(editor, firstFrame)
	})

	document.body.classList.add('tlui-presentation-mode')
}

export function stopPresentation(editor: Editor) {
	$presentationState.set({
		isActive: false,
		currentFrameId: null,
		screenMode: 'normal',
		showNotes: true,
		showFrameList: true,
		selectedBranch: null,
		pendingBranches: [],
	})

	document.body.classList.remove('tlui-presentation-mode')
}

export function nextFrame(editor: Editor) {
	const state = $presentationState.get()
	if (!state.isActive) return

	if (state.pendingBranches.length > 0) return

	const frames = getFramesWithOrder(editor)
	if (frames.length === 0) return

	if (!state.currentFrameId) {
		const firstFrame = frames[0].shape
		$presentationState.set({ ...state, currentFrameId: firstFrame.id })
		zoomToFrame(editor, firstFrame)
		return
	}

	const currentIndex = frames.findIndex((f) => f.shape.id === state.currentFrameId)
	if (currentIndex === -1) return

	const currentFrame = frames[currentIndex].shape
	const branches = getOutgoingBranches(editor, currentFrame.id)

	if (branches.length > 1) {
		$presentationState.set({
			...state,
			pendingBranches: branches,
		})
		return
	}

	if (branches.length === 1) {
		const targetFrame = editor.getShape(branches[0].targetFrameId) as TLFrameShape | undefined
		if (targetFrame) {
			$presentationState.set({
				...state,
				currentFrameId: targetFrame.id,
			})
			zoomToFrame(editor, targetFrame)
			return
		}
	}

	const nextIndex = currentIndex + 1
	if (nextIndex < frames.length) {
		const nextFrame = frames[nextIndex].shape
		$presentationState.set({
			...state,
			currentFrameId: nextFrame.id,
		})
		zoomToFrame(editor, nextFrame)
	}
}

export function prevFrame(editor: Editor) {
	const state = $presentationState.get()
	if (!state.isActive) return

	if (state.pendingBranches.length > 0) {
		$presentationState.set({
			...state,
			pendingBranches: [],
		})
		return
	}

	const frames = getFramesWithOrder(editor)
	if (frames.length === 0) return

	if (!state.currentFrameId) return

	const currentIndex = frames.findIndex((f) => f.shape.id === state.currentFrameId)
	if (currentIndex === -1) return

	const prevIndex = currentIndex - 1
	if (prevIndex >= 0) {
		const prevFrame = frames[prevIndex].shape
		$presentationState.set({
			...state,
			currentFrameId: prevFrame.id,
		})
		zoomToFrame(editor, prevFrame)
	}
}

export function selectBranch(editor: Editor, branch: FrameBranch) {
	const state = $presentationState.get()
	if (!state.isActive) return

	const targetFrame = editor.getShape(branch.targetFrameId) as TLFrameShape | undefined
	if (!targetFrame) return

	$presentationState.set({
		...state,
		currentFrameId: targetFrame.id,
		selectedBranch: branch,
		pendingBranches: [],
	})

	zoomToFrame(editor, targetFrame)
}

export function toggleScreenMode(editor: Editor, mode: PresentationScreenMode) {
	const state = $presentationState.get()
	if (!state.isActive) return

	$presentationState.set({
		...state,
		screenMode: state.screenMode === mode ? 'normal' : mode,
	})
}

export function toggleNotes() {
	const state = $presentationState.get()

	$presentationState.set({
		...state,
		showNotes: !state.showNotes,
	})
}

export function toggleFrameList() {
	const state = $presentationState.get()

	$presentationState.set({
		...state,
		showFrameList: !state.showFrameList,
	})
}

export function goToFrame(editor: Editor, frameId: TLShapeId) {
	const state = $presentationState.get()
	if (!state.isActive) return

	const frame = editor.getShape(frameId) as TLFrameShape | undefined
	if (!frame) return

	$presentationState.set({
		...state,
		currentFrameId: frame.id,
		pendingBranches: [],
	})

	zoomToFrame(editor, frame)
}

export function createNewFrame(editor: Editor): TLShapeId {
	const viewportBounds = editor.getViewportPageBounds()
	const centerX = viewportBounds.center.x
	const centerY = viewportBounds.center.y

	const frames = getFramesWithOrder(editor)
	const maxOrder = frames.length > 0 ? Math.max(...frames.map((f) => (f.shape.meta as FrameMeta)?.presentationOrder ?? 0)) : 0

	const frameId = editor.createShape({
		type: 'frame',
		x: centerX - 160,
		y: centerY - 90,
		props: { w: 320, h: 180, name: '', color: 'black' },
		meta: {
			presentationOrder: maxOrder + 1,
			note: '',
		} as FrameMeta,
	})

	return frameId
}

export function getCurrentFrameNote(editor: Editor): string {
	const state = $presentationState.get()
	if (!state.isActive || !state.currentFrameId) return ''

	const frame = editor.getShape(state.currentFrameId)
	if (!frame) return ''

	return (frame.meta as FrameMeta)?.note || ''
}

export function updateFrameNote(editor: Editor, frameId: TLShapeId, note: string) {
	const shape = editor.getShape(frameId)
	if (!shape || shape.type !== 'frame') return

	editor.updateShapes([
		{
			id: frameId,
			type: 'frame',
			meta: {
				...shape.meta,
				note,
			} as FrameMeta,
		},
	])
}

export function usePresentationState() {
	return computed('presentation state', () => $presentationState.get())
}

export function useFrames(editor: Editor) {
	return computed('frames with order', () => getFramesWithOrder(editor))
}

export function useCurrentFrame(editor: Editor) {
	return computed('current frame', () => {
		const state = $presentationState.get()
		if (!state.currentFrameId) return null
		return editor.getShape(state.currentFrameId) as TLFrameShape | null
	})
}
