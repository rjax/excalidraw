//// filepath: /home/rjax/repos/temp/cabu-firebase/src/components/dimensions/dimensionElements.ts
import { CaptureUpdateAction, convertToExcalidrawElements } from '@rjax/excalidraw';
import type { ExcalidrawElementSkeleton } from '@rjax/excalidraw/data/transform';
import type { ExcalidrawImperativeAPI } from '@rjax/excalidraw/types';
import type { Bounds, DimensionGeometry } from './dimensionGeometry';
import { nanoid } from 'nanoid';

const color = '#1971c2';

/**
 * Build skeleton elements (lines + text) for a dimension.
 * All coordinates are in scene space.
 */
function buildDimensionSkeletons(
    geometry: DimensionGeometry,
    bounds: Bounds,
    opts: { fontSize: number; fontFamily: number },
): ExcalidrawElementSkeleton[] {
    const { mainLine, extensionLines, textPosition, orientation } = geometry;
    const { fontSize, fontFamily } = opts;

    // Simple length in scene units (you can later map pixels → mm/inches)
    const rawLength =
        orientation === 'horizontal'
            ? Math.abs(bounds.x2 - bounds.x1)
            : Math.abs(bounds.y2 - bounds.y1);

    const valueText = `${Math.round(rawLength)}`;
    const groupId = nanoid();
    console.log('Dimension groupId:', groupId);

    const seed = () => Math.floor(Math.random() * 100000);

    const mainLineFromSegment = (seg: { x1: number; y1: number; x2: number; y2: number }): ExcalidrawElementSkeleton => {
        const width = seg.x2 - seg.x1;
        const height = seg.y2 - seg.y1;
        return {
            type: 'arrow',
            startArrowhead: 'triangle',
            endArrowhead: 'triangle',
            x: seg.x1,
            y: seg.y1,
            width,
            height,
            strokeColor: color,
            strokeWidth: 1,
            roughness: 0,
            seed: seed(),
            points: [
                [0, 0],
                [width, height],
            ],
            groupIds: [groupId],
            customData: {
                dimensionId: groupId,
                dimensionRole: 'main',
            },
        };
    };
    const lineFromSegment = (seg: { x1: number; y1: number; x2: number; y2: number }): ExcalidrawElementSkeleton => {
        const width = seg.x2 - seg.x1;
        const height = seg.y2 - seg.y1;
        return {
            type: 'line',
            x: seg.x1,
            y: seg.y1,
            width,
            height,
            strokeColor: color,
            strokeWidth: 1,
            roughness: 0,
            seed: seed(),
            points: [
                [0, 0],
                [width, height],
            ],
            groupIds: [groupId],
            customData: {
                dimensionId: groupId,
                dimensionRole: 'extension',
            },
        };
    };

    const skeletons: ExcalidrawElementSkeleton[] = [];

    // Main dimension line
    skeletons.push(mainLineFromSegment(mainLine));

    // Extension lines
    for (const ext of extensionLines) {
        skeletons.push(lineFromSegment(ext));
    }

    // Text – always horizontal (angle 0)
    const textWidth =
        orientation === 'horizontal'
            ? Math.abs(mainLine.x2 - mainLine.x1)
            : Math.abs(mainLine.y2 - mainLine.y1);

    skeletons.push({
        type: 'text',
        x: textPosition.x,
        y: textPosition.y,
        width: textWidth,
        height: fontSize * 1.5,
        strokeColor: color,
        backgroundColor: 'transparent',
        fillStyle: 'hachure',
        angle: textPosition.rotation,
        strokeWidth: 1,
        roughness: 0,
        seed: seed(),
        text: valueText,
        fontSize,
        fontFamily,
        textAlign: 'center',
        verticalAlign: 'middle',
        groupIds: [groupId],
        customData: {
            dimensionId: groupId,
            dimensionRole: 'label',
        },
    });

    return skeletons;
}

/**
 * Create and insert dimension elements into the scene.
 */
export function createDimensionElements(
    excalidrawAPI: ExcalidrawImperativeAPI,
    geometry: DimensionGeometry,
    bounds: Bounds,
): void {
    const appState = excalidrawAPI.getAppState();
    const { currentItemFontSize, currentItemFontFamily } = appState;

    const skeletons = buildDimensionSkeletons(geometry, bounds, {
        fontSize: currentItemFontSize,
        fontFamily: currentItemFontFamily,
    });

    const dimElements = convertToExcalidrawElements(skeletons);
    const existing = excalidrawAPI.getSceneElements();

    excalidrawAPI.updateScene({
        elements: existing.concat(dimElements),
        captureUpdate: CaptureUpdateAction.IMMEDIATELY
    });
}