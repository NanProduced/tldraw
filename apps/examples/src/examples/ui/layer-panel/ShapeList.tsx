import { capitalize } from 'lodash'
import React, { useCallback, useRef, useState } from 'react'
import {
  Editor,
  TLShape,
  TLShapeId,
  TldrawUiDropdownMenuContent,
  TldrawUiDropdownMenuGroup,
  TldrawUiDropdownMenuRoot,
  TldrawUiDropdownMenuTrigger,
  TldrawUiMenuActionItem,
  TldrawUiMenuContextProvider,
  track,
  useEditor,
  useValue,
} from 'tldraw'
import {
  ArrowIcon,
  BookmarkIcon,
  ChevronRightIcon,
  DrawIcon,
  EmbedIcon,
  EyeCloseIcon,
  EyeOpenIcon,
  FrameIcon,
  GeoIcon,
  GroupIcon,
  HighlightIcon,
  ImageIcon,
  LineIcon,
  LockCloseIcon,
  LockOpenIcon,
  NoteIcon,
  TextIcon,
  TrashIcon,
  VideoIcon,
} from './icons'

const getShapeIcon = (shapeType: string) => {
  switch (shapeType) {
    case 'geo':
      return GeoIcon
    case 'arrow':
      return ArrowIcon
    case 'text':
      return TextIcon
    case 'draw':
      return DrawIcon
    case 'frame':
      return FrameIcon
    case 'group':
      return GroupIcon
    case 'image':
      return ImageIcon
    case 'video':
      return VideoIcon
    case 'note':
      return NoteIcon
    case 'bookmark':
      return BookmarkIcon
    case 'embed':
      return EmbedIcon
    case 'highlight':
      return HighlightIcon
    case 'line':
      return LineIcon
    default:
      return GeoIcon
  }
}

