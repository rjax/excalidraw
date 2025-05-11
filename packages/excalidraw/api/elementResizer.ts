import { getCommonBounds } from "../element/bounds";
import { getUncroppedWidthAndHeight } from "../element/cropElement";
import { isImageElement, isTextElement } from "../element/typeChecks";
import { MIN_WIDTH_OR_HEIGHT } from "../constants";
import { getStepSizedValue } from "../components/Stats/utils";
import { getAtomicUnits } from "../components/Stats/utils";
import { frameAndChildrenSelectedTogether } from "../frame";
import { mutateElement } from "../element/mutateElement";
import { rescalePointsInElement } from "../element/resizeElements";
import { getBoundTextElement } from "../element/textElement";
import { updateBoundElements } from "../element/binding";
import { pointFrom } from "@excalidraw/math";

import type { AppClassProperties, AppState } from "../types";
import type {
  NonDeletedExcalidrawElement,
  NonDeletedSceneElementsMap,
} from "../element/types";

// =========== Interfaces ==========

interface ElementMeasurer<T> {
  getDimensions(
    elements: T,
    appState: AppState | null,
  ): { width: number; height: number };
}

interface ResizeOptions {
  preserveAspectRatio?: boolean;
  stepSizeQuantization?: boolean;
}

// =========== Dimension Measurement Implementations ==========

/**
 * Measures dimensions for a single element
 */
class SingleElementMeasurer
  implements ElementMeasurer<NonDeletedExcalidrawElement>
{
  getDimensions(
    element: NonDeletedExcalidrawElement,
    appState: AppState,
  ): { width: number; height: number } {
    if (appState.croppingElementId && isImageElement(element) && element.crop) {
      const { width, height } = getUncroppedWidthAndHeight(element);
      return {
        width: Math.round(width * 100) / 100,
        height: Math.round(height * 100) / 100,
      };
    }

    return {
      width: Math.round(element.width * 100) / 100,
      height: Math.round(element.height * 100) / 100,
    };
  }
}

/**
 * Measures dimensions for multiple elements as a group
 */
class GroupElementMeasurer
  implements ElementMeasurer<NonDeletedExcalidrawElement[]>
{
  getDimensions(elements: NonDeletedExcalidrawElement[]): {
    width: number;
    height: number;
  } {
    const [x1, y1, x2, y2] = getCommonBounds(elements);
    return {
      width: Math.round((x2 - x1) * 100) / 100,
      height: Math.round((y2 - y1) * 100) / 100,
    };
  }
}

/**
 * Resize implementation that handles both single and multiple elements
 */
