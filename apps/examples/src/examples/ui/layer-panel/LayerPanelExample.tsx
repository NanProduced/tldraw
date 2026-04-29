import { TLComponents, TLEditorSnapshot, Tldraw, track, useEditor, useValue } from 'tldraw'
import 'tldraw/tldraw.css'
import { useCallback, useState } from 'react'
import { ShapeList, ContextMenu, ContextMenuState } from './ShapeList'
import { LayersIcon, ChevronRightIcon } from './icons'
import './layer-panel.css'
import snapshot from './snapshot.json'

const LayerPanel = track(function LayerPanel() {
	const editor = useEditor()
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

	const shapeIds = useValue(
		'shapeIds',
		() => editor.getSortedChildIdsForParent(editor.getCurrentPageId()),
		[editor]
	)

	const handleContextMenu = useCallback((e: React.MouseEvent, shapeId: string) => {
		setContextMenu({
			x: e.clientX,
			y: e.clientY,
			shapeId: shapeId as any,
		})
	}, [])

	const handleCloseContextMenu = useCallback(() => {
		setContextMenu(null)
	}, [])

	const handlePanelClick = useCallback(() => {
		setContextMenu(null)
	}, [])

	const handleToggleCollapse = useCallback(() => {
		setIsCollapsed((prev) => !prev)
	}, [])

	return (
		<>
			<div
				className={`layer-panel-container ${isCollapsed ? 'collapsed' : ''}`}
				onClick={handlePanelClick}
			>
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
							<ShapeList
								shapeIds={shapeIds}
								depth={0}
								onContextMenu={handleContextMenu}
							/>
						)}
					</div>
				</div>
			</div>

			<ContextMenu state={contextMenu} onClose={handleCloseContextMenu} />
		</>
	)
})

const components: TLComponents = {
	InFrontOfTheCanvas: () => {
		return <LayerPanel />
	},
}

export default function LayerPanelExample() {
	return (
		<div className="tldraw__editor">
			<Tldraw
				persistenceKey="layer-panel-example"
				components={components}
				getShapeVisibility={(s) => {
					return s.meta.force_show ? 'visible' : s.meta.hidden ? 'hidden' : 'inherit'
				}}
				snapshot={snapshot as any as TLEditorSnapshot}
			/>
		</div>
	)
}
