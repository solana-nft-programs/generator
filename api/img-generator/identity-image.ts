import { formatName, IDENTITIES } from "@cardinal/namespaces";
import * as canvas from "canvas";

const IDENTITY_COLORS: { [key: string]: string } = {
  twitter: "#1DA1F2",
  discord: "#5866f2",
};

export async function getIdentityImage(
  namespace: string,
  handle: string,
  proxy?: boolean
) {
  console.log(`Rendering ${namespace} image`);

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
  backgroundCtx.fillStyle = IDENTITY_COLORS[namespace];
  backgroundCtx.fillRect(0, 0, WIDTH, HEIGHT);

  const nameCtx = imageCanvas.getContext("2d");
  nameCtx.font = `${0.1 * WIDTH}px SFPro`;
  nameCtx.fillStyle = "white";
  nameCtx.textAlign = "center";
  nameCtx.textBaseline = "middle";

  let nameText = decodeURIComponent(formatName(namespace, handle));
  let topRightText: string | undefined;
  if (namespace === "discord") {
    const temp = nameText.split("#");
    nameText = temp.slice(0, -1).join();
    topRightText = temp.pop();
  }
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

  if (!proxy) {
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
  }

  const topLeftCtx = imageCanvas.getContext("2d");
  let topLeft = PADDING;
  if (IDENTITIES.includes(namespace)) {
    if (namespace === "twitter") {
      topLeftCtx.drawImage(
        await canvas.loadImage(
          __dirname.concat("/assets/twitter-white-logo.png")
        ),
        topLeft,
        PADDING,
        0.15 * WIDTH,
        0.15 * HEIGHT
      );
    } else if (namespace === "discord") {
      topLeftCtx.drawImage(
        await canvas.loadImage(__dirname.concat("/assets/discord-logo.png")),
        topLeft,
        PADDING,
        0.15 * WIDTH,
        0.12 * HEIGHT
      );
    }
    topLeft += 0.11 * WIDTH;
  }

  if (topRightText) {
    const topRightCtx = imageCanvas.getContext("2d");
    topRightCtx.font = `${0.08 * WIDTH}px SFPro`;
    topRightCtx.fillStyle = "white";
    topRightCtx.textAlign = "right";
    topRightCtx.fillText("#" + topRightText, WIDTH * 0.95, HEIGHT * 0.1);
  }

  const buffer = imageCanvas.toBuffer("image/png");
  return buffer;
}
