import {
	CenteredTopPanelContainer,
	DefaultToolbar,
	DefaultToolbarContent,
	TLComponents,
	TLUiOverrides,
	Tldraw,
	TldrawUiButton,
	TldrawUiButtonIcon,
	computed,
	createShapeId,
	track,
	useEditor,
	useValue,
} from 'tldraw'
import 'tldraw/tldraw.css'
import { BranchSelector } from './BranchSelector'
import { FrameListDrawer } from './FrameListDrawer'
import './presentation-mode.css'
import { PresentationIndicator, PresentationModeButton } from './PresentationModeButton'
import { ScreenOverlay } from './ScreenOverlay'
import { SpeakerNotes } from './SpeakerNotes'
import {
	$presentationState,
	getFramesWithOrder,
	nextFrame,
	prevFrame,
	selectBranch,
	startPresentation,
	stopPresentation,
	toggleFrameList,
	toggleNotes,
	toggleScreenMode,
} from './usePresentationMode'

const components: TLComponents = {
	Toolbar: (props) => {
		return (
			<DefaultToolbar {...props}>
				<DefaultToolbarContent />
			</DefaultToolbar>
		)
	},
	TopPanel: () => {
		return (
			<CenteredTopPanelContainer>
				<PresentationModeButton />
			</CenteredTopPanelContainer>
		)
	},
	InFrontOfTheCanvas: () => {
		return (
			<>
				<PresentationIndicator />
				<ScreenOverlay />
				<BranchSelector />
				<FrameListDrawer />
				<SpeakerNotes />
				<PresentationControls />
			</>
		)
	},
}

const PresentationControls = track(() => {
	const editor = useEditor()
	const state = useValue('presentation state', () => $presentationState.get(), [])
	const frames = useValue('frames', () => getFramesWithOrder(editor), [editor])

	if (!state.isActive) return null

	const currentIndex = frames.findIndex((f) => f.shape.id === state.currentFrameId)
	const totalFrames = frames.length

	return (
		<div
			className="tlui-presentation-controls"
			onPointerDown={editor.markEventAsHandled}
		>
			<TldrawUiButton
				type="icon"
				onClick={() => prevFrame(editor)}
				className="tlui-presentation-controls__button"
				disabled={currentIndex <= 0 && state.pendingBranches.length === 0}
			>
				<TldrawUiButtonIcon icon="chevron-left" small />
			</TldrawUiButton>

			<div className="tlui-presentation-controls__progress">
				{currentIndex >= 0 ? `${currentIndex + 1}/${totalFrames}` : '-'}
			</div>

			<TldrawUiButton
				type="icon"
				onClick={() => nextFrame(editor)}
				className="tlui-presentation-controls__button"
				disabled={currentIndex >= totalFrames - 1 && state.pendingBranches.length === 0}
			>
				<TldrawUiButtonIcon icon="chevron-right" small />
			</TldrawUiButton>

			<div className="tlui-presentation-controls__separator" />

			<TldrawUiButton
				type="icon"
				onClick={() => toggleScreenMode(editor, 'black')}
				className="tlui-presentation-controls__button"
				title="Black screen (B)"
			>
				<TldrawUiButtonIcon icon="geo-rectangle" small />
			</TldrawUiButton>

			<TldrawUiButton
				type="icon"
				onClick={() => toggleNotes()}
				className="tlui-presentation-controls__button"
				title="Toggle notes (N)"
			>
				<TldrawUiButtonIcon icon="tool-note" small />
			</TldrawUiButton>

			<TldrawUiButton
				type="icon"
				onClick={() => toggleFrameList()}
				className="tlui-presentation-controls__button"
				title="Toggle frame list (L)"
			>
				<TldrawUiButtonIcon icon="list" small />
			</TldrawUiButton>

			<div className="tlui-presentation-controls__separator" />

			<TldrawUiButton
				type="icon"
				onClick={() => stopPresentation(editor)}
				className="tlui-presentation-controls__button"
				title="Exit presentation (Esc)"
			>
				<TldrawUiButtonIcon icon="cross-2" small />
			</TldrawUiButton>
		</div>
	)
})

