export type Edge = 'top' | 'bottom' | 'left' | 'right';
export type DimensionOrientation = 'horizontal' | 'vertical';
export type Bounds = { x1: number; y1: number; x2: number; y2: number };

export type LineSegment = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
};

export type DimensionGeometry = {
    edge: Edge;
    mainLine: LineSegment;
    extensionLines: LineSegment[];
    orientation: DimensionOrientation;
    textPosition: { x: number; y: number, rotation: number };
};

type DimensionGeometryOptions = {
    gap?: number;
    extension?: number;
    extensionOffset?: number;
    textOffset?: number;
};

/**
 * Compute dimension geometry (all in scene coordinates) for a given
 * selection bounds + clicked edge.
 *
 * @param bounds  selection bounds in scene coordinates
 * @param edge    which side the user clicked
 * @param gap     distance between object and dimension line
 * @param extension length of each extension line beyond the bounds
 * @param textOffset extra offset for text away from the main line
 */
export function computeDimensionGeometry(
    bounds: Bounds,
    edge: Edge,
    {
        gap = 40,
        extension = 20,
        textOffset = 20,
        extensionOffset = 10,
    }: DimensionGeometryOptions = {},
): DimensionGeometry {
    const { x1, y1, x2, y2 } = bounds;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    if (edge === 'top' || edge === 'bottom') {
        const orientation: DimensionOrientation = 'horizontal';
        const isTop = edge === 'top';
        const lineY = isTop ? y1 - gap : y2 + gap;

        const mainLine: LineSegment = {
            x1,
            y1: lineY,
            x2,
            y2: lineY,
        };

        const extensionLines: LineSegment[] = [
            // left side extension
            {
                x1,
                y1: (isTop ? y1 : y2) + (isTop ? -extensionOffset : extensionOffset),
                x2: x1,
                y2: lineY + (isTop ? -extension : extension),
            },
            // right side extension
            {
                x1: x2,
                y1: (isTop ? y1 : y2) + (isTop ? -extensionOffset : extensionOffset),
                x2: x2,
                y2: lineY + (isTop ? -extension : extension),
            },
        ];

        const textPosition = {
            x: cx,
            y: lineY + (isTop ? -textOffset : textOffset),
            rotation: 0,
        };

        return { orientation, edge, mainLine, extensionLines, textPosition };
    }

    // edge === 'left' | 'right'  → vertical dimension
    const orientation: DimensionOrientation = 'vertical';
    const isLeft = edge === 'left';
    const lineX = isLeft ? x1 - gap : x2 + gap;

    const mainLine: LineSegment = {
        x1: lineX,
        y1,
        x2: lineX,
        y2,
    };

    const extensionLines: LineSegment[] = [
        // top extension
        {
            x1: (isLeft ? x1 : x2) + (isLeft ? -extensionOffset : extensionOffset),
            y1,
            x2: lineX + (isLeft ? -extension : extension),
            y2: y1,
        },
        // bottom extension
        {
            x1: (isLeft ? x1 : x2) + (isLeft ? -extensionOffset : extensionOffset),
            y1: y2,
            x2: lineX + (isLeft ? -extension : extension),
            y2,
        },
    ];

    // Text stays horizontal; offset sideways from the main line
    const textPosition = {
        x: lineX + (isLeft ? -textOffset : textOffset),
        y: cy,
        rotation: isLeft ? 3 * Math.PI / 2 : Math.PI / 2,

    };

    return { orientation, edge, mainLine, extensionLines, textPosition };
}