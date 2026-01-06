# Element Resizing Requirements

## Core Concepts

### Aspect Ratio
- **Aspect Ratio**: The proportional relationship between an element's width and height (width:height)
- **Preserve Aspect Ratio**: When enabled, changing one dimension automatically adjusts the other to maintain the original proportions
- **Non-Preserving Resize**: When disabled, dimensions can be changed independently

## Resizing Behaviors

### 1. Single Element Resizing

When resizing a single element:

- **One Dimension Specified**:
  - **Default Behavior**: Only the specified dimension changes; aspect ratio is not preserved
  - **With Preserve Aspect Ratio**: The unspecified dimension is automatically calculated to maintain the original aspect ratio

- **Two Dimensions Specified**:
  - Both dimensions change to the specified values
  - The new aspect ratio becomes width:height based on these values

### 2. Multiple Selected Elements

When multiple individual elements are selected:

- Elements are treated as a group bounded by a common bounding rectangle
- A scaling factor is calculated based on the change to the bounding rectangle's dimensions
- Each element is scaled and positioned proportionally to maintain its relative position within the group
- The same aspect ratio rules apply to the bounding rectangle as with single elements

### 3. Grouped Elements

Grouped elements (officially grouped using the group function):

- Are resized using the same algorithm as multiple selected elements
- All elements within the group maintain their relative positions and are scaled according to the bounding rectangle's change

## Interaction Rules

- **Interactive Handles**:
  - Corner handles: Preserve aspect ratio by default (can be overridden with Shift key)
  - Edge handles: Change only one dimension by default (can be overridden with Shift key)

- **Numeric Input**:
  - When entering a value for a single dimension, only that dimension changes unless "Preserve Aspect Ratio" is enabled
  - When both dimensions are specified numerically, both are applied regardless of aspect ratio setting

## Special Cases

- **Text Elements**: May have additional constraints to ensure readability
- **Images**: Preserve aspect ratio by default unless explicitly overridden
