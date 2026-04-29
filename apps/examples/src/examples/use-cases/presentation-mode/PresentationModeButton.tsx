import {
	TldrawUiButton,
	TldrawUiButtonIcon,
	track,
	useEditor,
	useValue,
} from 'tldraw'
import * as React from 'react'
import { $presentationState, startPresentation, stopPresentation } from './usePresentationMode'
import './presentation-mode.css'

export const PresentationModeButton = track(() => {
	const editor = useEditor()
	const state = useValue('presentation state', () => $presentationState.get(), [])

	const handleToggle = () => {
		if (state.isActive) {
			stopPresentation(editor)
		} else {
			startPresentation(editor)
		}
	}

	return (
		<TldrawUiButton
			type="normal"
			onClick={handleToggle}
			className={`tlui-presentation-mode-button ${
				state.isActive ? 'tlui-presentation-mode-button--active' : ''
			}`}
		>
			<span className="tlui-presentation-mode-button__icon">
				<TldrawUiButtonIcon icon={state.isActive ? 'group' : 'tool-frame'} small />
			</span>
			<span className="tlui-presentation-mode-button__label">
				{state.isActive ? 'Exit Presentation' : 'Present'}
			</span>
		</TldrawUiButton>
	)
})

export const PresentationIndicator = track(() => {
	const editor = useEditor()
	const state = useValue('presentation state', () => $presentationState.get(), [])
	const frames = useValue(
		'frames',
		() => {
			const pageId = editor.getCurrentPageId()
			if (!pageId) return []
			return editor
				.getSortedChildIdsForParent(pageId)
				.map((id) => editor.getShape(id))
				.filter((shape) => shape?.type === 'frame')
		},
		[editor]
	)

	if (!state.isActive) return null

	const currentIndex = frames.findIndex((f) => f?.id === state.currentFrameId)
	const totalFrames = frames.length

	return (
		<div
			className="tlui-presentation-indicator"
			onPointerDown={editor.markEventAsHandled}
		>
			<span className="tlui-presentation-indicator__dot" />
			<span className="tlui-presentation-indicator__text">
				Presentation Mode {currentIndex >= 0 ? `(${currentIndex + 1}/${totalFrames})` : ''}
			</span>
		</div>
	)
})
