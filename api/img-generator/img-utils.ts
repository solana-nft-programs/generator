import { TokenManagerState } from "@cardinal/token-manager/dist/cjs/programs/tokenManager";
import * as canvas from "canvas";

const COLOR_RED = "rgba(200, 0, 0, 1)";
const COLOR_ORANGE = "rgba(89, 56, 21, 1)";
const COLOR_GREEN = "rgba(39, 73, 22, 1)";

const textStyles = ["none", "overlay", "banner"] as const;
type TextStyleOptions = {
  defaultStyle?: typeof textStyles[number];
  backgroundColor?: string;
  fillStyles?: string;
};

const getStyleAndText = (
  textParam: string,
  defaultStyle?: typeof textStyles[number]
) => {
  const match = textStyles.find((style) => style === textParam.split(":")[0]);
  if (match) {
    return [match, textParam.split(":")[1]];
  }
  return [defaultStyle || "none", textParam];
};

export const drawText = (
  imageCanvas: canvas.Canvas,
  textParam: string,
  styleOptions?: TextStyleOptions
) => {
  const nameCtx = imageCanvas.getContext("2d");
  const [style, text] = getStyleAndText(textParam, styleOptions?.defaultStyle);
  switch (style) {
    case "overlay":
      nameCtx.fillStyle = "rgba(180, 180, 180, 0.6)";
      nameCtx.fillRect(
        0.15 * imageCanvas.width,
        imageCanvas.height * 0.5 - 0.075 * imageCanvas.height,
        0.7 * imageCanvas.width,
        0.15 * imageCanvas.height
      );
      nameCtx.strokeStyle = "rgba(255, 255, 255, 1)";
      nameCtx.lineWidth = 0.015 * imageCanvas.width;
      nameCtx.strokeRect(
        0.15 * imageCanvas.width,
        imageCanvas.height * 0.5 - 0.075 * imageCanvas.height,
        0.7 * imageCanvas.width,
        0.15 * imageCanvas.height
      );

      nameCtx.font = `${0.075 * imageCanvas.width}px SFPro`;
      nameCtx.fillStyle = "white";
      nameCtx.textAlign = "center";
      nameCtx.textBaseline = "middle";
      nameCtx.fillText(text, imageCanvas.width * 0.5, imageCanvas.height * 0.5);
      return;
    case "banner":
      nameCtx.fillStyle = styleOptions?.backgroundColor ?? "rgba(0, 0, 0, 0)";
      nameCtx.fillRect(0, 0, imageCanvas.width, 0.2 * imageCanvas.height);
      nameCtx.font = `${0.075 * imageCanvas.width}px SFPro`;
      nameCtx.fillStyle = styleOptions?.fillStyles ?? "white";
      nameCtx.textAlign = "center";
      nameCtx.textBaseline = "middle";
      nameCtx.fillText(text, imageCanvas.width * 0.5, imageCanvas.width * 0.1);
      return;
    default:
      nameCtx.font = `${0.1 * imageCanvas.width}px SFPro`;
      nameCtx.fillStyle = "white";
      nameCtx.textAlign = "center";
      nameCtx.textBaseline = "middle";
      nameCtx.fillText(text, imageCanvas.width * 0.5, imageCanvas.height * 0.5);
      return;
  }
};

export const drawShadow = (
  imageCanvas: canvas.Canvas,
  tokenManagerState: TokenManagerState
) => {
  const shadowCtx = imageCanvas.getContext("2d");

  switch (tokenManagerState) {
    case TokenManagerState.Issued:
      shadowCtx.shadowColor = COLOR_ORANGE;
      break;
    case TokenManagerState.Invalidated:
      shadowCtx.shadowColor = COLOR_RED;
      break;
    default:
      shadowCtx.shadowColor = COLOR_GREEN;
  }

  shadowCtx.shadowBlur = 0.04 * imageCanvas.width;
  shadowCtx.lineWidth = 0.04 * imageCanvas.width;
  shadowCtx.strokeStyle = "rgba(26, 27, 32, 0)";
  shadowCtx.strokeRect(0, 0, imageCanvas.width, imageCanvas.height);
  shadowCtx.shadowBlur = 0;
};

export const drawLogo = async (
  imageCanvas: canvas.Canvas,
  paddingOverride?: number
) => {
  const padding = paddingOverride ?? 0.05 * imageCanvas.width;
  const logoCtx = imageCanvas.getContext("2d");
  const logo = await canvas.loadImage(
    __dirname.concat("/assets/cardinal-crosshair.png")
  );
  logoCtx.drawImage(
    logo,
    imageCanvas.height - padding / 1.5 - imageCanvas.height * 0.16,
    imageCanvas.width - padding / 1.5 - imageCanvas.width * 0.16,
    imageCanvas.width * 0.16,
    imageCanvas.height * 0.16
  );
};