const overrides: TLUiOverrides = {
	actions(editor, actions) {
		const $frames = computed('frames', () => getFramesWithOrder(editor))

		return {
			...actions,
			'toggle-presentation': {
				id: 'toggle-presentation',
				label: 'Toggle presentation mode',
				kbd: 'f5',
				readonlyOk: true,
				onSelect() {
					const state = $presentationState.get()
					if (state.isActive) {
						stopPresentation(editor)
					} else {
						startPresentation(editor)
					}
				},
			},
			'next-frame': {
				id: 'next-frame',
				label: 'Next frame',
				kbd: 'right,space',
				readonlyOk: true,
				onSelect() {
					const state = $presentationState.get()
					if (!state.isActive) return

					if (state.pendingBranches.length > 0) {
						return
					}

					nextFrame(editor)
				},
			},
			'prev-frame': {
				id: 'prev-frame',
				label: 'Previous frame',
				kbd: 'left',
				readonlyOk: true,
				onSelect() {
					const state = $presentationState.get()
					if (!state.isActive) return

					prevFrame(editor)
				},
			},
			'toggle-black-screen': {
				id: 'toggle-black-screen',
				label: 'Toggle black screen',
				kbd: 'b',
				readonlyOk: true,
				onSelect() {
					const state = $presentationState.get()
					if (!state.isActive) return

					toggleScreenMode(editor, 'black')
				},
			},
			'toggle-white-screen': {
				id: 'toggle-white-screen',
				label: 'Toggle white screen',
				kbd: 'w',
				readonlyOk: true,
				onSelect() {
					const state = $presentationState.get()
					if (!state.isActive) return

					toggleScreenMode(editor, 'white')
				},
			},
			'exit-presentation': {
				id: 'exit-presentation',
				label: 'Exit presentation',
				kbd: 'escape',
				readonlyOk: true,
				onSelect() {
					const state = $presentationState.get()
					if (!state.isActive) return

					if (state.pendingBranches.length > 0) {
						$presentationState.set({
							...state,
							pendingBranches: [],
						})
						return
					}

					stopPresentation(editor)
				},
			},
			'select-branch-1': {
				id: 'select-branch-1',
				label: 'Select branch 1',
				kbd: '1',
				readonlyOk: true,
				onSelect() {
					const state = $presentationState.get()
					if (!state.isActive || state.pendingBranches.length === 0) return

					const branch = state.pendingBranches[0]
					if (branch) {
						selectBranch(editor, branch)
					}
				},
			},
			'select-branch-2': {
				id: 'select-branch-2',
				label: 'Select branch 2',
				kbd: '2',
				readonlyOk: true,
				onSelect() {
					const state = $presentationState.get()
					if (!state.isActive || state.pendingBranches.length < 2) return

					const branch = state.pendingBranches[1]
					if (branch) {
						selectBranch(editor, branch)
					}
				},
			},
			'select-branch-3': {
				id: 'select-branch-3',
				label: 'Select branch 3',
				kbd: '3',
				readonlyOk: true,
				onSelect() {
					const state = $presentationState.get()
					if (!state.isActive || state.pendingBranches.length < 3) return

					const branch = state.pendingBranches[2]
					if (branch) {
						selectBranch(editor, branch)
					}
				},
			},
			'select-branch-4': {
				id: 'select-branch-4',
				label: 'Select branch 4',
				kbd: '4',
				readonlyOk: true,
				onSelect() {
					const state = $presentationState.get()
					if (!state.isActive || state.pendingBranches.length < 4) return

					const branch = state.pendingBranches[3]
					if (branch) {
						selectBranch(editor, branch)
					}
				},
			},
			'toggle-notes': {
				id: 'toggle-notes',
				label: 'Toggle speaker notes',
				kbd: 'n',
				readonlyOk: true,
				onSelect() {
					const state = $presentationState.get()
					if (!state.isActive) return

					toggleNotes()
				},
			},
			'toggle-frame-list': {
				id: 'toggle-frame-list',
				label: 'Toggle frame list',
				kbd: 'l',
				readonlyOk: true,
				onSelect() {
					const state = $presentationState.get()
					if (!state.isActive) return

					toggleFrameList()
				},
			},
		}
	},
}

const PresentationModeExample = track(() => {
	return (
		<div className="tldraw__editor">
			<Tldraw
				persistenceKey="presentation_mode_example"
				components={components}
				overrides={overrides}
				onMount={(editor) => {
					const existingFrames = getFramesWithOrder(editor)
					if (existingFrames.length === 0) {
						editor.createShapes([
							{
								id: createShapeId(),
								type: 'frame',
								x: 100,
								y: 100,
								props: { w: 960, h: 540, name: 'Welcome' },
								meta: {
									note: 'Welcome to the presentation mode demo!\n\n- Press Space or Right Arrow to advance\n- Press Left Arrow to go back\n- Press B for black screen\n- Press W for white screen\n- Press Esc to exit',
									presentationOrder: 0,
								},
							},
							{
								id: createShapeId(),
								type: 'frame',
								x: 1160,
								y: 100,
								props: { w: 960, h: 540, name: 'Features' },
								meta: {
									note: 'Presentation mode features:\n\n1. Smooth camera transitions between frames\n2. Speaker notes based on frame meta.note\n3. Drag-and-drop frame reordering\n4. Branch navigation with multiple outgoing arrows',
									presentationOrder: 1,
								},
							},
							{
								id: createShapeId(),
								type: 'frame',
								x: 100,
								y: 740,
								props: { w: 960, h: 540, name: 'Branch A' },
								meta: {
									note: 'This is Branch A - one possible path through your presentation.',
									presentationOrder: 2,
								},
							},
							{
								id: createShapeId(),
								type: 'frame',
								x: 1160,
								y: 740,
								props: { w: 960, h: 540, name: 'Branch B' },
								meta: {
									note: 'This is Branch B - another possible path.\n\nTry connecting arrows from "Features" to both "Branch A" and "Branch B" to see branch selection in action!',
									presentationOrder: 3,
								},
							},
						])
					}
				}}
			/>
		</div>
	)
})

export default PresentationModeExample
