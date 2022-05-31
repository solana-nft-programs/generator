import * as certificates from "@cardinal/certificates";
import * as namespaces from "@cardinal/namespaces";
import type * as anchor from "@project-serum/anchor";
import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import * as canvas from "canvas";

import { connectionFor } from "../common/connection";
import type { TokenData } from "../common/tokenData";
import { getTokenData } from "../common/tokenData";
import { drawLogo, drawShadow, drawText } from "./img-utils";
import { getJamboImage } from "./jambo-image";
import { getTwitterImage } from "./twitter-image";
import { fmtMintAmount } from "./utils";

export async function getImage(
  mintId: string,
  imgUri: string,
  textParam: string,
  cluster: string | null
): Promise<Buffer> {
  console.log(
    `Handling img generatation for mintId (${mintId}) imgUri (${imgUri}) text (${textParam}) and cluster (${
      cluster ? cluster : ""
    })`
  );

  const connection = connectionFor(cluster);
  let tokenData: TokenData = {};
  try {
    tokenData = await getTokenData(connection, new web3.PublicKey(mintId));
  } catch (e) {
    console.log(e);
  }
  if (
    !tokenData.certificateData &&
    !tokenData.tokenManagerData &&
    !tokenData.timeInvalidatorData &&
    !tokenData.useInvalidatorData &&
    cluster !== "devnet"
  ) {
    console.log("Falling back to devnet metadata");
    return getImage(mintId, imgUri, textParam, "devnet");
  }

  const originalMint = tokenData?.certificateData?.parsed
    .originalMint as web3.PublicKey;
  let originalTokenData: TokenData | null = null;

  // ovverride uri with originalMint uri if present
  if (originalMint) {
    try {
      originalTokenData = await getTokenData(connection, originalMint, true);
    } catch (e) {
      console.log(
        `Error fetching metaplex metadata for original mint (${originalMint.toString()})`,
        e
      );
    }
  }

  const fullName =
    originalTokenData?.metaplexData?.parsed.data.name ||
    tokenData?.metaplexData?.parsed.data.name ||
    textParam;
  const [namespace, entryName] = namespaces.breakName(
    fullName || textParam || ""
  );
  if (namespace === "twitter") {
    return getTwitterImage(namespace, entryName);
  }

  if (tokenData?.metaplexData?.parsed.data.symbol === "$JAMB") {
    return getJamboImage(
      originalTokenData,
      connection,
      originalMint,
      textParam,
      imgUri
    );
  }

  // setup
  // overlay text
  canvas.registerFont(__dirname.concat("/fonts/SF-Pro.ttf"), {
    family: "SFPro",
  });
  const WIDTH = 250;
  const HEIGHT = 250;
  const PADDING = 0.05 * WIDTH;
  const imageCanvas = canvas.createCanvas(WIDTH, HEIGHT);

  // draw base image
  const baseImgUri = originalTokenData?.metadata?.data.image || imgUri;
  if (baseImgUri) {
    const backgroundCtx = imageCanvas.getContext("2d");
    backgroundCtx.fillStyle = "rgba(26, 27, 32, 1)";
    backgroundCtx.fillRect(0, 0, WIDTH, HEIGHT);

    const img = await canvas.loadImage(baseImgUri);
    const imgContext = imageCanvas.getContext("2d");
    if (img.height > img.width) {
      const imgHeightMultiplier = WIDTH / img.height;
      imgContext.drawImage(
        img,
        (WIDTH - img.width * imgHeightMultiplier) / 2,
        0,
        img.width * imgHeightMultiplier,
        HEIGHT
      );
    } else {
      const imgWidthMultiplier = HEIGHT / img.width;
      imgContext.drawImage(
        img,
        0,
        (HEIGHT - img.height * imgWidthMultiplier) / 2,
        WIDTH,
        img.height * imgWidthMultiplier
      );
    }

    // name text
    if (textParam) {
      drawText(imageCanvas, textParam, {
        defaultStyle: "overlay",
      });
    }

    if (tokenData.tokenManagerData) {
      drawShadow(imageCanvas, tokenData.tokenManagerData.parsed.state);
      await drawLogo(imageCanvas);
    }
  } else {
    // background
    const backgroundCtx = imageCanvas.getContext("2d");
    const maxWidth = Math.sqrt(WIDTH * WIDTH + HEIGHT * HEIGHT) / 2;
    const angle = 0.45;
    const grd = backgroundCtx.createLinearGradient(
      WIDTH / 2 + Math.cos(angle) * maxWidth, // start pos
      HEIGHT / 2 + Math.sin(angle) * maxWidth,
      WIDTH / 2 - Math.cos(angle) * maxWidth, // end pos
      HEIGHT / 2 - Math.sin(angle) * maxWidth
    );
    grd.addColorStop(0, "#4C1734");
    grd.addColorStop(1, "#000");
    backgroundCtx.fillStyle = grd;
    backgroundCtx.fillRect(0, 0, WIDTH, HEIGHT);

    drawText(
      imageCanvas,
      textParam || tokenData?.metaplexData?.parsed?.data?.name || "",
      { defaultStyle: "none" }
    );

    await drawLogo(imageCanvas);
  }

  const bottomLeftCtx = imageCanvas.getContext("2d");
  bottomLeftCtx.textAlign = "left";
  let bottomLeft = PADDING * 1.5;

  const expiration =
    tokenData.timeInvalidatorData?.parsed?.expiration ||
    (tokenData?.certificateData?.parsed?.expiration as anchor.BN | null);
  if (expiration) {
    if (expiration.toNumber() <= Math.floor(Date.now() / 1000)) {
      const dateTime = new Date(expiration.toNumber() * 1000);
      bottomLeftCtx.font = `${0.055 * WIDTH}px SFPro`;
      bottomLeftCtx.fillStyle = "rgba(255,0,0,1)";
      bottomLeftCtx.fillText(
        `INVALID ${dateTime.toLocaleDateString(["en-US"], {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
        })} ${dateTime.toLocaleTimeString(["en-US"], {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
          timeZoneName: "short",
        })}`,
        PADDING,
        HEIGHT - bottomLeft
      );
    } else {
      const dateTime = new Date(expiration.toNumber() * 1000);
      bottomLeftCtx.font = `${0.055 * WIDTH}px SFPro`;
      bottomLeftCtx.fillStyle = "white";
      bottomLeftCtx.fillText(
        `${dateTime.toLocaleDateString(["en-US"], {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
        })} ${dateTime.toLocaleTimeString(["en-US"], {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
          timeZoneName: "short",
        })}`,
        PADDING,
        HEIGHT - bottomLeft
      );
    }
    bottomLeft += 0.075 * WIDTH;
  }

  const durationSeconds =
    tokenData.timeInvalidatorData?.parsed?.durationSeconds;
  if (durationSeconds && durationSeconds.toNumber()) {
    const dateTime = new Date(
      (Date.now() / 1000 + durationSeconds.toNumber()) * 1000
    );
    bottomLeftCtx.font = `${0.055 * WIDTH}px SFPro`;
    bottomLeftCtx.fillStyle = "white";
    bottomLeftCtx.fillText(
      `${dateTime.toLocaleDateString(["en-US"], {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
      })} ${dateTime.toLocaleTimeString(["en-US"], {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
        timeZoneName: "short",
      })}`,
      PADDING,
      HEIGHT - bottomLeft
    );
    bottomLeft += 0.075 * WIDTH;
  }

  const usages =
    tokenData.useInvalidatorData?.parsed?.usages ||
    tokenData?.certificateData?.parsed?.usages;
  const maxUsages =
    tokenData.useInvalidatorData?.parsed?.maxUsages ||
    (tokenData?.certificateData?.parsed?.maxUsages as anchor.BN | null);
  if (usages) {
    if (maxUsages && usages >= maxUsages) {
      bottomLeftCtx.font = `${0.055 * WIDTH}px SFPro`;
      bottomLeftCtx.fillStyle = "rgba(255,0,0,1)";
      bottomLeftCtx.fillText(
        `INVALID (${usages.toNumber()}/${maxUsages.toString()})`,
        PADDING,
        HEIGHT - bottomLeft
      );
      bottomLeft += 0.075 * WIDTH;
    } else {
      bottomLeftCtx.font = `${0.055 * WIDTH}px SFPro`;
      bottomLeftCtx.fillStyle = "white";
      bottomLeftCtx.fillText(
        `Used (${usages.toNumber()}${
          maxUsages ? `/${maxUsages.toString()}` : ""
        })`,
        PADDING,
        HEIGHT - bottomLeft
      );
      bottomLeft += 0.075 * WIDTH;
    }
  }

  // if (!expiration && !maxUsages) {
  //   bottomLeftCtx.font = `${0.055 * WIDTH}px SFPro`;
  //   bottomLeftCtx.fillStyle = "white";
  //   bottomLeftCtx.drawImage(
  //     await canvas.loadImage(__dirname.concat("/assets/infinity.png")),
  //     PADDING,
  //     HEIGHT - bottomLeft - 0.08 * WIDTH,
  //     0.15 * WIDTH,
  //     0.15 * WIDTH
  //   );
  //   bottomLeft += 0.075 * WIDTH;
  // }

  const paymentMint = tokenData?.certificateData?.parsed
    ?.paymentMint as web3.PublicKey;
  const paymentAmount = tokenData?.certificateData?.parsed
    .paymentAmount as anchor.BN | null;
  if (paymentMint && paymentAmount && paymentAmount?.toNumber() > 0) {
    const token = new splToken.Token(
      connection,
      paymentMint,
      splToken.TOKEN_PROGRAM_ID,
      web3.Keypair.generate() // not used
    );
    const mintInfo = await token.getMintInfo();
    bottomLeftCtx.font = `${0.055 * WIDTH}px SFPro`;
    bottomLeftCtx.fillStyle = "white";
    bottomLeftCtx.fillText(
      `${fmtMintAmount(mintInfo, paymentAmount)} ${
        certificates.PAYMENT_MINTS.find(
          ({ mint }) => mint.toString() === paymentMint.toString()
        )?.symbol || paymentMint.toString()
      }`,
      PADDING,
      HEIGHT - bottomLeft
    );
    bottomLeft += 0.075 * WIDTH;
  }

  const topLextCtx = imageCanvas.getContext("2d");
  let topLeft = PADDING;

  const revokeAuthority = tokenData?.certificateData?.parsed?.revokeAuthority;
  if (revokeAuthority) {
    topLextCtx.drawImage(
      await canvas.loadImage(__dirname.concat("/assets/revocable.png")),
      topLeft,
      PADDING * 1.2,
      0.08 * WIDTH,
      0.08 * WIDTH
    );
    topLeft += 0.11 * WIDTH;
  }

  const isExtendable = tokenData?.certificateData?.parsed?.isExtendable;
  if (isExtendable && expiration) {
    topLextCtx.drawImage(
      await canvas.loadImage(__dirname.concat("/assets/extendable.png")),
      topLeft,
      PADDING * 1.2,
      0.08 * WIDTH,
      0.08 * WIDTH
    );
    topLeft += 0.11 * WIDTH;
  }

  const isReturnable = tokenData?.certificateData?.parsed?.isReturnable;
  if (isReturnable) {
    topLextCtx.drawImage(
      await canvas.loadImage(__dirname.concat("/assets/returnable.png")),
      topLeft,
      PADDING,
      0.1 * WIDTH,
      0.1 * WIDTH
    );
    topLeft += 0.11 * WIDTH;
  }
  return imageCanvas.toBuffer("image/png");
}
