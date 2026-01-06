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

import type { AppState } from "../types";
import type Scene from "../scene/Scene";
import type {
  ExcalidrawElement,
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
      const nextElementWidth = Math.max(
        element.width * scaleX,
        MIN_WIDTH_OR_HEIGHT,
      );
      const nextElementHeight = Math.max(
        element.height * scaleY,
        MIN_WIDTH_OR_HEIGHT,
      );
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
 * @param scene The scene containing elements
 * @param appState Current application state
 * @returns Object containing width and height
 */
export function getSelectedElementsDimensions(
  scene: Scene,
  appState: AppState,
): { width: number; height: number } {
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
  const groupMeasurer = new GroupElementMeasurer();
  return groupMeasurer.getDimensions(selectedElements);
}

/**
 * Set dimensions of selected elements
 * @param scene The scene containing elements
 * @param appState Current application state
 * @param property Dimension property to modify (width or height)
 * @param value New value for the dimension
 * @param options Resizing options
 * @param elementsToResize Optional specific elements to resize
 */
export function setSelectedElementsDimension(
  scene: Scene,
  appState: AppState,
  property: "width" | "height",
  value: number,
  options: ResizeOptions = {},
  elementsToResize?: readonly ExcalidrawElement[],
): void {
  // Use provided elements or fall back to current selection
  const elements =
    elementsToResize ||
    scene.getSelectedElements({
      selectedElementIds: appState.selectedElementIds,
      includeBoundTextElement: false,
    });

  // Check if elements still exist in the scene and update only valid ones
  const currentElementsMap = scene.getNonDeletedElementsMap();
  const validElements = elements.filter((el) => currentElementsMap.has(el.id));

  if (validElements.length === 0) {
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
    validElements,
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
 * @param scene The scene containing elements
 * @param appState Current application state
 * @param width New width value
 * @param options Resizing options
 * @param selectedElements Optional specific elements to resize
 */
export function setSelectedElementsWidth(
  scene: Scene,
  appState: AppState,
  width: number,
  options: ResizeOptions = {},
  selectedElements?: readonly ExcalidrawElement[],
): void {
  // Use provided elements or fall back to current selection
  const elementsToResize =
    selectedElements ||
    scene.getSelectedElements({
      selectedElementIds: appState.selectedElementIds,
      includeBoundTextElement: false,
    });
  setSelectedElementsDimension(
    scene,
    appState,
    "width",
    width,
    { ...options },
    elementsToResize,
  );
}

/**
 * Set height of selected elements
 * @param scene The scene containing elements
 * @param appState Current application state
 * @param height New height value
 * @param options Resizing options
 * @param selectedElements Optional specific elements to resize
 */
export function setSelectedElementsHeight(
  scene: Scene,
  appState: AppState,
  height: number, // Fixed: renamed from width to height
  options: ResizeOptions = {},
  selectedElements?: readonly ExcalidrawElement[],
): void {
  // Use provided elements or fall back to current selection
  const elementsToResize =
    selectedElements ||
    scene.getSelectedElements({
      selectedElementIds: appState.selectedElementIds,
      includeBoundTextElement: false,
    });
  setSelectedElementsDimension(
    scene,
    appState,
    "height",
    height, // Using correct parameter name
    { ...options },
    elementsToResize,
  );
}