const ShapeItem = track(function ShapeItem({
  shapeId,
  depth,
}: {
  shapeId: TLShapeId
  depth: number
}) {
  const editor = useEditor()
  const triggerRef = useRef<HTMLDivElement>(null)

  const shape = useValue('shape', () => editor.getShape(shapeId), [editor])
  const children = useValue('children', () => editor.getSortedChildIdsForParent(shapeId), [editor])
  const isHidden = useValue('isHidden', () => editor.isShapeHidden(shapeId), [editor])
  const isSelected = useValue('isSelected', () => editor.getSelectedShapeIds().includes(shapeId), [
    editor,
  ])
  const isLocked = useValue('isLocked', () => {
    const s = editor.getShape(shapeId)
    return s?.isLocked ?? false
  }, [editor])
  const shapeName = useValue('shapeName', () => getShapeName(editor, shapeId), [editor])
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditingName, setIsEditingName] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const hasChildren = children.length > 0
  const ShapeIcon = shape ? getShapeIcon(shape.type) : GeoIcon

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isEditingName) return

      const shape = editor.getShape(shapeId)
      if (!shape) return

      if (e.ctrlKey || e.metaKey) {
        if (isSelected) {
          editor.deselect(shape)
        } else {
          editor.select(...editor.getSelectedShapes(), shape)
        }
      } else if (e.shiftKey) {
        editor.select(...editor.getSelectedShapes(), shape)
      } else {
        editor.select(shape)
        editor.zoomToSelection({ animation: { duration: 200 } })
      }
    },
    [editor, shapeId, isSelected, isEditingName]
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsEditingName(true)
      editor.select(shapeId)
    },
    [editor, shapeId]
  )

  const handleToggleExpand = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsExpanded((prev) => !prev)
    },
    []
  )

  const handleToggleVisibility = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      const shape = editor.getShape(shapeId)
      if (!shape) return

      editor.markHistoryStoppingPoint('toggle visibility')
      editor.updateShapes([
        {
          id: shapeId,
          type: shape.type,
          meta: {
            ...shape.meta,
            hidden: !shape.meta.hidden,
          },
        },
      ])
    },
    [editor, shapeId]
  )

  const handleToggleLock = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      editor.markHistoryStoppingPoint('toggle lock')
      editor.run(
        () => {
          editor.toggleLock([shapeId])
        },
        { ignoreShapeLock: true }
      )
    },
    [editor, shapeId]
  )

  const handleNameChange = useCallback(
    (value: string) => {
      const shape = editor.getShape(shapeId)
      if (!shape) return

      editor.markHistoryStoppingPoint('rename shape')

      if (shape.type === 'frame') {
        editor.updateShapes([
          {
            id: shapeId,
            type: 'frame',
            props: { name: value },
          },
        ])
      } else {
        editor.updateShapes([
          {
            id: shapeId,
            type: shape.type,
            meta: {
              ...shape.meta,
              name: value,
            },
          },
        ])
      }
    },
    [editor, shapeId]
  )

  const handleNameInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      handleNameChange(e.currentTarget.value)
      setIsEditingName(false)
    },
    [handleNameChange]
  )

  const handleNameInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        e.preventDefault()
        e.currentTarget.blur()
      }
      if (e.key === 'Escape') {
        setIsEditingName(false)
      }
    },
    []
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isSelected) {
        editor.select(shapeId)
      }
      setIsMenuOpen(true)
    },
    [editor, shapeId, isSelected]
  )

  const handleMenuOpenChange = useCallback(
    (open: boolean) => {
      setIsMenuOpen(open)
    },
    []
  )

  if (!shape) return null

  return (
    <TldrawUiDropdownMenuRoot open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
      <TldrawUiDropdownMenuTrigger asChild>
        <div ref={triggerRef} style={{ display: 'contents' }}>
          <div
            className={`shape-item ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''} ${isHidden ? 'hidden' : ''}`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            style={{ paddingLeft: 8 + depth * 16 }}
          >
            {depth > 0 && <div className="shape-indent" />}

            {hasChildren ? (
              <button
                className={`shape-expand-toggle ${isExpanded ? 'expanded' : ''}`}
                onClick={handleToggleExpand}
              >
                <ChevronRightIcon className="shape-expand-icon" />
              </button>
            ) : (
              <div className="shape-indent" />
            )}

            <ShapeIcon className="shape-icon" />

            {isEditingName ? (
              <input
                ref={nameInputRef}
                className="shape-name-input"
                defaultValue={shapeName}
                onBlur={handleNameInputBlur}
                onKeyDown={handleNameInputKeyDown}
                autoFocus
              />
            ) : (
              <span className="shape-name">{shapeName}</span>
            )}

            <button
              className={`shape-action-button ${isHidden ? 'hidden' : ''}`}
              onClick={handleToggleVisibility}
              title={isHidden ? 'Show' : 'Hide'}
            >
              {isHidden ? (
                <EyeCloseIcon className="shape-action-icon" />
              ) : (
                <EyeOpenIcon className="shape-action-icon" />
              )}
            </button>

            <button
              className={`shape-action-button ${isLocked ? 'locked' : ''}`}
              onClick={handleToggleLock}
              title={isLocked ? 'Unlock' : 'Lock'}
            >
              {isLocked ? (
                <LockCloseIcon className="shape-action-icon" />
              ) : (
                <LockOpenIcon className="shape-action-icon" />
              )}
            </button>
          </div>
        </div>
      </TldrawUiDropdownMenuTrigger>

      <TldrawUiDropdownMenuContent
        className="tlui-menu tlui-scrollable layer-panel-context-menu"
        sideOffset={4}
        alignOffset={-4}
        collisionPadding={4}
      >
        <TldrawUiMenuContextProvider type="context-menu" sourceId="layer-panel">
          <TldrawUiDropdownMenuGroup id="layer-panel-actions">
            <TldrawUiMenuActionItem actionId="layer-panel-rename" />
            <TldrawUiMenuActionItem actionId="duplicate" />
          </TldrawUiDropdownMenuGroup>

          <TldrawUiDropdownMenuGroup id="layer-panel-toggle">
            <TldrawUiMenuActionItem actionId="toggle-lock" />
            <TldrawUiMenuActionItem actionId="layer-panel-toggle-visibility" />
          </TldrawUiDropdownMenuGroup>

          <TldrawUiDropdownMenuGroup id="layer-panel-reorder">
            <TldrawUiMenuActionItem actionId="bring-to-front" />
            <TldrawUiMenuActionItem actionId="bring-forward" />
            <TldrawUiMenuActionItem actionId="send-backward" />
            <TldrawUiMenuActionItem actionId="send-to-back" />
          </TldrawUiDropdownMenuGroup>

          <TldrawUiDropdownMenuGroup id="layer-panel-delete">
            <TldrawUiMenuActionItem actionId="layer-panel-delete" />
          </TldrawUiDropdownMenuGroup>
        </TldrawUiMenuContextProvider>
      </TldrawUiDropdownMenuContent>

      {hasChildren && isExpanded && <ShapeList shapeIds={children} depth={depth + 1} />}
    </TldrawUiDropdownMenuRoot>
  )
})

export const ShapeList = track(function ShapeList({
  shapeIds,
  depth,
}: {
  shapeIds: TLShapeId[]
  depth: number
}) {
  if (!shapeIds.length) return null

  return (
    <div className="shape-tree">
      {shapeIds.map((shapeId) => (
        <ShapeItem key={shapeId} shapeId={shapeId} depth={depth} />
      ))}
    </div>
  )
})

function getShapeName(editor: Editor, shapeId: TLShapeId): string {
  const shape = editor.getShape(shapeId)
  if (!shape) return 'Unknown shape'

  if (shape.type === 'frame') {
    const frameShape = shape as TLShape<'frame'>
    return frameShape.props.name || 'Frame'
  }

  return (
    (shape.meta.name as string) ||
    editor.getShapeUtil(shape).getText(shape) ||
    capitalize(shape.type + ' shape')
  )
}
