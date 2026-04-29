import {
	Box,
	Editor,
	TLNoteShape,
	TLShapeId,
	useEditor,
	useValue,
} from '@tldraw/editor'
import React, { useCallback, useMemo } from 'react'
import {
	alignNotesToGrid,
	autoTagNotes,
	createCardStackFromNotes,
	createFramesForColorGroups,
	exportNotesToMarkdown,
	groupNotesByColor,
	sortNotesWithAnimation,
	voteForNote,
} from '../../../utils/note-organization/noteOrganization'
import { TldrawUiContextualToolbar } from '../primitives/TldrawUiContextualToolbar'
import { TldrawUiToolbarButton } from '../primitives/TldrawUiToolbar'
import { TldrawUiButtonIcon } from '../primitives/Button/TldrawUiButtonIcon'
import { useToasts } from '../../context/toasts'

function getSelectedNoteIds(editor: Editor): TLShapeId[] {
	const selectedIds = editor.getSelectedShapeIds()

	const noteIds = selectedIds.filter((id) => {
		const shape = editor.getShape(id)
		return shape && shape.type === 'note'
	})

	return noteIds
}

const SORT_ORDERS = [
	{ key: 'time', label: '时间', icon: 'dots-horizontal' },
	{ key: 'votes', label: '票数', icon: 'plus' },
	{ key: 'color', label: '颜色', icon: 'color' },
] as const

/** @public */
export function NoteContextualToolbar() {
	const editor = useEditor()
	const toasts = useToasts()

	const selectedNoteIds = useValue(
		'selectedNoteIds',
		() => getSelectedNoteIds(editor),
		[editor]
	)

	const hasNotes = selectedNoteIds.length >= 1
	const hasMultipleNotes = selectedNoteIds.length >= 2
	const hasSingleNote = selectedNoteIds.length === 1

	const selectedNote = useValue(
		'selectedNote',
		() => {
			if (hasSingleNote) {
				return editor.getShape<TLNoteShape>(selectedNoteIds[0])
			}
			return undefined
		},
		[editor, selectedNoteIds, hasSingleNote]
	)

	const getSelectionBoundsCallback = useCallback(() => {
		const fullBounds = editor.getSelectionScreenBounds()
		if (!fullBounds) return undefined
		return new Box(fullBounds.x, fullBounds.y, fullBounds.width, 0)
	}, [editor])

	const handleVote = useCallback(() => {
		if (hasSingleNote && selectedNote) {
			voteForNote(editor, selectedNote.id)
		}
	}, [editor, hasSingleNote, selectedNote])

	const handleGridAlign = useCallback(() => {
		editor.markHistoryStoppingPoint('grid align notes')
		alignNotesToGrid(editor, selectedNoteIds, 64)
	}, [editor, selectedNoteIds])

	const handleStack = useCallback(() => {
		editor.markHistoryStoppingPoint('stack notes')
		createCardStackFromNotes(editor, selectedNoteIds)
	}, [editor, selectedNoteIds])

	const handleColorGroup = useCallback(() => {
		const notes = selectedNoteIds
			.map((id) => editor.getShape<TLNoteShape>(id))
			.filter((n): n is TLNoteShape => n !== undefined && n.type === 'note')

		if (notes.length === 0) return

		const groups = groupNotesByColor(notes)

		editor.markHistoryStoppingPoint('group notes by color')
		createFramesForColorGroups(editor, groups)
	}, [editor, selectedNoteIds])

	const handleAutoTag = useCallback(() => {
		editor.markHistoryStoppingPoint('auto tag notes')
		autoTagNotes(editor, selectedNoteIds)
	}, [editor, selectedNoteIds])

	const handleSort = useCallback(
		(order: string) => {
			editor.markHistoryStoppingPoint(`sort notes by ${order}`)
			sortNotesWithAnimation(editor, selectedNoteIds, order as 'time' | 'votes' | 'color')
		},
		[editor, selectedNoteIds]
	)

	const handleExportMarkdown = useCallback(() => {
		const markdown = exportNotesToMarkdown(editor, selectedNoteIds, true)

		navigator.clipboard.writeText(markdown).then(() => {
			toasts.addToast({
				icon: 'check',
				title: '已复制',
				description: 'Markdown 已复制到剪贴板',
			})
		}).catch(() => {
			toasts.addToast({
				icon: 'cross',
				title: '复制失败',
				description: '无法复制到剪贴板',
			})
		})
	}, [editor, selectedNoteIds, toasts])

	if (!hasNotes) return null

	return (
		<TldrawUiContextualToolbar
			className="tlui-note-organization__toolbar"
			getSelectionBounds={getSelectionBoundsCallback}
			label={hasSingleNote ? "Note actions" : "Note organization"}
		>
			{hasSingleNote && selectedNote && (
				<>
					<TldrawUiToolbarButton
						type="icon"
						title={`投票 (${selectedNote.props.voteCount || 0})`}
						onClick={handleVote}
					>
						<TldrawUiButtonIcon icon="star" small />
					</TldrawUiToolbarButton>
				</>
			)}

			{hasMultipleNotes && (
				<>
					<TldrawUiToolbarButton
						type="icon"
						title="网格对齐"
						onClick={handleGridAlign}
					>
						<TldrawUiButtonIcon icon="corners" small />
					</TldrawUiToolbarButton>

					<TldrawUiToolbarButton
						type="icon"
						title="创建堆栈"
						onClick={handleStack}
					>
						<TldrawUiButtonIcon icon="menu" small />
					</TldrawUiToolbarButton>

					<TldrawUiToolbarButton
						type="icon"
						title="按颜色分组"
						onClick={handleColorGroup}
					>
						<TldrawUiButtonIcon icon="color" small />
					</TldrawUiToolbarButton>

					<TldrawUiToolbarButton
						type="icon"
						title="自动打标签"
						onClick={handleAutoTag}
					>
						<TldrawUiButtonIcon icon="question-mark" small />
					</TldrawUiToolbarButton>

					<div style={{ width: 1, height: 24, backgroundColor: 'var(--color-muted-1)', margin: '0 4px' }} />

					{SORT_ORDERS.map((order) => (
						<TldrawUiToolbarButton
							key={order.key}
							type="icon"
							title={`按${order.label}排序`}
							onClick={() => handleSort(order.key)}
						>
							<TldrawUiButtonIcon icon={order.icon} small />
						</TldrawUiToolbarButton>
					))}
				</>
			)}

			<div style={{ width: 1, height: 24, backgroundColor: 'var(--color-muted-1)', margin: '0 4px' }} />

			<TldrawUiToolbarButton
				type="icon"
				title="导出 Markdown"
				onClick={handleExportMarkdown}
			>
				<TldrawUiButtonIcon icon="duplicate" small />
			</TldrawUiToolbarButton>
		</TldrawUiContextualToolbar>
	)
}
