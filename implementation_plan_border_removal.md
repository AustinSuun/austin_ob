# Implementation Plan - Minimal UI Border Removal

The goal is to remove unnecessary borders and lines across the entire Obsidian interface to achieve a cleaner, "Blue Topaz" inspired look.

## Proposed Changes

### 1. Main Workspace
- Remove width/color from `.workspace-split` separators (resizing handles).
- Remove borders from `.workspace-leaf`.
- Ensure the background colors of adjacent panels blend seamlessly.

### 2. Main Tab Headers
- Remove the background and borders from the main tab header container.
- Style active tabs to have no top/side borders, using only color or weight to indicate activity.
- Remove the line below the tab headers (`.workspace-tab-header-container`).

### 3. Status Bar
- Remove the top border from the status bar.
- Blend the status bar background with the sidebar or main window background.

### 4. View Header (Breadcrumbs/Title Area)
- Remove the bottom border from `.view-header`.
- Remove separators between breadcrumbs if they are too heavy.

### 5. Popovers & Modals
- Remove or soften borders on hover previews and command palette.

## Technical Details (CSS Targets)

```css
/* Workspace Splitters */
.workspace-split.mod-vertical > .workspace-leaf-resize-handle,
.workspace-split.mod-horizontal > .workspace-leaf-resize-handle {
    background-color: transparent !important;
    width: 0px !important; /* Visual width */
}

/* Tab Headers */
.workspace-tab-header-container {
    border: none !important;
    box-shadow: none !important;
}
.workspace-tab-header {
    border: none !important;
}

/* Status Bar */
.status-bar {
    border-top: none !important;
}

/* View Header */
.view-header {
    border-bottom: none !important;
    box-shadow: none !important;
}

/* Active Leaf Border removal */
.workspace-leaf.mod-active {
    border: none !important;
}
```

## Verification
- User should see a "flat" interface where panels are defined by whitespace or subtle background differences rather than lines.
