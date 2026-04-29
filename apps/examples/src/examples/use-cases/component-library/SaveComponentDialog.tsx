import { track, useEditor } from 'tldraw'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
	TldrawUiButton,
	TldrawUiButtonLabel,
	TldrawUiDialogBody,
	TldrawUiDialogCloseButton,
	TldrawUiDialogFooter,
	TldrawUiDialogHeader,
	TldrawUiDialogTitle,
	TldrawUiInput,
	type TLUiDialogProps,
} from 'tldraw'
import { addComponent } from './componentLibraryStore'

export const SaveComponentDialog = track(function SaveComponentDialog({
	onClose,
}: TLUiDialogProps) {
	const editor = useEditor()
	const rInput = useRef<HTMLInputElement>(null)

	useEffect(() => {
		editor.timers.requestAnimationFrame(() => rInput.current?.focus())
	}, [editor])

	const [name, setName] = useState('')

	const handleCancel = useCallback(() => {
		onClose()
	}, [onClose])

	const handleSave = useCallback(() => {
		const selectedShapeIds = editor.getSelectedShapeIds()
		if (selectedShapeIds.length === 0) {
			onClose()
			return
		}

		const content = editor.getContentFromCurrentPage(selectedShapeIds)
		if (!content) {
			onClose()
			return
		}

		addComponent(name || `Component ${Date.now()}`, content)
		onClose()
	}, [editor, name, onClose])

	const selectedShapeIds = editor.getSelectedShapeIds()
	const shapeCount = selectedShapeIds.length

	return (
		<>
			<TldrawUiDialogHeader>
				<TldrawUiDialogTitle>Save as Component</TldrawUiDialogTitle>
				<TldrawUiDialogCloseButton />
			</TldrawUiDialogHeader>
			<TldrawUiDialogBody>
				<div style={{ padding: '8px 0' }}>
					<TldrawUiInput
						ref={rInput}
						label="Component name"
						autoFocus
						autoSelect
						placeholder="Enter component name..."
						value={name}
						onValueChange={setName}
						onComplete={handleSave}
						onCancel={handleCancel}
					/>
					<div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-muted)' }}>
						{shapeCount} shape{shapeCount !== 1 ? 's' : ''} selected
					</div>
				</div>
			</TldrawUiDialogBody>
			<TldrawUiDialogFooter className="tlui-dialog__footer__actions">
				<TldrawUiButton type="normal" onClick={handleCancel} onTouchEnd={handleCancel}>
					<TldrawUiButtonLabel>Cancel</TldrawUiButtonLabel>
				</TldrawUiButton>
				<TldrawUiButton type="primary" disabled={shapeCount === 0} onTouchEnd={handleSave} onClick={handleSave}>
					<TldrawUiButtonLabel>Save</TldrawUiButtonLabel>
				</TldrawUiButton>
			</TldrawUiDialogFooter>
		</>
	)
})
