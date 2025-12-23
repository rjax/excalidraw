import { convertToExcalidrawElements } from "@rjax/excalidraw";
import { ExcalidrawElementSkeleton } from "@rjax/excalidraw/data/transform";
import { ExcalidrawImperativeAPI } from "@rjax/excalidraw/types";
import { getFontFamilyString } from "@rjax/excalidraw";


const resolveFontToken = (token: string) => {
    const match = token.match(/^var\(--([^,]+),\s*([^)]+)\),?(.*)/);
    if (!match) return token;

    console.log('Resolving font token:', token);
    console.log('Matched groups:', match);

    const values = match.slice(1).map(v => v.trim()).filter(v => v.length > 0);

    const value = getComputedStyle(document.documentElement)
        .getPropertyValue(`--${values[0]}`)
        .trim();

    return value
        ? [value, ...values.slice(1)].join(",")
        : values.slice(1).join(",");
};

const resolveFontStack = (excalidrawAPI: ExcalidrawImperativeAPI) => {

    const appState = excalidrawAPI.getAppState();
    const { currentItemFontFamily } = appState;

    const stack = getFontFamilyString({ fontFamily: currentItemFontFamily });
    return resolveFontToken(stack);
}

const calcColumnWidths = (
    excalidrawAPI: ExcalidrawImperativeAPI, tableData: string[][],
    cellPadding: number) => {
    const appState = excalidrawAPI.getAppState();
    const { currentItemFontSize, currentItemFontFamily } = appState;
    const familyStack = resolveFontStack(excalidrawAPI);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.font = `${currentItemFontSize}px ${familyStack}`;
    const cols = tableData[0].length;

    const colWidths: number[] = new Array(cols).fill(0);

    for (let row = 0; row < tableData.length; row++) {
        for (let col = 0; col < cols; col++) {
            const cellText = tableData[row][col];

            const textWidth = ctx.measureText(cellText).width;
            const totalWidth = textWidth + cellPadding * 2;
            if (totalWidth > colWidths[col]) {
                colWidths[col] = totalWidth;
            }
        }
    }
    return colWidths;
};

export const generateTableElement = (

    excalidrawAPI: ExcalidrawImperativeAPI, tableData: string[][],
    x: number, y: number, cellWidth: number, cellHeight: number) => {

    const appState = excalidrawAPI.getAppState();
    const { currentItemFontSize, currentItemFontFamily } = appState;

    const elements = excalidrawAPI.getSceneElements();
    const rows = tableData.length;
    const cols = tableData[0].length;
    const colWidths = calcColumnWidths(excalidrawAPI, tableData, 10);
    const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);

    const skeletonElements: ExcalidrawElementSkeleton[] = [];
    for (let row = 0; row < rows; row++) {
        const horizontalLineY = y + row * cellHeight;
        skeletonElements.push({
            type: "line",
            x: x,
            y: horizontalLineY,
            width: totalTableWidth,
            height: 0,
            strokeColor: "#000000",
            strokeWidth: 1,
            roughness: 0,
            seed: Math.floor(Math.random() * 100000),
            points: [
                [0, 0],
                [totalTableWidth, 0],
            ],
        });
    }

    const linePositions = [0,...colWidths];
    let xOffset = 0;
    for (let col = 0; col <= cols; col++) {
        xOffset += linePositions[col] || 0;
        console.log('Drawing vertical line at xOffset:', xOffset);
        const verticalLineX = x + xOffset;
        skeletonElements.push({
            type: "line",
            x: verticalLineX,
            y: y,
            width: 0,
            height: rows * cellHeight,
            strokeColor: "#000000",
            strokeWidth: 1,
            roughness: 0,
            seed: Math.floor(Math.random() * 100000),
            points: [
                [0, 0],
                [0, rows * cellHeight],
            ],
        });
    }

    console.log('Table grid lines generated:', skeletonElements);

    for (let row = 0; row < rows; row++) {
        let xOffset = 0;
        for (let col = 0; col < cols; col++) {
            xOffset += linePositions[col];
            const cellText = tableData[row][col];
            const textX = x + xOffset + 5;
            const textY = y + row * cellHeight + 5;

            skeletonElements.push({
                type: "text",
                x: textX,
                y: textY,
                // width: cellWidth - 10,
                // height: cellHeight - 10,
                strokeColor: "#000000",
                backgroundColor: "transparent",
                fillStyle: "hachure",
                strokeWidth: 1,
                roughness: 0,
                seed: Math.floor(Math.random() * 100000),
                text: cellText,
                fontSize: currentItemFontSize,
                fontFamily: currentItemFontFamily,
                textAlign: "left",
                verticalAlign: "top",
            });
        }
    }
    const tableElements = convertToExcalidrawElements(skeletonElements);
    console.log('Scene elements:', elements);
    console.log('Generated skeleton elements:', skeletonElements);
    console.log('Generated table elements:', tableElements);
    const newElements = elements.concat(tableElements);
    console.log('Updated scene elements:', newElements);
    excalidrawAPI.updateScene({ elements: newElements });

}

