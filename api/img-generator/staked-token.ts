import * as canvas from "canvas";

import type { TokenData } from "../common/tokenData";
import { drawBackgroundImage, drawLogo } from "./img-utils";

export async function tryDrawStakedOverlay(
  tokenData: TokenData,
  imgUri?: string
) {
  const WIDTH = 250;
  const HEIGHT = 250;
  const imageCanvas = canvas.createCanvas(WIDTH, HEIGHT);
  if (tokenData?.metaplexData?.parsed.data.symbol && imgUri) {
    try {
      await drawBackgroundImage(imageCanvas, imgUri);
      await drawBackgroundImage(
        imageCanvas,
        __dirname.concat(
          `/assets/staked-token-overlay/${tokenData?.metaplexData?.parsed.data.symbol}.png`
        ),
        false
      );
      await drawLogo(
        imageCanvas,
        0.125 * imageCanvas.width,
        "bottom-left",
        0.1
      );
      return imageCanvas.toBuffer("image/png");
    } catch (e) {
      console.log("Failed to staked overlay image: ", e);
    }
  }
}
