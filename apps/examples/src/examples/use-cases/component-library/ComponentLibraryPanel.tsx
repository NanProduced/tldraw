import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	TldrawUiButton,
	TldrawUiButtonIcon,
	TldrawUiInput,
	useEditor,
} from 'tldraw'
import {
	ComponentLibraryItem,
	DefaultKpiCardConfig,
	deleteComponent,
	getAllComponents,
	getComponentLibrary,
	getDefaultComponents,
	instantiateComponent,
} from './componentLibraryStore'
import './component-library.css'

const DRAG_DATA_FORMAT = 'application/x-tldraw-component-id'

export function ComponentLibraryPanel() {
	const [searchQuery, setSearchQuery] = useState('')
	const [refreshKey, setRefreshKey] = useState(0)

	const editor = useEditor()

	const allComponents = useMemo(() => {
		return getAllComponents()
	}, [refreshKey])

	const filteredComponents = useMemo(() => {
		if (!searchQuery.trim()) return allComponents
		const query = searchQuery.toLowerCase()
		return allComponents.filter((item) => item.name.toLowerCase().includes(query))
	}, [allComponents, searchQuery])

	const isDefaultComponent = (item: ComponentLibraryItem) => {
		return item.createdAt === 0
	}

	const handleDelete = (e: React.MouseEvent, item: ComponentLibraryItem) => {
		e.stopPropagation()
		if (isDefaultComponent(item)) return

		if (confirm(`Delete component "${item.name}"?`)) {
			deleteComponent(item.id)
			setRefreshKey((k) => k + 1)
		}
	}

	const handleDragStart = useCallback(
		(e: React.DragEvent, item: ComponentLibraryItem) => {
			e.dataTransfer.setData(DRAG_DATA_FORMAT, item.id)
			e.dataTransfer.effectAllowed = 'copy'

			const img = new Image()
			img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
			e.dataTransfer.setDragImage(img, 0, 0)
		},
		[]
	)

	useEffect(() => {
		const container = editor.getContainer()
		if (!container) return

		const handleDragOver = (e: DragEvent) => {
			const hasComponentId = e.dataTransfer?.types.includes(DRAG_DATA_FORMAT)
			if (hasComponentId) {
				e.preventDefault()
				e.dataTransfer!.dropEffect = 'copy'
			}
		}

		const handleDrop = (e: DragEvent) => {
			const componentId = e.dataTransfer?.getData(DRAG_DATA_FORMAT)
			if (!componentId) return

			e.preventDefault()
			e.stopPropagation()

			const component = [...getDefaultComponents(), ...getComponentLibrary()].find((c) => c.id === componentId)
			if (!component) return

			const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY })
			instantiateComponent(editor, component, pagePoint)
		}

		container.addEventListener('dragover', handleDragOver, true)
		container.addEventListener('drop', handleDrop, true)

		return () => {
			container.removeEventListener('dragover', handleDragOver, true)
			container.removeEventListener('drop', handleDrop, true)
		}
	}, [editor])

	return (
		<div className="component-library-panel">
			<div className="component-library-header">
				<h3>Component Library</h3>
			</div>

			<div className="component-library-search">
				<TldrawUiInput
					placeholder="Search components..."
					value={searchQuery}
					onChange={(value) => setSearchQuery(value)}
					icon="search"
				/>
			</div>

			<div className="component-library-grid">
				{filteredComponents.map((item) => (
					<div
						key={item.id}
						className="component-card"
						draggable
						onDragStart={(e) => handleDragStart(e, item)}
						title={`Drag "${item.name}" to canvas`}
					>
						<div className="component-card-preview">
							<div className="component-card-preview-content">
								{item.isDefault && item.defaultConfig ? (
									<KpiCardPreview config={item.defaultConfig} />
								) : (
									<GenericPreview item={item} />
								)}
							</div>
						</div>
						<div className="component-card-footer">
							<span className="component-card-name">{item.name}</span>
							{!isDefaultComponent(item) && (
								<TldrawUiButton
									type="icon"
									className="component-card-delete"
									title="Delete component"
									onClick={(e) => handleDelete(e, item)}
								>
									<TldrawUiButtonIcon icon="trash" />
								</TldrawUiButton>
							)}
						</div>
					</div>
				))}
			</div>

			{filteredComponents.length === 0 && (
				<div className="component-library-empty">
					<p>{searchQuery ? 'No matching components' : 'No saved components'}</p>
					<p className="component-library-hint">
						Select shapes and use "Save as Component" in the context menu
					</p>
				</div>
			)}
		</div>
	)
}

function KpiCardPreview({ config }: { config: DefaultKpiCardConfig }) {
	const { title, value, trend, trendValue, color } = config

	let trendColor = '#6b7280'
	let trendIcon = '—'

	if (trend === 'up') {
		trendColor = '#10b981'
		trendIcon = '↑'
	} else if (trend === 'down') {
		trendColor = '#ef4444'
		trendIcon = '↓'
	}

	const colorMap: Record<string, string> = {
		blue: '#3b82f6',
		red: '#ef4444',
		orange: '#f97316',
		yellow: '#eab308',
		green: '#22c55e',
		lightBlue: '#0ea5e9',
		purple: '#a855f7',
		black: '#1f2937',
		grey: '#6b7280',
	}

	const bgColor = colorMap[color] || colorMap.blue
	const opacity = 0.2

	return (
		<div
			className="kpi-card-preview"
			style={{
				background: `rgba(${hexToRgb(bgColor)}, ${opacity})`,
				border: `2px solid ${bgColor}`,
			}}
		>
			<div className="kpi-card-preview-title">{title}</div>
			<div className="kpi-card-preview-row">
				<span className="kpi-card-preview-value">{value}</span>
				<span className="kpi-card-preview-trend" style={{ color: trendColor }}>
					{trendIcon} {trendValue}
				</span>
			</div>
		</div>
	)
}

function GenericPreview({ item }: { item: ComponentLibraryItem }) {
	const shapeCount = item.content?.shapes.length || 0
	return (
		<div className="generic-preview">
			<div className="generic-preview-icon">📦</div>
			<div className="generic-preview-count">{shapeCount} shape{shapeCount !== 1 ? 's' : ''}</div>
		</div>
	)
}

function hexToRgb(hex: string): string {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
	if (result) {
		return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
	}
	return '59, 130, 246'
}
