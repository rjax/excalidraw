import { Footer } from "@excalidraw/excalidraw/index";
import React from "react";

import { isExcalidrawPlusSignedUser } from "../app_constants";

import { DebugFooter, isVisualDebuggerEnabled } from "./DebugCanvas";
import { EncryptedIcon } from "./EncryptedIcon";
import { ExcalidrawPlusAppLink } from "./ExcalidrawPlusAppLink";
import { WidthControl } from "./Custom/WidthControl";

export const AppFooter = React.memo(
  ({
    onChange,
    excalidrawAPI,
  }: {
    onChange: () => void;
    excalidrawAPI: any;
  }) => {
    return (
      <Footer>
        <div
          style={{
            display: "flex",
            gap: ".5rem",
            alignItems: "center",
          }}
        >
          {isVisualDebuggerEnabled() && <DebugFooter onChange={onChange} />}
          {isExcalidrawPlusSignedUser ? (
            <ExcalidrawPlusAppLink />
          ) : (
            <EncryptedIcon />
          )}
          <WidthControl
            onChange={(value) => {
              // Add any additional handling here
              onChange();
            }}
            excalidrawAPI={excalidrawAPI}
          />
        </div>
      </Footer>
    );
  },
);
