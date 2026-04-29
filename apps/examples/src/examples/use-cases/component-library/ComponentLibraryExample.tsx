import { Tldraw, TLEditorComponents } from 'tldraw'
import 'tldraw/tldraw.css'
import { ComponentLibraryPanel } from './ComponentLibraryPanel'
import { KpiCardShapeUtil } from './KpiCardShapeUtil'
import { components as menuComponents, uiOverrides } from './ui-overrides'
import './component-library.css'

const customShapeUtils = [KpiCardShapeUtil]

const components: TLEditorComponents = {
	...menuComponents,
	InFrontOfTheCanvas: ComponentLibraryPanel,
}

export default function ComponentLibraryExample() {
	return (
		<div className="tldraw__editor" style={{ position: 'fixed', inset: 0 }}>
			<Tldraw
				persistenceKey="component-library-example"
				shapeUtils={customShapeUtils}
				overrides={uiOverrides}
				components={components}
			/>
		</div>
	)
}

/*
Introduction:

This example implements a custom component library for tldraw with the following features:

1. Custom KPI Card Shape (KpiCardShapeUtil)
   - A card shape that displays a title, large numeric value, and a trend indicator
   - Supports three trend types: up (green ↑), down (red ↓), and neutral (gray —)
   - Customizable color and dimensions

2. Component Library Panel (ComponentLibraryPanel)
   - A left sidebar panel that shows all saved components
   - Grid layout with card previews
   - Search box to filter components by name
   - Default KPI cards are provided as built-in components

3. Drag and Drop from Panel to Canvas
   - Components can be dragged from the panel and dropped onto the canvas
   - Uses tldraw's native coordinate conversion (screenToPage)
   - Creates new shape instances at the drop position
   - Handles shape ID remapping and offset calculations

4. Save as Component (Context Menu)
   - Right-click on selected shapes to save them as a component
   - Opens a dialog to enter the component name
   - Serializes selected shapes (including children) to localStorage
   - Uses tldraw's standard actions registration mechanism

Usage:
- Drag default KPI cards from the left panel onto the canvas
- Select any shapes on the canvas, right-click, and choose "Save as Component"
- Enter a name for your component and save it
- The saved component will appear in the library panel
- Drag saved components from the panel to create new instances

Technical Details:
- Components are stored in localStorage with key 'tldraw-component-library'
- Each component stores: name, creation timestamp, shape data, and bounds
- Default components have createdAt: 0 and cannot be deleted
- User-created components can be deleted via the trash icon

Note: This implementation follows tldraw's official development patterns:
- Uses ShapeUtil for custom shapes
- Uses TLUiActionItem for menu actions
- Uses Editor.screenToPage() for coordinate conversion
- Uses editor.createShapes() for shape creation
- Uses the components prop for UI customization
*/
