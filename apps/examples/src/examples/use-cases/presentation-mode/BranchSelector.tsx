import {
	TldrawUiButton,
	track,
	useEditor,
	useValue,
} from 'tldraw'
import * as React from 'react'
import { $presentationState, selectBranch } from './usePresentationMode'
import './presentation-mode.css'

export const BranchSelector = track(() => {
	const editor = useEditor()
	const state = useValue('presentation state', () => $presentationState.get(), [])

	if (!state.isActive || state.pendingBranches.length === 0) return null

	return (
		<div
			className="tlui-presentation-branch-selector"
			onPointerDown={editor.markEventAsHandled}
		>
			<div className="tlui-presentation-branch-selector__header">
				<span className="tlui-presentation-branch-selector__title">
					Choose a branch
				</span>
			</div>
			<div className="tlui-presentation-branch-selector__options">
				{state.pendingBranches.map((branch, index) => (
					<TldrawUiButton
						key={branch.targetFrameId}
						type="normal"
						className="tlui-presentation-branch-selector__option"
						onClick={() => selectBranch(editor, branch)}
					>
						<div className="tlui-presentation-branch-selector__option-index">
							{index + 1}
						</div>
						<div className="tlui-presentation-branch-selector__option-name">
							{branch.targetFrameName}
						</div>
					</TldrawUiButton>
				))}
			</div>
			<div className="tlui-presentation-branch-selector__hint">
				Press number keys to select, or Escape to cancel
			</div>
		</div>
	)
})
