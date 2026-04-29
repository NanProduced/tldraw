import {
	TldrawUiButton,
	TldrawUiButtonIcon,
	track,
	useEditor,
	useValue,
} from 'tldraw'
import * as React from 'react'
import {
	$presentationState,
	getCurrentFrameNote,
	toggleNotes,
	updateFrameNote,
} from './usePresentationMode'
import './presentation-mode.css'

export const SpeakerNotes = track(() => {
	const editor = useEditor()
	const state = useValue('presentation state', () => $presentationState.get(), [])
	const note = useValue('current frame note', () => getCurrentFrameNote(editor), [editor])

	if (!state.isActive || !state.showNotes) return null

	return (
		<div
			className="tlui-presentation-notes"
			onPointerDown={editor.markEventAsHandled}
		>
			<div className="tlui-presentation-notes__header">
				<span className="tlui-presentation-notes__title">Speaker Notes</span>
				<TldrawUiButton
					type="icon"
					onClick={() => toggleNotes()}
					className="tlui-presentation-notes__close"
				>
					<TldrawUiButtonIcon icon="cross" />
				</TldrawUiButton>
			</div>
			<div className="tlui-presentation-notes__content">
				<textarea
					value={note}
					onChange={(e) => {
						const currentFrameId = $presentationState.get().currentFrameId
						if (currentFrameId) {
							updateFrameNote(editor, currentFrameId, e.target.value)
						}
					}}
					placeholder="Add speaker notes here..."
					className="tlui-presentation-notes__textarea"
				/>
			</div>
		</div>
	)
})
