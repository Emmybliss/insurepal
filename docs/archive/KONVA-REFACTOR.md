# Konva.js Designer Refactoring

## Overview

The Document Designer has been fully refactored to use **Konva.js** (`react-konva`) for rendering all canvas elements. This provides a robust, performant, and feature-rich visual designer for creating document templates (certificates, invoices, debit notes, credit notes, and receipts).

## Architecture

### Component Structure

```
DocumentTemplates/Designer.tsx (Main Page)
├── DesignerToolbar.tsx (Top toolbar with actions)
├── ElementsLibrary.tsx (Left sidebar - Konva element library)
├── KonvaDesigner.tsx (Center canvas - Konva Stage & Layer)
└── PropertyPanel.tsx (Right sidebar - Element properties)
```

### State Management

- **Zustand Store** (`useDesignerStore.ts`): Centralized state for all designer data
  - `elements`: Array of all canvas elements
  - `selectedIds`: Currently selected element IDs
  - `canvas`: Canvas configuration (width, height, background, scale)
  - `history`: Undo/redo stack (max 50 steps)
  - Actions for CRUD operations, alignment, distribution, etc.

## Konva Implementation

### KonvaDesigner Component

**File**: `resources/js/Components/Designer/KonvaDesigner.tsx`

#### Key Features:

1. **Pure Konva Rendering**
   - All elements are Konva shapes (`Text`, `Rect`, `Circle`, `Ellipse`, `Star`, `RegularPolygon`, `Line`)
   - NO HTML divs or absolute positioning
   - Everything rendered inside `<Stage>` and `<Layer>`

2. **Transformer Support**
   - Multi-element selection with Shift/Ctrl/Cmd
   - Resize handles on all 8 anchor points
   - Rotation handles
   - Maintains aspect ratio constraints
   - Minimum size validation (5px)

3. **Drag & Drop**
   - Smooth dragging with `draggable` prop
   - Snap to grid support (configurable)
   - Updates store on `dragEnd`

4. **Grid System**
   - Optional grid overlay (toggle with 'G' key)
   - Configurable grid size (default: 20px)
   - Snap to grid during drag/resize

5. **Element Rendering**
   ```typescript
   switch (element.type) {
     case 'text': return <Text {...props} />
     case 'rect': return <Rect {...props} />
     case 'circle': return <Circle {...props} />
     case 'ellipse': return <Ellipse {...props} />
     case 'star': return <Star {...props} />
     case 'triangle': return <RegularPolygon sides={3} {...props} />
     case 'line': return <Line {...props} />
     case 'image': return <Rect {...props} /> // Placeholder
   }
   ```

### Element Types

All element types inherit from `BaseElement`:

```typescript
interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  rotation?: number;
  draggable?: boolean;
  locked?: boolean;
  visible?: boolean;
  opacity?: number;
  name?: string;
}
```

#### Supported Elements:

1. **Text** - Editable text with font styling
2. **Rectangle** - Rounded corners, fill & stroke
3. **Circle** - Configurable radius
4. **Ellipse** - Independent X/Y radii
5. **Star** - Customizable points and inner/outer radius
6. **Triangle** - Implemented as `RegularPolygon` with 3 sides
7. **Line** - Multi-point paths with cap/join styles
8. **Placeholder** - Dynamic merge fields (e.g., `{{customer_name}}`)
9. **Image** - URL-based images (placeholder for now)

## User Interactions

### Adding Elements

Click any element button in the ElementsLibrary sidebar to add it to the canvas:

```typescript
const addTextElement = () => {
  const element: Omit<TextElement, 'id'> = {
    type: 'text',
    x: 100,
    y: 100,
    text: 'Double click to edit',
    fontSize: 16,
    fontFamily: 'Arial',
    fill: '#000000',
    width: 200,
  };
  onAddElement(element);
};
```

### Selecting Elements

- **Single Select**: Click on element
- **Multi Select**: Shift/Ctrl + Click
- **Deselect**: Click on empty canvas area

### Transforming Elements

- **Move**: Drag element
- **Resize**: Drag corner/edge handles
- **Rotate**: Drag rotation handle (corner)
- **Properties**: Edit in PropertyPanel sidebar

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+D | Duplicate |
| Delete | Delete selected |
| Ctrl+S | Save template |
| G | Toggle grid |
| R | Toggle rulers |
| 0 | Reset zoom |
| + | Zoom in |
| - | Zoom out |

## Data Flow

### Element Creation Flow

```
ElementsLibrary (Button Click)
  ↓
onAddElement(element without id)
  ↓
Zustand Store addElement()
  ↓
Generate UUID, add defaults
  ↓
Add to elements array
  ↓
Push to history stack
  ↓
Re-render KonvaDesigner
  ↓
Konva renders new shape
```

### Transform Update Flow

```
User drags/resizes element
  ↓
Konva fires onDragEnd/onTransformEnd
  ↓
Extract new position/size from Konva node
  ↓
onUpdateElement(id, updates)
  ↓
Zustand Store updateElement()
  ↓
Update element in array
  ↓
Re-render KonvaDesigner
```

