import {
	DefaultContextMenu,
	DefaultContextMenuContent,
	TLComponents,
	TLUiActionItem,
	TLUiActionsContextType,
	TLUiOverrideHelpers,
	TldrawUiMenuActionItem,
	TldrawUiMenuGroup,
	useEditor,
	useValue,
} from 'tldraw'
import { SaveComponentDialog } from './SaveComponentDialog'

export function CustomContextMenu(props: any) {
	const editor = useEditor()

	const hasSelectedShapes = useValue(
		'hasSelectedShapes',
		() => editor.getSelectedShapeIds().length > 0,
		[editor]
	)

	return (
		<DefaultContextMenu {...props}>
			{hasSelectedShapes && (
				<TldrawUiMenuGroup id="component-library">
					<TldrawUiMenuActionItem actionId="save-as-component" />
				</TldrawUiMenuGroup>
			)}
			<DefaultContextMenuContent />
		</DefaultContextMenu>
	)
}

export const uiOverrides = {
	actions: (_editor: any, actions: TLUiActionsContextType, helpers: TLUiOverrideHelpers) => {
		const saveAsComponentAction: TLUiActionItem = {
			id: 'save-as-component',
			label: 'Save as Component',
			icon: 'duplicate',
			onSelect(source: any) {
				helpers.addDialog({ component: SaveComponentDialog })
			},
		}

		return {
			...actions,
			'save-as-component': saveAsComponentAction,
		}
	},
}

export const components: TLComponents = {
	ContextMenu: CustomContextMenu,
}
