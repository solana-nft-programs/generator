import { TokenManagerState } from "@solana-nft-programs/token-manager/dist/cjs/programs/tokenManager";
import * as canvas from "canvas";

const COLOR_RED = "rgba(200, 0, 0, 1)";
const COLOR_ORANGE = "rgba(89, 56, 21, 1)";
const COLOR_GREEN = "rgba(39, 73, 22, 1)";

const textStyles = ["none", "overlay", "header"] as const;
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
  canvas.registerFont(__dirname.concat("/fonts/SF-Pro.ttf"), {
    family: "SFPro",
  });
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
    case "header":
      nameCtx.fillStyle = styleOptions?.backgroundColor ?? "rgba(0, 0, 0, 0)";
      nameCtx.fillRect(0, 0, imageCanvas.width, 0.2 * imageCanvas.height);
      nameCtx.font = `${0.075 * imageCanvas.width}px SFPro`;
      nameCtx.fillStyle = styleOptions?.fillStyles ?? "white";
      nameCtx.textAlign = "center";
      nameCtx.textBaseline = "middle";
      nameCtx.fillText(text, imageCanvas.width * 0.5, imageCanvas.width * 0.15);
      return;
    case "topRight":
      nameCtx.font = `${0.1 * imageCanvas.width}px SFPro`;
      nameCtx.fillStyle = "white";
      nameCtx.textAlign = "right";
      nameCtx.fillText(
        "#" + text,
        imageCanvas.width * 0.95,
        imageCanvas.height * 0.1
      );
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
  paddingOverride?: number,
  location?: "bottom-right" | "bottom-left",
  pctSize = 0.16
) => {
  const padding = paddingOverride ?? 0.05 * imageCanvas.width;
  const logoCtx = imageCanvas.getContext("2d");
  const logo = await canvas.loadImage(
    __dirname.concat("/assets/solana-nft-programs-crosshair.png")
  );
  logoCtx.drawImage(
    logo,
    location === "bottom-left"
      ? padding / 1.5
      : imageCanvas.width - padding / 1.5 - imageCanvas.width * pctSize,
    imageCanvas.height - padding / 1.5 - imageCanvas.height * pctSize,
    imageCanvas.width * pctSize,
    imageCanvas.height * pctSize
  );
};

export const drawDefaultBackground = (imageCanvas: canvas.Canvas) => {
  const backgroundCtx = imageCanvas.getContext("2d");
  const maxWidth =
    Math.sqrt(
      imageCanvas.width * imageCanvas.width +
        imageCanvas.height * imageCanvas.height
    ) / 2;
  const angle = 0.45;
  const grd = backgroundCtx.createLinearGradient(
    imageCanvas.width / 2 + Math.cos(angle) * maxWidth, // start pos
    imageCanvas.height / 2 + Math.sin(angle) * maxWidth,
    imageCanvas.width / 2 - Math.cos(angle) * maxWidth, // end pos
    imageCanvas.height / 2 - Math.sin(angle) * maxWidth
  );
  grd.addColorStop(0, "#4C1734");
  grd.addColorStop(1, "#000");
  backgroundCtx.fillStyle = grd;
  backgroundCtx.fillRect(0, 0, imageCanvas.width, imageCanvas.height);
};

export const drawBackgroundImage = async (
  imageCanvas: canvas.Canvas,
  imageUrl: string,
  fill = true
) => {
  const imgBackgroundCtx = imageCanvas.getContext("2d");

  if (fill) {
    imgBackgroundCtx.fillStyle = "rgba(26, 27, 32, 1)";
    imgBackgroundCtx.fillRect(0, 0, imageCanvas.width, imageCanvas.height);
  }

  const img = await canvas.loadImage(imageUrl);
  const imgContext = imageCanvas.getContext("2d");
  if (img.height > img.width) {
    const imgHeightMultiplier = imageCanvas.width / img.height;
    imgContext.drawImage(
      img,
      (imageCanvas.width - img.width * imgHeightMultiplier) / 2,
      0,
      img.width * imgHeightMultiplier,
      imageCanvas.height
    );
  } else {
    const imgWidthMultiplier = imageCanvas.height / img.width;
    imgContext.drawImage(
      img,
      0,
      (imageCanvas.height - img.height * imgWidthMultiplier) / 2,
      imageCanvas.width,
      img.height * imgWidthMultiplier
    );
  }
};
