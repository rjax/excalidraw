import ReactDOM from "react-dom";
import React, { useEffect, useState, useRef } from "react";

import { useDevice } from "@excalidraw/excalidraw";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import {
  getSelectedElementsDimensions,
  setSelectedElementsWidth,
  setSelectedElementsHeight,
} from "../../../packages/excalidraw/api/elementResizer";
import {
  useApp,
  useExcalidrawAppState,
} from "../../../packages/excalidraw/components/App";

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

  // Get the relevant dimension from the selected elements
  const dimensions = getSelectedElementsDimensions(app, appState);
  const dimensionValue =
    dimensionType === DimensionType.WIDTH
      ? dimensions.width
      : dimensions.height;

  const [value, setValue] = useState<string>(
    dimensionValue === "Mixed" ? "Mixed" : dimensionValue.toString(),
  );

  // Default labels
  const defaultLabel = dimensionType === DimensionType.WIDTH ? "רוחב" : "אורך";
  const displayLabel = label || defaultLabel;

  // Update dimensions when selection changes, but only if user isn't actively editing
  useEffect(() => {
    if (!isUserEditing.current) {
      const newDimensions = getSelectedElementsDimensions(app, appState);
      const newValue =
        dimensionType === DimensionType.WIDTH
          ? newDimensions.width
          : newDimensions.height;

      setValue(newValue === "Mixed" ? "Mixed" : newValue.toString());
    }
  }, [appState, appState.selectedElementIds, app, dimensionType]);

  useEffect(() => {
    // This function will update the input when elements change
    const handleElementChange = () => {
      if (!isUserEditing.current) {
        const newDimensions = getSelectedElementsDimensions(app, appState);
        const newValue =
          dimensionType === DimensionType.WIDTH
            ? newDimensions.width
            : newDimensions.height;

        setValue(newValue === "Mixed" ? "Mixed" : newValue.toString());
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
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      if (dimensionType === DimensionType.WIDTH) {
        setSelectedElementsWidth(
          app,
          excalidrawAPI.getAppState(),
          numericValue,
          {
            preserveAspectRatio: false,
          },
        );
      } else {
        setSelectedElementsHeight(
          app,
          excalidrawAPI.getAppState(),
          numericValue,
          {
            preserveAspectRatio: false,
          },
        );
      }
      onChange?.(value);
    }
  };

  // Handle blur (losing focus) - apply changes when user is done editing
  const handleValueBlur = () => {
    isUserEditing.current = false;
    applyValueChange(); // Apply changes when focus is lost

    // Reformat or reset the value if needed
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) && value !== "Mixed") {
      // Reset to current dimensions if invalid
      const currentDimensions = getSelectedElementsDimensions(app, appState);
      const currentValue =
        dimensionType === DimensionType.WIDTH
          ? currentDimensions.width
          : currentDimensions.height;

      setValue(currentValue === "Mixed" ? "Mixed" : currentValue.toString());
    } else if (!isNaN(numericValue)) {
      // Format to clean number
      setValue(numericValue.toString());
    }
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
      <label style={{ marginRight: "0.5rem" }} htmlFor={`set-${dimensionType}`}>
        <span>{displayLabel}</span>
        <input
          id={`set-${dimensionType}`}
          type="text"
          name={`set-${dimensionType}`}
          placeholder={`${
            dimensionType.charAt(0).toUpperCase() + dimensionType.slice(1)
          }...`}
          value={value}
          onChange={handleValueChange}
          onBlur={handleValueBlur}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            isUserEditing.current = true;
          }}
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
