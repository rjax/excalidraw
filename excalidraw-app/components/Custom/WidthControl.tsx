import ReactDOM from "react-dom";
import React, { useEffect, useState, useRef } from "react";

import { useDevice } from "@excalidraw/excalidraw";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import {
  getSelectedElementsDimensions,
  setSelectedElementsWidth,
} from "../../../packages/excalidraw/api/elementResizer";
import {
  useApp,
  useExcalidrawAppState,
} from "../../../packages/excalidraw/components/App";

interface WidthControlProps {
  onChange?: (value: string) => void;
  excalidrawAPI: ExcalidrawImperativeAPI; // Replace with the actual type if available
}

export const WidthControl: React.FC<WidthControlProps> = ({
  onChange,
  excalidrawAPI,
}) => {
  // Get current dimensions
  const app = useApp();
  const appState = useExcalidrawAppState();
  const isUserEditing = useRef(false);

  const dimensions = getSelectedElementsDimensions(app, appState);
  const [width, setWidth] = useState<string>(
    dimensions.width === "Mixed" ? "Mixed" : dimensions.width.toString(),
  );

  // Update dimensions when selection changes, but only if user isn't actively editing
  useEffect(() => {
    if (!isUserEditing.current) {
      const newDimensions = getSelectedElementsDimensions(app, appState);
      setWidth(
        newDimensions.width === "Mixed"
          ? "Mixed"
          : newDimensions.width.toString(),
      );
    }
  }, [appState, appState.selectedElementIds, app]);

  useEffect(() => {
    // This function will update the width input when elements change
    const handleElementChange = () => {
      if (!isUserEditing.current) {
        const newDimensions = getSelectedElementsDimensions(app, appState);
        setWidth(
          newDimensions.width === "Mixed"
            ? "Mixed"
            : newDimensions.width.toString(),
        );
      }
    };

    // Subscribe to changes using the app's onChange API
    const unsubscribe = excalidrawAPI.onChange(handleElementChange);

    return () => {
      unsubscribe();
    };
  }, [app, appState, excalidrawAPI]);

  // Only update the local state, don't apply changes yet
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setWidth(newValue);
    isUserEditing.current = true;
  };

  // Apply changes to the actual element
  const applyWidthChange = () => {
    const numericValue = parseFloat(width);
    if (!isNaN(numericValue)) {
      setSelectedElementsWidth(app, excalidrawAPI.getAppState(), numericValue, {
        preserveAspectRatio: false,
      });
      onChange?.(width);
    }
  };

  // Handle blur (losing focus) - apply changes when user is done editing
  const handleWidthBlur = () => {
    isUserEditing.current = false;
    applyWidthChange(); // Apply changes when focus is lost

    // Reformat or reset the value if needed
    const numericValue = parseFloat(width);
    if (isNaN(numericValue) && width !== "Mixed") {
      // Reset to current dimensions if invalid
      const currentDimensions = getSelectedElementsDimensions(app, appState);
      setWidth(
        currentDimensions.width === "Mixed"
          ? "Mixed"
          : currentDimensions.width.toString(),
      );
    } else if (!isNaN(numericValue)) {
      // Format to clean number
      setWidth(numericValue.toString());
    }
  };

  // Handle keyboard events - apply changes on Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      applyWidthChange();
      e.currentTarget.blur(); // Remove focus from input
    }
  };

  return (
    <div style={{ flexGrow: 1 }}>
      <label style={{ marginRight: "0.5rem" }} htmlFor="set-width">
        <span>רוחב</span>
        <input
          id="set-width"
          type="text"
          name="set-width"
          placeholder="Width..."
          value={width}
          onChange={handleWidthChange}
          onBlur={handleWidthBlur}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            isUserEditing.current = true;
          }}
        />
      </label>
    </div>
  );
};

interface PortalComponentProps {
  observerSelector: string; // Changed from targetId to targetSelector
  targetSelector: string; // Changed from targetId to targetSelector
  children: React.ReactNode;
}

export function PortalComponent({
  targetSelector,
  observerSelector,
  children,
}: PortalComponentProps) {
  const [targetElement, setTargetElement] = useState<Element | null>(null);

  const device = useDevice();

  useEffect(() => {
    if (!targetSelector) {
      console.warn("No target selector provided for the portal.");
      return;
    }

    if (!device.editor.isMobile) {
      return;
    }

    // Find the target element using querySelector instead of getElementById
    const element = document.querySelector(targetSelector);
    if (element) {
      setTargetElement(element);
    } else {
      console.warn(
        `Target element with selector "${targetSelector}" not found`,
      );
    }
  }, [targetSelector, device, device.editor.isMobile]);

  // Only render the portal if we found the target element
  return targetElement ? ReactDOM.createPortal(children, targetElement) : null;
}
