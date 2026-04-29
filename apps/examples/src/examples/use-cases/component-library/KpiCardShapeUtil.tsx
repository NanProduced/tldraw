import {
	BaseBoxShapeUtil,
	DefaultColorStyle,
	HTMLContainer,
	RecordProps,
	T,
	TLShape,
	TLDefaultColorStyle,
	getColorValue,
	useValue,
} from 'tldraw'
import { kpiCardShapeMigrations } from './kpi-card-shape-migrations'

const KPI_CARD_TYPE = 'kpi-card'

declare module 'tldraw' {
	export interface TLGlobalShapePropsMap {
		[KPI_CARD_TYPE]: {
			w: number
			h: number
			color: TLDefaultColorStyle
			title: string
			value: string
			trend: 'up' | 'down' | 'neutral'
			trendValue: string
		}
	}
}

export type IKpiCardShape = TLShape<typeof KPI_CARD_TYPE>

const kpiCardProps: RecordProps<IKpiCardShape> = {
	w: T.number,
	h: T.number,
	color: DefaultColorStyle,
	title: T.string,
	value: T.string,
	trend: T.literalEnum('up', 'down', 'neutral'),
	trendValue: T.string,
}

export class KpiCardShapeUtil extends BaseBoxShapeUtil<IKpiCardShape> {
	static override type = KPI_CARD_TYPE
	static override props = kpiCardProps
	static override migrations = kpiCardShapeMigrations

	override isAspectRatioLocked(shape: IKpiCardShape) {
		return false
	}

	override canResize(shape: IKpiCardShape) {
		return true
	}

	getDefaultProps(): IKpiCardShape['props'] {
		return {
			w: 240,
			h: 120,
			color: 'blue',
			title: 'Monthly Revenue',
			value: '$45,231',
			trend: 'up',
			trendValue: '+12.5%',
		}
	}

	component(shape: IKpiCardShape) {
		const { editor } = this
		const theme = useValue('theme', () => editor.getCurrentTheme(), [editor])
		const colors = theme.colors[editor.getColorMode()]
		const { color, title, value, trend, trendValue } = shape.props

		const bgColor = getColorValue(colors, color, 'semi')
		const borderColor = getColorValue(colors, color, 'semi')
		const textColor = getColorValue(colors, 'black', 'solid')
		const mutedColor = getColorValue(colors, 'black', 'muted')

		let trendColor = mutedColor
		let trendIcon = '—'

		if (trend === 'up') {
			trendColor = '#10b981'
			trendIcon = '↑'
		} else if (trend === 'down') {
			trendColor = '#ef4444'
			trendIcon = '↓'
		}

		return (
			<HTMLContainer
				id={shape.id}
				style={{
					width: shape.props.w,
					height: shape.props.h,
					background: bgColor,
					borderRadius: 12,
					border: `2px solid ${borderColor}`,
					padding: 16,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'space-between',
					boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
					pointerEvents: 'all',
				}}
			>
				<div style={{ fontSize: 12, color: mutedColor, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
					{title}
				</div>
				<div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
					<span style={{ fontSize: 28, fontWeight: 700, color: textColor, lineHeight: 1 }}>
						{value}
					</span>
					<span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, color: trendColor }}>
						<span style={{ fontSize: 16 }}>{trendIcon}</span>
						{trendValue}
					</span>
				</div>
			</HTMLContainer>
		)
	}

	getIndicatorPath(shape: IKpiCardShape) {
		const path = new Path2D()
		path.roundRect(0, 0, shape.props.w, shape.props.h, 12)
		return path
	}
}

export function createKpiCardShapePartial(
	title: string,
	value: string,
	trend: 'up' | 'down' | 'neutral',
	trendValue: string,
	color: TLDefaultColorStyle = 'blue'
): Partial<IKpiCardShape> {
	return {
		type: KPI_CARD_TYPE,
		props: {
			w: 240,
			h: 120,
			color,
			title,
			value,
			trend,
			trendValue,
		},
	}
}
