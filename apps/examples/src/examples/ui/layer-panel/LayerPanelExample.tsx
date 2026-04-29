import {
  Editor,
  TLComponents,
  TLEditorSnapshot,
  TLShape,
  TLShapeId,
  Tldraw,
  TLUiActionItem,
  TLUiOverrides,
  track,
  useEditor,
  useValue,
} from 'tldraw'
import 'tldraw/tldraw.css'
import { useCallback, useMemo, useState } from 'react'
import { ShapeList } from './ShapeList'
import { LayersIcon, ChevronRightIcon } from './icons'
import './layer-panel.css'
import snapshot from './snapshot.json'

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
    (shape.type + ' shape')
  )
}

const layerPanelActions: TLUiOverrides['actions'] = (editor, actions, helpers) => {
  const customActions: Record<string, TLUiActionItem> = {
    'layer-panel-rename': {
      id: 'layer-panel-rename',
      label: 'Rename',
      icon: 'edit',
      onSelect: async (source) => {
        const selectedShapeIds = editor.getSelectedShapeIds()
        if (selectedShapeIds.length !== 1) return

        const shapeId = selectedShapeIds[0]
        const shape = editor.getShape(shapeId)
        if (!shape) return

        const currentName = getShapeName(editor, shapeId)
        const newName = window.prompt('Rename shape:', currentName)

        if (newName !== null && newName !== currentName) {
          editor.markHistoryStoppingPoint('rename shape')

          if (shape.type === 'frame') {
            editor.updateShapes([
              {
                id: shapeId,
                type: 'frame',
                props: { name: newName },
              },
            ])
          } else {
            editor.updateShapes([
              {
                id: shapeId,
                type: shape.type,
                meta: {
                  ...shape.meta,
                  name: newName,
                },
              },
            ])
          }
        }
      },
    },
    'layer-panel-toggle-visibility': {
      id: 'layer-panel-toggle-visibility',
      label: 'Toggle visibility',
      icon: 'eye-open',
      onSelect: async (source) => {
        const selectedShapeIds = editor.getSelectedShapeIds()
        if (selectedShapeIds.length === 0) return

        editor.markHistoryStoppingPoint('toggle visibility')
        const updates = selectedShapeIds
          .map((id) => {
            const shape = editor.getShape(id)
            if (!shape) return null
            return {
              id: shape.id,
              type: shape.type,
              meta: {
                ...shape.meta,
                hidden: !shape.meta.hidden,
              },
            }
          })
          .filter(Boolean) as any[]

        if (updates.length > 0) {
          editor.updateShapes(updates)
        }
      },
    },
    'layer-panel-delete': {
      id: 'layer-panel-delete',
      label: 'Delete',
      icon: 'trash',
      onSelect: async (source) => {
        const selectedShapeIds = editor.getSelectedShapeIds()
        if (selectedShapeIds.length === 0) return

        editor.markHistoryStoppingPoint('delete shape')
        editor.run(
          () => {
            editor.deleteShapes(selectedShapeIds)
          },
          { ignoreShapeLock: true }
        )
      },
    },
  }

  return {
    ...actions,
    ...customActions,
  }
}

const LayerPanel = track(function LayerPanel() {
  const editor = useEditor()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const shapeIds = useValue(
    'shapeIds',
    () => editor.getSortedChildIdsForParent(editor.getCurrentPageId()),
    [editor]
  )

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  return (
    <div className={`layer-panel-container ${isCollapsed ? 'collapsed' : ''}`}>
      <button
        className="layer-panel-toggle"
        onClick={handleToggleCollapse}
        title={isCollapsed ? 'Show layers' : 'Hide layers'}
        style={{ left: isCollapsed ? '4px' : '284px' }}
      >
        <ChevronRightIcon className="layer-panel-toggle-icon" />
      </button>

      <div className="layer-panel">
        <div className="layer-panel-header">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <LayersIcon className="layer-panel-title-icon" />
            <span className="layer-panel-title">Layers</span>
          </div>
        </div>

        <div className="layer-panel-content">
          {shapeIds.length === 0 ? (
            <div className="empty-panel">
              <LayersIcon className="empty-panel-icon" />
              <span className="empty-panel-text">No shapes yet. Draw something to get started.</span>
            </div>
          ) : (
            <ShapeList shapeIds={shapeIds} depth={0} />
          )}
        </div>
      </div>
    </div>
  )
})

const components: TLComponents = {
  InFrontOfTheCanvas: () => {
    return <LayerPanel />
  },
}

export default function LayerPanelExample() {
  const overrides: TLUiOverrides = useMemo(
    () => ({
      actions: layerPanelActions,
    }),
    []
  )

  return (
    <div className="tldraw__editor">
      <Tldraw
        persistenceKey="layer-panel-example"
        components={components}
        overrides={overrides}
        getShapeVisibility={(s) => {
          return s.meta.force_show ? 'visible' : s.meta.hidden ? 'hidden' : 'inherit'
        }}
        snapshot={snapshot as any as TLEditorSnapshot}
      />
    </div>
  )
}
