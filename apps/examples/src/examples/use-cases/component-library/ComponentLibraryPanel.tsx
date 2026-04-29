import { useMemo, useRef, useState } from 'react'
import {
	Box,
	TldrawUiButton,
	TldrawUiButtonIcon,
	TldrawUiInput,
	Vec,
	useAtom,
	useEditor,
	useQuickReactor,
	useValue,
} from 'tldraw'
import { ComponentLibraryItem, deleteComponent, getAllComponents, instantiateComponent } from './componentLibraryStore'
import './component-library.css'

type DragState =
	| {
			name: 'idle'
	  }
	| {
			name: 'pointing_item'
			item: ComponentLibraryItem
			startPosition: Vec
	  }
	| {
			name: 'dragging'
			item: ComponentLibraryItem
			currentPosition: Vec
	  }

export function ComponentLibraryPanel() {
	const rPanelContainer = useRef<HTMLDivElement>(null)
	const rDraggingImage = useRef<HTMLDivElement>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [refreshKey, setRefreshKey] = useState(0)

	const editor = useEditor()

	const dragState = useAtom<DragState>('dragState', () => ({
		name: 'idle',
	}))

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

	const { handlePointerUp, handlePointerDown } = useMemo(() => {
		let target: HTMLDivElement | null = null

		function handlePointerMove(e: PointerEvent) {
			const current = dragState.get()
			const screenPoint = new Vec(e.clientX, e.clientY)

			switch (current.name) {
				case 'idle': {
					break
				}
				case 'pointing_item': {
					const dist = Vec.Dist(screenPoint, current.startPosition)
					if (dist > 10) {
						dragState.set({
							name: 'dragging',
							item: current.item,
							currentPosition: screenPoint,
						})
					}
					break
				}
				case 'dragging': {
					dragState.set({
						...current,
						currentPosition: screenPoint,
					})
					break
				}
			}
		}

		function handlePointerUp(e: React.PointerEvent) {
			const current = dragState.get()

			target = e.currentTarget as HTMLDivElement
			target.releasePointerCapture(e.pointerId)

			switch (current.name) {
				case 'idle': {
					break
				}
				case 'pointing_item': {
					dragState.set({ name: 'idle' })
					break
				}
				case 'dragging': {
					const screenPoint = new Vec(e.clientX, e.clientY)
					const pagePoint = editor.screenToPage(screenPoint)

					const panelContainer = rPanelContainer.current
					if (panelContainer) {
						const panelRect = panelContainer.getBoundingClientRect()
						const box = new Box(panelRect.x, panelRect.y, panelRect.width, panelRect.height)
						const isInsidePanel = Box.ContainsPoint(box, screenPoint)

						if (!isInsidePanel) {
							instantiateComponent(editor, current.item, pagePoint.x, pagePoint.y)
						}
					}

					dragState.set({ name: 'idle' })
					break
				}
			}

			removeEventListeners()
		}

		function handlePointerDown(e: React.PointerEvent) {
			e.preventDefault()
			target = e.currentTarget as HTMLDivElement
			target.setPointerCapture(e.pointerId)

			const itemIndex = target.dataset.component_index
			if (!itemIndex) return

			const item = filteredComponents[+itemIndex]
			if (!item) return

			const startPosition = new Vec(e.clientX, e.clientY)

			dragState.set({
				name: 'pointing_item',
				item,
				startPosition,
			})

			target.addEventListener('pointermove', handlePointerMove)
			document.addEventListener('keydown', handleKeyDown)
		}

		function handleKeyDown(e: KeyboardEvent) {
			const current = dragState.get()
			if (e.key === 'Escape' && current.name === 'dragging') {
				removeEventListeners()
			}
		}

		function removeEventListeners() {
			if (target) {
				target.removeEventListener('pointermove', handlePointerMove)
				document.removeEventListener('keydown', handleKeyDown)
			}
			dragState.set({ name: 'idle' })
		}

		return {
			handlePointerDown,
			handlePointerUp,
		}
	}, [dragState, editor, filteredComponents])

	const state = useValue('dragState', () => dragState.get(), [dragState])

	useQuickReactor(
		'drag-image-style',
		() => {
			const current = dragState.get()
			const imageRef = rDraggingImage.current
			const panelContainerRef = rPanelContainer.current
			if (!imageRef || !panelContainerRef) return

			switch (current.name) {
				case 'idle':
				case 'pointing_item': {
					imageRef.style.display = 'none'
					break
				}
				case 'dragging': {
					const panelContainerRect = panelContainerRef.getBoundingClientRect()
					const box = new Box(
						panelContainerRect.x,
						panelContainerRect.y,
						panelContainerRect.width,
						panelContainerRect.height
					)
					const viewportScreenBounds = editor.getViewportScreenBounds()
					const isInside = Box.ContainsPoint(box, current.currentPosition)

					if (isInside) {
						imageRef.style.display = 'none'
					} else {
						imageRef.style.display = 'block'
						imageRef.style.position = 'absolute'
						imageRef.style.pointerEvents = 'none'
						imageRef.style.left = '0px'
						imageRef.style.top = '0px'
						imageRef.style.transform = `translate(${current.currentPosition.x - viewportScreenBounds.x - 50}px, ${current.currentPosition.y - viewportScreenBounds.y - 40}px)`
						imageRef.style.width = '100px'
						imageRef.style.height = '80px'
					}
				}
			}
		},
		[dragState]
	)

	return (
		<>
			<div ref={rPanelContainer} className="component-library-panel">
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
					{filteredComponents.map((item, index) => (
						<div
							key={item.id}
							className="component-card"
							data-component_index={index}
							onPointerDown={handlePointerDown}
							onPointerUp={handlePointerUp}
							title={`Drag "${item.name}" to canvas`}
						>
							<div className="component-card-preview">
								<div className="component-card-preview-content">
									{item.shapes[0]?.type === 'kpi-card' ? (
										<KpiCardPreview shape={item.shapes[0] as any} />
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

			<div ref={rDraggingImage} className="component-drag-preview">
				{state.name === 'dragging' && (
					<div className="component-drag-preview-content">
						{state.item.shapes[0]?.type === 'kpi-card' ? (
							<KpiCardPreview shape={state.item.shapes[0] as any} />
						) : (
							<GenericPreview item={state.item} />
						)}
					</div>
				)}
			</div>
		</>
	)
}

function KpiCardPreview({ shape }: { shape: { props: any } }) {
	const { title, value, trend, trendValue, color } = shape.props

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
	const shapeCount = item.shapes.length
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
