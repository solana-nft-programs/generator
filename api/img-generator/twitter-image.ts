import * as namespaces from "@cardinal/namespaces";
import * as canvas from "canvas";

const COLOR_TWITTER = "#1DA1F2";

export async function getTwitterImage(namespace: string, handle: string) {
  console.log("Rending twitter image");

  // setup
  canvas.registerFont(__dirname.concat("/fonts/SF-Pro.ttf"), {
    family: "SFPro",
  });
  const WIDTH = 500;
  const HEIGHT = 500;
  const PADDING = 0.05 * WIDTH;
  const imageCanvas = canvas.createCanvas(WIDTH, HEIGHT);

  // background
  const backgroundCtx = imageCanvas.getContext("2d");
  backgroundCtx.fillStyle = COLOR_TWITTER;
  backgroundCtx.fillRect(0, 0, WIDTH, HEIGHT);

  const nameCtx = imageCanvas.getContext("2d");
  nameCtx.font = `${0.1 * WIDTH}px SFPro`;
  nameCtx.fillStyle = "white";
  nameCtx.textAlign = "center";
  nameCtx.textBaseline = "middle";

  const nameText = namespaces.formatName(namespace, handle);
  nameCtx.fillText(nameText, WIDTH * 0.5, HEIGHT * 0.5);
  nameCtx.textAlign = "left";

  // logo
  const logoCtx = imageCanvas.getContext("2d");
  const logo = await canvas.loadImage(
    __dirname.concat("/assets/cardinal-crosshair.png")
  );
  logoCtx.drawImage(
    logo,
    HEIGHT - PADDING / 2 - HEIGHT * 0.18,
    WIDTH - PADDING / 2 - WIDTH * 0.18,
    WIDTH * 0.18,
    HEIGHT * 0.18
  );

  const bottomLeftCtx = imageCanvas.getContext("2d");
  bottomLeftCtx.textAlign = "left";
  let bottomLeft = PADDING * 1.5;

  bottomLeftCtx.font = `${0.055 * WIDTH}px SFPro`;
  bottomLeftCtx.fillStyle = "white";
  bottomLeftCtx.drawImage(
    await canvas.loadImage(__dirname.concat("/assets/infinity.png")),
    PADDING,
    HEIGHT - bottomLeft - 0.08 * WIDTH,
    0.15 * WIDTH,
    0.15 * WIDTH
  );
  bottomLeft += 0.075 * WIDTH;

  const topLextCtx = imageCanvas.getContext("2d");
  let topLeft = PADDING;
  if (namespace === "twitter") {
    topLextCtx.drawImage(
      await canvas.loadImage(
        __dirname.concat("/assets/twitter-white-logo.png")
      ),
      topLeft,
      PADDING,
      0.15 * WIDTH,
      0.15 * WIDTH
    );
    topLeft += 0.11 * WIDTH;
  }

  const buffer = imageCanvas.toBuffer("image/png");
  return buffer;
}
