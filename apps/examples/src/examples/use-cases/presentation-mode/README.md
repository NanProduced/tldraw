---
title: Presentation mode
component: ./PresentationModeExample.tsx
priority: 0
keywords:
  [
    presentation,
    slideshow,
    frame,
    zoomToBounds,
    camera,
    animation,
    shortcuts,
    speaker notes,
    branch navigation,
    drag and drop,
  ]
---

Immersive frame presentation mode with smooth transitions, speaker notes, branch navigation, and frame reordering.

---

This example implements a full-featured presentation mode for tldraw:

- **Play button** in the top panel to enter presentation mode
- **Smooth camera transitions** using `editor.zoomToBounds` with animation
- **Keyboard shortcuts**:
  - `Space` or `Right Arrow` - Next frame
  - `Left Arrow` - Previous frame
  - `B` - Toggle black screen
  - `W` - Toggle white screen
  - `N` - Toggle speaker notes
  - `L` - Toggle frame list
  - `Esc` - Exit presentation mode
  - `F5` - Toggle presentation mode
- **Speaker notes**: Based on `frame.meta.note`, displayed in a floating panel
- **Frame list drawer**: Bottom-right panel with drag-and-drop reordering
- **Branch navigation**: If current frame has multiple outgoing arrows, a selector appears to choose which branch to follow
- **Order sync**: Frame order changes are saved to `frame.meta.presentationOrder`
