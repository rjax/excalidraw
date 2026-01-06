import { useCallback } from 'react';
import type { ExcalidrawImperativeAPI } from '@rjax/excalidraw/types';
import { getCommonBounds, viewportCoordsToSceneCoords } from '@rjax/excalidraw';
import {
    type Bounds,
    type Edge,
    computeDimensionGeometry,
} from './dimensionGeometry';
import { createDimensionElements } from './dimensionElements';

type SelectionInfo = {
    elementIds: string[];
    bounds: Bounds; // in SCENE coordinates
};

/**
 * Derive the relevant selection (prefer previousSelectedElementIds) and its bounds (scene coords).
 */
function getSelectionInfo(excalidrawAPI: ExcalidrawImperativeAPI | null): SelectionInfo | null {
    if (!excalidrawAPI) return null;

    const appState = excalidrawAPI.getAppState();
    const elements = excalidrawAPI.getSceneElements();

    const selectionMap =
        appState.previousSelectedElementIds &&
            Object.keys(appState.previousSelectedElementIds).length > 0
            ? appState.previousSelectedElementIds
            : appState.selectedElementIds;

    if (!selectionMap || Object.keys(selectionMap).length === 0) {
        return null;
    }

    const selected = elements.filter((el) => selectionMap[el.id]);
    if (!selected.length) return null;

    // getCommonBounds returns scene coordinates
    const [x1, y1, x2, y2] = getCommonBounds(selected as any);

    return {
        elementIds: selected.map((el) => el.id),
        bounds: { x1, y1, x2, y2 },
    };
}

/**
 * Given a SCENE-space point and SCENE-space bounds, determine which edge (if any)
 * was clicked by checking for clicks strictly outside the box on exactly one side.
 */
function detectClickedEdge(
    sceneX: number,
    sceneY: number,
    bounds: Bounds,
): Edge | null {
    const { x1, y1, x2, y2 } = bounds;

    // Inside the bounding box → no edge
    const insideX = sceneX >= x1 && sceneX <= x2;
    const insideY = sceneY >= y1 && sceneY <= y2;
    if (insideX && insideY) {
        return null;
    }

    const isLeft = sceneX < x1;
    const isRight = sceneX > x2;
    const isAbove = sceneY < y1;
    const isBelow = sceneY > y2;

    const conditionsTrue = [isLeft, isRight, isAbove, isBelow].filter(Boolean).length;
    if (conditionsTrue !== 1) {
        // corner or far away → ignore
        return null;
    }

    if (isLeft && sceneY >= y1 && sceneY <= y2) return 'left';
    if (isRight && sceneY >= y1 && sceneY <= y2) return 'right';
    if (isAbove && sceneX >= x1 && sceneX <= x2) return 'top';
    if (isBelow && sceneX >= x1 && sceneX <= x2) return 'bottom';

    return null;
}

export function useDimensions() {
    const handleWrapperClick = useCallback(
        (
            event: React.MouseEvent<HTMLDivElement>,
            excalidrawAPI: ExcalidrawImperativeAPI | null,
        ) => {
            if (!excalidrawAPI) return;

            const selection = getSelectionInfo(excalidrawAPI);
            if (!selection) {
                console.log('[dimension-edge-experiment] no selection found');
                return;
            }

            const appState = excalidrawAPI.getAppState();

            const { x: sceneX, y: sceneY } = viewportCoordsToSceneCoords(
                { clientX: event.clientX, clientY: event.clientY },
                appState,
            );

            const edge = detectClickedEdge(sceneX, sceneY, selection.bounds);
            if (!edge) return;

            const geometry = computeDimensionGeometry(selection.bounds, edge);

            console.log('[dimension-edge-experiment]', {
                edge,
                clickScene: { x: sceneX, y: sceneY },
                bounds: selection.bounds,
                geometry,
                elementIds: selection.elementIds,
            });

            // Next step: convert `geometry` into actual Excalidraw elements
            // and insert via excalidrawAPI.updateScene(...)
             createDimensionElements(excalidrawAPI, geometry, selection.bounds);
       },
        [],
    );

    return { handleWrapperClick };
}
