import { breakIdentity, formatName } from "@solana-nft-programs/namespaces";
import * as canvas from "canvas";

import type { TokenData } from "../common/tokenData";
import {
  drawBackgroundImage,
  drawDefaultBackground,
  drawText,
} from "./img-utils";

const WIDTH = 500;
const HEIGHT = 500;

const IGNORE_TEXT = ["empiredao-registration", "EmpireDAO"];

export async function getNamespaceImage(
  tokenData: TokenData,
  nameParam: string | undefined,
  textParam: string | undefined
): Promise<Buffer> {
  const mintName = tokenData?.metaplexData?.parsed.data.name;
  const namespace =
    (nameParam && !tokenData?.metaplexData?.parsed.data.name?.includes(".")
      ? tokenData?.metaplexData?.parsed.data.name
      : breakIdentity(mintName || textParam || "")[0]) || "";
  const entryName = nameParam
    ? nameParam
    : breakIdentity(mintName || textParam || "")[1];

  console.log(`Drawing namespace image for [${entryName}, ${namespace}]`);
  const imageCanvas = canvas.createCanvas(WIDTH, HEIGHT);

  try {
    await drawBackgroundImage(
      imageCanvas,
      __dirname.concat(`/assets/namespaces/${namespace}.jpg`)
    );
  } catch (e) {
    console.log("Failed to draw background image: ", e);
    drawDefaultBackground(imageCanvas);
  }

  let topRightText: string | undefined;
  let nameText = decodeURIComponent(formatName(namespace, entryName));
  if (namespace === "discord") {
    const temp = nameText.split("#");
    nameText = temp.slice(0, -1).join();
    topRightText = temp.pop();
  }

  if (!IGNORE_TEXT.includes(namespace)) {
    const name = decodeURIComponent(formatName(namespace, entryName)).split(
      "#"
    )[0];
    drawText(imageCanvas, name);
  }

  if (topRightText) {
    const topRightCtx = imageCanvas.getContext("2d");
    topRightCtx.font = `${0.08 * WIDTH}px SFPro`;
    topRightCtx.fillStyle = "white";
    topRightCtx.textAlign = "right";
    topRightCtx.fillText("#" + topRightText, WIDTH * 0.95, HEIGHT * 0.1);
  }
  return imageCanvas.toBuffer("image/png");
}
