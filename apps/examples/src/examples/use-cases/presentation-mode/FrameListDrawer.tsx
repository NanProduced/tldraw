import {
	TLFrameShape,
	TldrawUiButton,
	TldrawUiButtonIcon,
	track,
	useEditor,
	useValue,
} from 'tldraw'
import * as React from 'react'
import { useState } from 'react'
import {
	$presentationState,
	createNewFrame,
	getFramesWithOrder,
	goToFrame,
	toggleFrameList,
	updateFrameOrder,
} from './usePresentationMode'
import './presentation-mode.css'

export const FrameListDrawer = track(() => {
	const editor = useEditor()
	const state = useValue('presentation state', () => $presentationState.get(), [])
	const frames = useValue('frames', () => getFramesWithOrder(editor), [editor])

	const [draggedFrameId, setDraggedFrameId] = useState<string | null>(null)
	const [dragOverFrameId, setDragOverFrameId] = useState<string | null>(null)

	const shouldShow = state.isActive
	if (!shouldShow && !state.showFrameList) return null

	const handleDragStart = (e: React.DragEvent, frameId: string) => {
		setDraggedFrameId(frameId)
		e.dataTransfer.effectAllowed = 'move'
	}

	const handleDragOver = (e: React.DragEvent, frameId: string) => {
		e.preventDefault()
		if (draggedFrameId && draggedFrameId !== frameId) {
			setDragOverFrameId(frameId)
		}
	}

	const handleDragLeave = () => {
		setDragOverFrameId(null)
	}

	const handleDrop = (e: React.DragEvent, targetFrameId: string) => {
		e.preventDefault()
		if (!draggedFrameId || draggedFrameId === targetFrameId) {
			setDraggedFrameId(null)
			setDragOverFrameId(null)
			return
		}

		const draggedFrameIndex = frames.findIndex((f) => f.shape.id === draggedFrameId)
		const targetFrameIndex = frames.findIndex((f) => f.shape.id === targetFrameId)

		if (draggedFrameIndex === -1 || targetFrameIndex === -1) {
			setDraggedFrameId(null)
			setDragOverFrameId(null)
			return
		}

		const newFrames = [...frames]
		const [movedFrame] = newFrames.splice(draggedFrameIndex, 1)
		newFrames.splice(targetFrameIndex, 0, movedFrame)

		newFrames.forEach((frame, index) => {
			updateFrameOrder(editor, frame.shape.id, index)
		})

		setDraggedFrameId(null)
		setDragOverFrameId(null)
	}

	const handleDragEnd = () => {
		setDraggedFrameId(null)
		setDragOverFrameId(null)
	}

	const handleCreateFrame = () => {
		createNewFrame(editor)
	}

	return (
		<div
			className="tlui-presentation-frame-list"
			onPointerDown={editor.markEventAsHandled}
		>
			<div className="tlui-presentation-frame-list__header">
				<span className="tlui-presentation-frame-list__title">Frames</span>
				<div className="tlui-presentation-frame-list__header-actions">
					<TldrawUiButton
						type="icon"
						onClick={handleCreateFrame}
						title="New Frame"
					>
						<TldrawUiButtonIcon icon="plus" />
					</TldrawUiButton>
					<TldrawUiButton
						type="icon"
						onClick={() => toggleFrameList()}
						className="tlui-presentation-frame-list__close"
					>
						<TldrawUiButtonIcon icon="cross" />
					</TldrawUiButton>
				</div>
			</div>
			<div className="tlui-presentation-frame-list__content">
				{frames.map((frame, index) => {
					const shape = frame.shape as TLFrameShape
					const isCurrent = state.currentFrameId === shape.id
					const isDragging = draggedFrameId === shape.id
					const isDragOver = dragOverFrameId === shape.id

					return (
						<div
							key={shape.id}
							className={`tlui-presentation-frame-list__item ${
								isCurrent ? 'tlui-presentation-frame-list__item--active' : ''
							} ${isDragging ? 'tlui-presentation-frame-list__item--dragging' : ''} ${
								isDragOver ? 'tlui-presentation-frame-list__item--drag-over' : ''
							}`}
							draggable
							onDragStart={(e) => handleDragStart(e, shape.id)}
							onDragOver={(e) => handleDragOver(e, shape.id)}
							onDragLeave={handleDragLeave}
							onDrop={(e) => handleDrop(e, shape.id)}
							onDragEnd={handleDragEnd}
							onClick={() => {
								if (state.isActive) {
									goToFrame(editor, shape.id)
								}
							}}
						>
							<div className="tlui-presentation-frame-list__item-index">
								{index + 1}
							</div>
							<div className="tlui-presentation-frame-list__item-info">
								<div className="tlui-presentation-frame-list__item-name">
									{shape.props.name || `Frame ${index + 1}`}
								</div>
								<div className="tlui-presentation-frame-list__item-dimensions">
									{Math.round(shape.props.w)} × {Math.round(shape.props.h)}
								</div>
							</div>
							{isCurrent && (
								<div className="tlui-presentation-frame-list__item-indicator">
									<TldrawUiButtonIcon icon="chevron-right" small />
								</div>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
})