## Persistence

### Saving Templates

When saving, the entire design is serialized to JSON:

```typescript
const design: DesignJSON = {
  canvas: {
    width: 794,
    height: 1123,
    backgroundColor: '#ffffff',
    scale: 1
  },
  elements: [
    { id: 'uuid', type: 'text', x: 100, y: 100, ... },
    { id: 'uuid', type: 'rect', x: 200, y: 200, ... }
  ],
  version: '1.0'
}
```

This is stored in the `design_json` column of the `document_templates` table.

### Loading Templates

On page load, if a template exists:

```typescript
useEffect(() => {
  if (template) {
    loadDesign(template.design_json);
  }
}, [template]);
```

The `loadDesign` action rehydrates the Zustand store.

## Backend Integration

### Routes

- `GET /document-templates` - List all templates
- `GET /document-templates/create` - Create new template
- `POST /document-templates` - Store template
- `GET /document-templates/{id}` - Show template
- `GET /document-templates/{id}/edit` - Edit template
- `PUT /document-templates/{id}` - Update template
- `DELETE /document-templates/{id}` - Delete template
- `POST /document-templates/{id}/duplicate` - Duplicate template
- `GET /document-templates/{id}/preview` - Preview with sample data
- `GET /document-templates/{id}/placeholders` - Get available placeholders

### Placeholder System

Templates can include dynamic placeholders:

```typescript
{
  type: 'placeholder',
  text: '{{customer_name}}',
  placeholder: 'customer_name',
  fontSize: 16,
  fontFamily: 'Arial',
  fill: '#6b7280',
  width: 200
}
```

The backend provides context-specific placeholders based on document type:

- **Certificate**: `{{certificate_number}}`, `{{issue_date}}`, `{{holder_name}}`, etc.
- **Invoice**: `{{invoice_number}}`, `{{customer_name}}`, `{{total_amount}}`, etc.
- **Debit/Credit Note**: `{{note_number}}`, `{{amount}}`, `{{reason}}`, etc.

## Performance Considerations

1. **Immutable Updates**: Zustand store uses immutable patterns
2. **History Limit**: Max 50 undo steps to prevent memory bloat
3. **Lazy Rendering**: Only visible elements are rendered
4. **Debounced Saves**: Auto-save debounced to 2 seconds
5. **Canvas Scaling**: Zoom handled via CSS transform, not re-rendering

## Future Enhancements

### Planned Features

1. **Image Upload**: Direct image upload instead of URL only
2. **Text Editing**: Double-click to edit text inline
3. **Grouping**: Group multiple elements together
4. **Layers Panel**: Reorder z-index via drag & drop
5. **Templates Gallery**: Pre-built templates
6. **Export to PDF**: Server-side PDF generation from design JSON
7. **Real-time Collaboration**: Multiple users editing simultaneously
8. **Custom Fonts**: Upload and use custom fonts
9. **Alignment Guides**: Smart guides when aligning elements
10. **History Thumbnails**: Visual preview of undo/redo steps

### Known Limitations

1. **Image Elements**: Currently only shows placeholder, not actual image
2. **Text Editing**: Must edit via PropertyPanel, not inline
3. **Line Points**: Line editing is not user-friendly yet
4. **Mobile Support**: Touch gestures need refinement
5. **Accessibility**: Keyboard-only navigation incomplete

## Migration Notes

### From Old DesignerCanvas to KonvaDesigner

The old `DesignerCanvas.tsx` has been backed up and replaced with `KonvaDesigner.tsx`.

**Key Differences:**

| Old Approach | New Approach |
|--------------|--------------|
| Mixed HTML/Konva | Pure Konva |
| Manual transform logic | Konva Transformer component |
| Limited multi-select | Full multi-select with Transformer |
| Basic drag only | Drag + Resize + Rotate |
| No snap to grid during resize | Full snap to grid support |

**Migration Steps:**

1. ✅ Created `KonvaDesigner.tsx` with full Konva implementation
2. ✅ Updated `Designer.tsx` to use KonvaDesigner
3. ✅ Enhanced ElementsLibrary with Konva branding
4. ✅ Backed up old DesignerCanvas.tsx
5. ✅ Built and tested all components
6. ✅ Updated documentation

## Testing Checklist

- [x] Add all element types to canvas
- [x] Drag elements around
- [x] Resize elements using handles
- [x] Rotate elements
- [x] Multi-select with Shift/Ctrl
- [x] Delete elements
- [x] Undo/Redo operations
- [x] Copy/Paste elements
- [x] Align elements
- [x] Toggle grid
- [x] Zoom in/out
- [x] Save template
- [x] Load template
- [x] Export design JSON
- [ ] Preview with sample data (pending)
- [ ] Generate PDF (pending)

## Resources

- [Konva.js Documentation](https://konvajs.org/)
- [react-konva Documentation](https://konvajs.org/docs/react/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Konva version: `konva@^9.3.18`
3. Check Zustand state in React DevTools
4. Review this documentation
5. Contact development team
