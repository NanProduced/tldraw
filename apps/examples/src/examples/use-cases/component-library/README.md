---
title: Component library
component: ./ComponentLibraryExample.tsx
keywords:
  [
    component,
    library,
    reuse,
    drag and drop,
    save as component,
    custom shape,
    kpi card,
    context menu,
  ]
priority: 0
---

A reusable component library for saving and reusing shapes.

---

This example implements a custom component library for tldraw that allows you to:

1. **Save shapes as reusable components
2. **Drag and drop components from the library panel** to the canvas
3. **Search components by name**
4. **Use pre-built KPI card shapes** with trend indicators

## Features

### Custom KPI Card Shape

A custom shape type for displaying key performance indicators with:
- Title
- Large numeric value
- Trend indicator (up/down/neutral) with color coding
- Customizable colors

### Component Library Panel

A left sidebar panel that:
- Displays all saved components in a grid layout
- Includes a search box to filter components by name
- Shows pre-built KPI cards as default components
- Allows deleting user-created components

### Drag and Drop

- Drag components from the library panel onto the canvas
- Components are placed at the mouse drop position
- Shape IDs are regenerated to create fresh copies
- Parent-child relationships are preserved

### Save as Component

- Select any shapes on the canvas
- Right-click and choose "Save as Component"
- Enter a name for your component
- The component is saved to localStorage

## Technical Details

- Uses `ShapeUtil` for custom shape definitions
- Uses `TLUiActionItem` for menu actions
- Uses `editor.screenToPage()` for coordinate conversion
- Uses `editor.createShapes()` for bulk shape creation
- Components are stored in localStorage with key `tldraw-component-library`