class ElementResizer {
  resize(
    elements: NonDeletedExcalidrawElement[],
    property: "width" | "height",
    value: number,
    options: ResizeOptions,
    appState: AppState,
    elementsMap: Map<string, NonDeletedExcalidrawElement>,
    originalElementsMap: Map<string, NonDeletedExcalidrawElement>,
  ): void {
    // Special handling for image elements (preserve aspect ratio by default)
    if (
      elements.length === 1 &&
      elements[0].type === "image" &&
      !options.preserveAspectRatio
    ) {
      options = { ...options, preserveAspectRatio: true };
    }

    // Get original bounding box
    const [x1, y1, x2, y2] = getCommonBounds(elements);
    const originalWidth = x2 - x1;
    const originalHeight = y2 - y1;

    // Enforce minimum dimension value
    const safeValue = Math.max(value, MIN_WIDTH_OR_HEIGHT);

    // Calculate scale factors
    const scaleFactor =
      safeValue / (property === "width" ? originalWidth : originalHeight);

    const newWidth =
      property === "width"
        ? safeValue
        : options.preserveAspectRatio
        ? originalWidth * scaleFactor
        : originalWidth;

    const newHeight =
      property === "height"
        ? safeValue
        : options.preserveAspectRatio
        ? originalHeight * scaleFactor
        : originalHeight;

    // Calculate transformation scale factors
    const scaleX = newWidth / originalWidth;
    const scaleY = options.preserveAspectRatio
      ? scaleX
      : newHeight / originalHeight;

    // Use the top-left corner as anchor point
    const anchor = pointFrom(x1, y1);

    // Apply the transformation to each element
    for (const element of elements) {
      // Calculate the element's position relative to the anchor
      const offsetX = element.x - anchor[0];
      const offsetY = element.y - anchor[1];

      // Scale dimensions and position
      const nextElementWidth = Math.max(element.width * scaleX, MIN_WIDTH_OR_HEIGHT);
      const nextElementHeight = Math.max(element.height * scaleY, MIN_WIDTH_OR_HEIGHT);
      const x = anchor[0] + offsetX * scaleX;
      const y = anchor[1] + offsetY * scaleY;

      // Create update object
      const updates = {
        width: nextElementWidth,
        height: nextElementHeight,
        x,
        y,
        ...rescalePointsInElement(
          element,
          nextElementWidth,
          nextElementHeight,
          false,
        ),
        ...(isTextElement(element)
          ? {
              fontSize:
                element.fontSize * (property === "width" ? scaleX : scaleY),
            }
          : {}),
      };

      // Update the element
      mutateElement(element, updates, false);

      // Handle bound text elements
      const boundTextElement = getBoundTextElement(
        element,
        originalElementsMap,
      );
      if (boundTextElement) {
        const newFontSize =
          boundTextElement.fontSize * (property === "width" ? scaleX : scaleY);

        updateBoundElements(
          element,
          elementsMap as NonDeletedSceneElementsMap,
          {
            newSize: { width: nextElementWidth, height: nextElementHeight },
          },
        );

        const latestBoundTextElement = elementsMap.get(boundTextElement.id);
        if (latestBoundTextElement && isTextElement(latestBoundTextElement)) {
          mutateElement(
            latestBoundTextElement,
            { fontSize: newFontSize },
            false,
          );
        }
      }
    }
  }
}

// =========== Public API functions ==========

/**
 * Get dimensions of selected elements
 */
export function getSelectedElementsDimensions(
  app: AppClassProperties,
  appState: AppState,
): { width: number; height: number } {
  const scene = app.scene;
  const selectedElements = scene.getSelectedElements({
    selectedElementIds: appState.selectedElementIds,
    includeBoundTextElement: false,
  });

  if (selectedElements.length === 0) {
    return { width: 0, height: 0 };
  }

  if (selectedElements.length === 1) {
    const measurer = new SingleElementMeasurer();
    return measurer.getDimensions(selectedElements[0], appState);
  }

  // For multiple elements, always use the bounding box dimensions
  // instead of checking for "Mixed" values
  const groupMeasurer = new GroupElementMeasurer();
  return groupMeasurer.getDimensions(selectedElements);
}

/**
 * Set dimensions of selected elements
 */
export function setSelectedElementsDimension(
  app: AppClassProperties,
  appState: AppState,
  property: "width" | "height",
  value: number,
  options: ResizeOptions = {},
): void {
  const scene = app.scene;
  const selectedElements = scene.getSelectedElements({
    selectedElementIds: appState.selectedElementIds,
    includeBoundTextElement: false,
  });

  if (
    selectedElements.length === 0 ||
    frameAndChildrenSelectedTogether(selectedElements)
  ) {
    return;
  }

  // Process value for quantization
  const nextValue = options.stepSizeQuantization
    ? getStepSizedValue(value, 10)
    : Math.round(value);

  const elementsMap = scene.getNonDeletedElementsMap();
  const originalElementsMap = elementsMap;

  // Use a single resizer to handle all elements
  const resizer = new ElementResizer();
  resizer.resize(
    selectedElements,
    property,
    nextValue,
    options,
    appState,
    elementsMap,
    originalElementsMap,
  );

  // Trigger scene update
  scene.triggerUpdate();
}

/**
 * Set width of selected elements
 */
export function setSelectedElementsWidth(
  app: AppClassProperties,
  appState: AppState,
  width: number,
  options: ResizeOptions = {},
): void {
  setSelectedElementsDimension(app, appState, "width", width, options);
}

/**
 * Set height of selected elements
 */
export function setSelectedElementsHeight(
  app: AppClassProperties,
  appState: AppState,
  height: number,
  options: ResizeOptions = {},
): void {
  setSelectedElementsDimension(app, appState, "height", height, options);
}
