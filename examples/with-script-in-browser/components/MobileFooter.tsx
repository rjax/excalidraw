import React from "react";

import type * as TExcalidraw from "@rjax/excalidraw";
import type { ExcalidrawImperativeAPI } from "@rjax/excalidraw/types";

import CustomFooter from "./CustomFooter";

const MobileFooter = ({
  excalidrawAPI,
  excalidrawLib,
}: {
  excalidrawAPI: ExcalidrawImperativeAPI;
  excalidrawLib: typeof TExcalidraw;
}) => {
  const { useDevice, Footer } = excalidrawLib;

  const device = useDevice();
  if (device.editor.isMobile) {
    return (
      <Footer>
        <CustomFooter
          excalidrawAPI={excalidrawAPI}
          excalidrawLib={excalidrawLib}
        />
      </Footer>
    );
  }
  return null;
};
export default MobileFooter;
