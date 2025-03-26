// import { DEFAULT_CATEGORIES } from "./CommandPalette";
import type { CommandPaletteItem } from "./types";

// Default categories for commands fom CommandPalette.tsx
export const DEFAULT_CATEGORIES = {
    app: "App",
    export: "Export",
    tools: "Tools",
    editor: "Editor",
    elements: "Elements",
    links: "Links",
};

/**
 * Categories to exclude from the command palette
 */
export const EXCLUDED_CATEGORIES: string[] = [
    // DEFAULT_CATEGORIES.app,
    // DEFAULT_CATEGORIES.export,
    // DEFAULT_CATEGORIES.editor,
    // DEFAULT_CATEGORIES.tools,
    // DEFAULT_CATEGORIES.elements,
    DEFAULT_CATEGORIES.links,
];

/**
 * Command labels to exclude from the command palette
 * These should match exactly with the translated label text
 */
export const EXCLUDED_COMMANDS: string[] = [
    // "Group selection",
    // "Ungroup selection",
    // "Cut",
    // "Copy",
    // "Delete",
    // "Wrap selection in frame",
    // "Copy styles",
    // "Paste styles",
    // "Bring to front",
    // "Bring forward",
    // "Send backward",
    // "Send to back",
    // "Align top",
    // "Align bottom",
    // "Align left",
    // "Align right",
    // "Center vertically",
    // "Center horizontally",
    // "Duplicate",
    // "Flip horizontal",
    // "Flip vertical",
    // "Zoom to selection",
    // "Zoom to fit in viewport",
    // "Increase font size",
    // "Decrease font size",
    // "Edit line",
    // "Crop image",
    // "Add link",
    // "Copy link to object",
    // "Link to object",
    // "Undo",
    // "Redo",
    // "Zoom in",
    // "Zoom out",
    // "Reset zoom",
    // "Zoom to fit all elements",
    // "Zen mode",
    // "View mode",
    // "Toggle grid",
    // "Snap to objects",
    // "Shortcuts & help",
    // "Select all",
    // "Lock all",
    // "Unlock all",
    // "Canvas & Shape properties",
    // "Clear canvas",
    // "Export image...",
    // "Save to current file",
    // "Save to disk",
    // "Copy to clipboard as PNG",
    // "Copy to clipboard as SVG",
    // "Library",
    // "Find on canvas",
    // "Change stroke color",
    // "Change background color",
    // "Canvas background",
    // "Selection",
    // "Rectangle",
    // "Diamond",
    // "Ellipse",
    // "Arrow",
    // "Line",
    // "Draw",
    // "Text",
    // "Insert image",
    // "Eraser",
    // "Hand (panning tool)",
    // "Frame tool",
    // "Keep selected tool active after drawing",
    "Text to diagram...",
    "Mermaid to Excalidraw...",
    "Live collaboration...",
    // "Stop session",
    "Share",
    "GitHub",
    "Follow us",
    "Discord chat",
    "YouTube",
    "Excalidraw+",
    "Sign up",
    "Export to Excalidraw+",
    // "Toggle theme",
    "Install Excalidraw locally (PWA)"
];

/**
 * Function to check if a command should be included in the palette
 */
export const shouldIncludeCommand = (command: CommandPaletteItem): boolean => {

    console.log(command);
    // Exclude by category
    if (EXCLUDED_CATEGORIES.includes(command.category)) {
        return false;
    }

    // Exclude by label
    if (EXCLUDED_COMMANDS.includes(command.label)) {
        return false;
    }

    return true;
};