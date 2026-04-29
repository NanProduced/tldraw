import { Editor, TLContent, createShapeId } from 'tldraw'

const STORAGE_KEY = 'tldraw-component-library'

export interface DefaultKpiCardConfig {
	title: string
	value: string
	trend: 'up' | 'down' | 'neutral'
	trendValue: string
	color: string
}

export interface ComponentLibraryItem {
	id: string
	name: string
	createdAt: number
	isDefault?: boolean
	defaultConfig?: DefaultKpiCardConfig
	content?: TLContent
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

export function addComponent(name: string, content: TLContent): ComponentLibraryItem | null {
	if (!content || !content.shapes || content.shapes.length === 0) return null

	const item: ComponentLibraryItem = {
		id: createShapeId().toString(),
		name: name.trim() || `Component ${Date.now()}`,
		createdAt: Date.now(),
		content: JSON.parse(JSON.stringify(content)),
	}

	const items = getComponentLibrary()
	items.unshift(item)
	saveComponentLibrary(items)

	return item
}

export function deleteComponent(id: string): boolean {
	const items = getComponentLibrary()
	const filtered = items.filter((item) => item.id !== id)
	if (filtered.length === items.length) return false

	saveComponentLibrary(filtered)
	return true
}

const DEFAULT_KPI_CARDS: ComponentLibraryItem[] = [
	{
		id: 'default-kpi-card-1',
		name: 'KPI Card - Revenue Up',
		createdAt: 0,
		isDefault: true,
		defaultConfig: {
			title: 'Monthly Revenue',
			value: '$45,231',
			trend: 'up',
			trendValue: '+12.5%',
			color: 'blue',
		},
	},
	{
		id: 'default-kpi-card-2',
		name: 'KPI Card - Users Down',
		createdAt: 0,
		isDefault: true,
		defaultConfig: {
			title: 'Active Users',
			value: '8,542',
			trend: 'down',
			trendValue: '-3.2%',
			color: 'red',
		},
	},
	{
		id: 'default-kpi-card-3',
		name: 'KPI Card - Conversion Neutral',
		createdAt: 0,
		isDefault: true,
		defaultConfig: {
			title: 'Conversion Rate',
			value: '4.8%',
			trend: 'neutral',
			trendValue: '0.1%',
			color: 'orange',
		},
	},
]

export function getDefaultComponents(): ComponentLibraryItem[] {
	return DEFAULT_KPI_CARDS
}

export function getAllComponents(): ComponentLibraryItem[] {
	const defaultComponents = getDefaultComponents()
	const userComponents = getComponentLibrary()
	return [...defaultComponents, ...userComponents]
}

export function instantiateComponent(
	editor: Editor,
	component: ComponentLibraryItem,
	point: { x: number; y: number }
): void {
	if (component.isDefault && component.defaultConfig) {
		const config = component.defaultConfig
		const shapeId = createShapeId()

		editor.run(() => {
			editor.markHistoryStoppingPoint('create default kpi card')
			editor.createShapes([
				{
					id: shapeId,
					type: 'kpi-card',
					x: point.x - 120,
					y: point.y - 60,
					props: {
						w: 240,
						h: 120,
						color: config.color,
						title: config.title,
						value: config.value,
						trend: config.trend,
						trendValue: config.trendValue,
					},
				},
			])
			editor.select(shapeId)
		})
	} else if (component.content) {
		editor.putContentOntoCurrentPage(component.content, {
			point,
			select: true,
		})
	}
}
