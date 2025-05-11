import ReactDOM from "react-dom";
import React, { useEffect, useState, useRef } from "react";

import { useDevice } from "@excalidraw/excalidraw";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";

import {
  getSelectedElementsDimensions,
  setSelectedElementsWidth,
  setSelectedElementsHeight,
} from "../../../packages/excalidraw/api/elementResizer";
import {
  useApp,
  useExcalidrawAppState,
} from "../../../packages/excalidraw/components/App";
import { MIN_WIDTH_OR_HEIGHT } from "../../../packages/excalidraw/constants";

export enum DimensionType {
  WIDTH = "width",
  HEIGHT = "height",
}

export enum DeviceType {
  DESKTOP = "desktop",
  MOBILE = "mobile",
}

interface DimensionControlProps {
  dimensionType: DimensionType;
  onChange?: (value: string) => void;
  excalidrawAPI: ExcalidrawImperativeAPI;
  label?: string; // Optional custom label
}

export const DimensionControl: React.FC<DimensionControlProps> = ({
  dimensionType,
  onChange,
  excalidrawAPI,
  label,
}) => {
  // Get current dimensions
  const app = useApp();
  const appState = useExcalidrawAppState();
  const isUserEditing = useRef(false);
  const selectedElementsRef = useRef<ExcalidrawElement[]>([]);

  // Check if any elements are selected
  const hasSelectedElements =
    Object.keys(appState.selectedElementIds).length > 0;

  // Get the relevant dimension from the selected elements or set empty string if none selected
  const dimensions = hasSelectedElements
    ? getSelectedElementsDimensions(app, appState)
    : { width: 0, height: 0 };
  const dimensionValue =
    dimensionType === DimensionType.WIDTH
      ? dimensions.width
      : dimensions.height;

  // Use empty string when no elements are selected
  const [value, setValue] = useState<string>(
    hasSelectedElements ? dimensionValue.toString() : "",
  );

  // Default labels
  const defaultLabel = dimensionType === DimensionType.WIDTH ? "רוחב" : "אורך";
  const displayLabel = label || defaultLabel;

  // Update dimensions when selection changes, but only if user isn't actively editing
  useEffect(() => {
    if (!isUserEditing.current) {
      if (!hasSelectedElements) {
        setValue("");
        return;
      }

      const newDimensions = getSelectedElementsDimensions(app, appState);
      const newValue =
        dimensionType === DimensionType.WIDTH
          ? newDimensions.width
          : newDimensions.height;

      setValue(newValue.toString());
    }
  }, [
    appState,
    appState.selectedElementIds,
    app,
    dimensionType,
    hasSelectedElements,
  ]);

  useEffect(() => {
    // This function will update the input when elements change
    const handleElementChange = () => {
      if (!isUserEditing.current) {
        const newDimensions = getSelectedElementsDimensions(app, appState);
        const newValue =
          dimensionType === DimensionType.WIDTH
            ? newDimensions.width
            : newDimensions.height;

        setValue(newValue.toString());
      }
    };

    // Subscribe to changes using the app's onChange API
    const unsubscribe = excalidrawAPI.onChange(handleElementChange);

    return () => {
      unsubscribe();
    };
  }, [app, appState, excalidrawAPI, dimensionType]);

  // Only update the local state, don't apply changes yet
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    isUserEditing.current = true;
  };

  // Apply changes to the actual element
  const applyValueChange = () => {
    let numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      // Enforce minimum dimensions
      numericValue = Math.max(numericValue, MIN_WIDTH_OR_HEIGHT);

      // Get the elements that were selected when editing began
      const elementsToResize =
        selectedElementsRef.current.length > 0
          ? selectedElementsRef.current
          : app.scene.getSelectedElements({
              selectedElementIds: appState.selectedElementIds,
              includeBoundTextElement: false,
            });

      if (dimensionType === DimensionType.WIDTH) {
        setSelectedElementsWidth(
          app,
          excalidrawAPI.getAppState(),
          numericValue,
          {
            preserveAspectRatio: false,
          },
          elementsToResize, // Pass the stored elements
        );
      } else {
        setSelectedElementsHeight(
          app,
          excalidrawAPI.getAppState(),
          numericValue,
          {
            preserveAspectRatio: false,
          },
          elementsToResize, // Pass the stored elements
        );
      }
      onChange?.(numericValue.toString());
      setValue(numericValue.toString()); // Update the input to reflect minimum value if needed
    }
  };

  // Handle blur (losing focus) - apply changes when user is done editing
  const handleValueBlur = () => {
    isUserEditing.current = false;
    applyValueChange(); // Apply changes when focus is lost
  };

  // Handle keyboard events - apply changes on Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyValueChange();
      e.currentTarget.blur(); // Remove focus from input
    }
  };

  return (
    <div style={{ flexGrow: 1 }}>
      <label
        style={{
          opacity: hasSelectedElements ? 1 : 0.5,
        }}
        htmlFor={`set-${dimensionType}`}
      >
        <span>{displayLabel}</span>
        <input
          id={`set-${dimensionType}`}
          type="number"
          name={`set-${dimensionType}`}
          min={MIN_WIDTH_OR_HEIGHT}
          step="1"
          value={value}
          onChange={handleValueChange}
          onBlur={handleValueBlur}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            isUserEditing.current = true;
            selectedElementsRef.current = app.scene.getSelectedElements({
              selectedElementIds: appState.selectedElementIds,
              includeBoundTextElement: false,
            });
          }}
          // disabled={!hasSelectedElements}
        />
      </label>
    </div>
  );
};

// Re-export PortalComponent from the original file
interface PortalComponentProps {
  targetDeviceType?: DeviceType;
  targetSelector: string;
  children: React.ReactNode;
}

export function PortalComponent({
  targetSelector,
  targetDeviceType = DeviceType.DESKTOP,
  children,
}: PortalComponentProps) {
  const [targetElement, setTargetElement] = useState<Element | null>(null);

  const device = useDevice();
  const deviceType = device.editor.isMobile
    ? DeviceType.MOBILE
    : DeviceType.DESKTOP;

  useEffect(() => {
    if (!targetSelector || deviceType !== targetDeviceType) {
      return;
    }

    const element = document.querySelector(targetSelector);
    if (element) {
      setTargetElement(element);
    } else {
      console.warn(
        `Target element with selector "${targetSelector}" not found`,
      );
    }
  }, [
    targetSelector,
    targetDeviceType,
    deviceType,
    device,
    device.editor.isMobile,
  ]);

  return targetElement ? ReactDOM.createPortal(children, targetElement) : null;
}
