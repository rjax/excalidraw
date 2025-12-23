import { generateTableElement } from "./tables";

export const useTables = () => {

  const handleBOMClick = (excalidrawAPI) => {
    const data = [
        ["Header 1", "Header 2", "Header 3"],
        ["Row 1 Col 1", "Row 1 Col 2 Let's see what happens when the text is really long", "Row 1 Col 3"],
        ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"],
    ];
    generateTableElement(excalidrawAPI, data, 0, 0, 100, 30);
    console.log('Scene elements:', data);
  }

    return {
    handleBOMClick,
  };
}