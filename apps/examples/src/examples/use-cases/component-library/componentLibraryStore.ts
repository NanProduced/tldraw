import { Editor, TLShape, createShapeId } from 'tldraw'
import { IKpiCardShape } from './KpiCardShapeUtil'

const STORAGE_KEY = 'tldraw-component-library'

export interface ComponentLibraryItem {
	id: string
	name: string
	createdAt: number
	shapes: TLShape[]
	bounds: {
		minX: number
		minY: number
		maxX: number
		maxY: number
	}
}

export function getComponentLibrary(): ComponentLibraryItem[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (!stored) return []
		const items = JSON.parse(stored) as ComponentLibraryItem[]
		return items.sort((a, b) => b.createdAt - a.createdAt)
	} catch {
		return []
	}
}

export function saveComponentLibrary(items: ComponentLibraryItem[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
	} catch (e) {
		console.error('Failed to save component library:', e)
	}
}

export function addComponent(name: string, shapes: TLShape[]): ComponentLibraryItem | null {
	if (shapes.length === 0) return null

	let minX = Infinity, minY = Infinity
	let maxX = -Infinity, maxY = -Infinity

	shapes.forEach((shape) => {
		const x = shape.x
		const y = shape.y
		minX = Math.min(minX, x)
		minY = Math.min(minY, y)
		maxX = Math.max(maxX, x + (shape.props as { w?: number }).w || x + 100)
		maxY = Math.max(maxY, y + (shape.props as { h?: number }).h || y + 100)
	})

	const item: ComponentLibraryItem = {
		id: createShapeId().toString(),
		name: name.trim() || `Component ${Date.now()}`,
		createdAt: Date.now(),
		shapes: JSON.parse(JSON.stringify(shapes)),
		bounds: { minX, minY, maxX, maxY },
	}

	const items = getComponentLibrary()
	items.unshift(item)
	saveComponentLibrary(items)

	return item
}

export function updateComponent(id: string, name: string): boolean {
	const items = getComponentLibrary()
	const index = items.findIndex((item) => item.id === id)
	if (index === -1) return false

	items[index] = { ...items[index], name: name.trim() }
	saveComponentLibrary(items)
	return true
}

export function deleteComponent(id: string): boolean {
	const items = getComponentLibrary()
	const filtered = items.filter((item) => item.id !== id)
	if (filtered.length === items.length) return false

	saveComponentLibrary(filtered)
	return true
}

export function getDefaultComponents(): ComponentLibraryItem[] {
	const defaultKpiCardShapes: IKpiCardShape[] = [
		{
			id: createShapeId(),
			typeName: 'shape',
			type: 'kpi-card',
			x: 0,
			y: 0,
			rotation: 0,
			index: 'a1',
			parentId: 'page:page' as any,
			isLocked: false,
			props: {
				w: 240,
				h: 120,
				color: 'blue',
				title: 'Monthly Revenue',
				value: '$45,231',
				trend: 'up',
				trendValue: '+12.5%',
			},
		},
	]

	return [
		{
			id: 'default-kpi-card-1',
			name: 'KPI Card - Revenue Up',
			createdAt: 0,
			shapes: defaultKpiCardShapes,
			bounds: {
				minX: 0,
				minY: 0,
				maxX: 240,
				maxY: 120,
			},
		},
		{
			id: 'default-kpi-card-2',
			name: 'KPI Card - Users Down',
			createdAt: 0,
			shapes: [
				{
					...defaultKpiCardShapes[0],
					id: createShapeId(),
					props: {
						...defaultKpiCardShapes[0].props,
						title: 'Active Users',
						value: '8,542',
						trend: 'down' as const,
						trendValue: '-3.2%',
						color: 'red',
					},
				},
			],
			bounds: {
				minX: 0,
				minY: 0,
				maxX: 240,
				maxY: 120,
			},
		},
		{
			id: 'default-kpi-card-3',
			name: 'KPI Card - Conversion Neutral',
			createdAt: 0,
			shapes: [
				{
					...defaultKpiCardShapes[0],
					id: createShapeId(),
					props: {
						...defaultKpiCardShapes[0].props,
						title: 'Conversion Rate',
						value: '4.8%',
						trend: 'neutral' as const,
						trendValue: '0.1%',
						color: 'orange',
					},
				},
			],
			bounds: {
				minX: 0,
				minY: 0,
				maxX: 240,
				maxY: 120,
			},
		},
	]
}

export function getAllComponents(): ComponentLibraryItem[] {
	const defaultComponents = getDefaultComponents()
	const userComponents = getComponentLibrary()
	return [...defaultComponents, ...userComponents]
}

export function instantiateComponent(
	editor: Editor,
	component: ComponentLibraryItem,
	targetX: number,
	targetY: number
): void {
	const { shapes, bounds } = component
	const centerX = (bounds.minX + bounds.maxX) / 2
	const centerY = (bounds.minY + bounds.maxY) / 2

	const offsetX = targetX - centerX
	const offsetY = targetY - centerY

	const oldToNewIdMap = new Map<string, string>()

	shapes.forEach((shape) => {
		const newId = createShapeId()
		oldToNewIdMap.set(shape.id, newId)
	})

	editor.run(() => {
		const newShapes = shapes.map((shape) => {
			const newId = oldToNewIdMap.get(shape.id)!

			let newParentId = shape.parentId
			if (oldToNewIdMap.has(shape.parentId)) {
				newParentId = oldToNewIdMap.get(shape.parentId)!
			}

			return {
				...shape,
				id: newId,
				x: shape.x + offsetX,
				y: shape.y + offsetY,
				parentId: newParentId,
			}
		})

		editor.markHistoryStoppingPoint('create component shapes')
		editor.createShapes(newShapes)
	})
}

export function serializeSelectedShapes(editor: Editor): TLShape[] {
	const selectedShapeIds = editor.getSelectedShapeIds()
	if (selectedShapeIds.length === 0) return []

	const shapes: TLShape[] = []
	const shapeIdSet = new Set(selectedShapeIds)

	selectedShapeIds.forEach((id) => {
		const shape = editor.getShape(id)
		if (shape) {
			shapes.push(shape)

			const childIds = editor.getSortedChildIdsForParent(shape.id)
			childIds.forEach((childId) => {
				if (!shapeIdSet.has(childId)) {
					const childShape = editor.getShape(childId)
					if (childShape) {
						shapes.push(childShape)
					}
				}
			})
		}
	})

	return shapes
}
