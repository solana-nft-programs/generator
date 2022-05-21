import * as certificates from "@cardinal/certificates";
import * as namespaces from "@cardinal/namespaces";
import { TokenManagerState } from "@cardinal/token-manager/dist/cjs/programs/tokenManager";
import type * as anchor from "@project-serum/anchor";
import * as splToken from "@solana/spl-token";
import * as web3 from "@solana/web3.js";
import * as canvas from "canvas";

import { connectionFor } from "../common/connection";
import type { TokenData } from "../common/tokenData";
import { getTokenData } from "../common/tokenData";
import { getJamboImage } from "./jambo-image";
import { getTwitterImage } from "./twitter-image";
import { fmtMintAmount } from "./utils";

const COLOR_RED = "rgba(200, 0, 0, 1)";
const COLOR_ORANGE = "rgba(89, 56, 21, 1)";
const COLOR_GREEN = "rgba(39, 73, 22, 1)";

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
    originalTokenData?.metaplexData?.data.data.name ||
    tokenData?.metaplexData?.data.data.name ||
    textParam;
  const [namespace, entryName] = namespaces.breakName(
    fullName || textParam || ""
  );
  if (namespace === "twitter") {
    return getTwitterImage(namespace, entryName);
  }

  if (tokenData?.metaplexData?.data.data.symbol === "$JAMB") {
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

    if (tokenData.certificateData || tokenData.tokenManagerData) {
      const shadowCtx = imageCanvas.getContext("2d");

      if (tokenData.tokenManagerData) {
        const state = tokenData.tokenManagerData?.parsed.state;
        if (state === TokenManagerState.Invalidated) {
          shadowCtx.shadowColor = COLOR_RED;
        } else if (state === TokenManagerState.Issued) {
          shadowCtx.shadowColor = COLOR_ORANGE;
        } else {
          shadowCtx.shadowColor = COLOR_GREEN;
        }
      } else {
        const state = tokenData.certificateData?.parsed.state;
        if (state === certificates.CertificateState.Invalidated) {
          shadowCtx.shadowColor = COLOR_RED;
        } else if (state === certificates.CertificateState.Issued) {
          shadowCtx.shadowColor = COLOR_ORANGE;
        } else {
          shadowCtx.shadowColor = COLOR_GREEN;
        }
      }

      // shadowCtx.shadowColor = 'rgba(25, 27, 32, 1)'
      // shadowCtx.shadowColor = certificate.state ? '#49aa19' : '#d87a16'
      shadowCtx.shadowBlur = 0.04 * WIDTH;
      shadowCtx.lineWidth = 0.04 * WIDTH;
      shadowCtx.strokeStyle = "rgba(26, 27, 32, 0)";
      shadowCtx.strokeRect(0, 0, WIDTH, HEIGHT);
      shadowCtx.shadowBlur = 0;

      // logo
      const logoCtx = imageCanvas.getContext("2d");
      const logo = await canvas.loadImage(
        __dirname.concat("/assets/cardinal-crosshair.png")
      );
      logoCtx.drawImage(
        logo,
        HEIGHT - PADDING / 1.5 - HEIGHT * 0.16,
        WIDTH - PADDING / 1.5 - WIDTH * 0.16,
        WIDTH * 0.16,
        HEIGHT * 0.16
      );
    } else {
      // const logoCtx = imageCanvas.getContext("2d");
      // const logo = await canvas.loadImage(
      //   __dirname.concat("/assets/cardinal-icon-colored-transparent.png")
      // );
      // logoCtx.drawImage(
      //   logo,
      //   HEIGHT - PADDING / 10 - HEIGHT * 0.2,
      //   WIDTH - PADDING / 10 - WIDTH * 0.2,
      //   WIDTH * 0.2,
      //   HEIGHT * 0.2
      // );
    }

    // name text
    if (textParam) {
      const nameCtx = imageCanvas.getContext("2d");
      nameCtx.fillStyle = "rgba(180, 180, 180, 0.6)";
      nameCtx.fillRect(
        0.15 * WIDTH,
        HEIGHT * 0.5 - 0.075 * HEIGHT,
        0.7 * WIDTH,
        0.15 * HEIGHT
      );
      nameCtx.strokeStyle = "rgba(255, 255, 255, 1)";
      nameCtx.lineWidth = 0.015 * WIDTH;
      nameCtx.strokeRect(
        0.15 * WIDTH,
        HEIGHT * 0.5 - 0.075 * HEIGHT,
        0.7 * WIDTH,
        0.15 * HEIGHT
      );

      nameCtx.font = `${0.075 * WIDTH}px SFPro`;
      nameCtx.fillStyle = "white";
      nameCtx.textAlign = "center";
      nameCtx.textBaseline = "middle";
      nameCtx.fillText(textParam, WIDTH * 0.5, HEIGHT * 0.5);
      nameCtx.textAlign = "left";
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

    const nameCtx = imageCanvas.getContext("2d");
    nameCtx.font = `${0.1 * WIDTH}px SFPro`;
    nameCtx.fillStyle = "white";
    nameCtx.textAlign = "center";
    nameCtx.textBaseline = "middle";
    const nameText =
      textParam || tokenData?.metaplexData?.data?.data?.name || "";
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
  }

  // const topRightCtx = imageCanvas.getContext('2d')
  // topRightCtx.textAlign = 'right'
  // topRightCtx.textBaseline = 'middle'
  // if (paymentMint && paymentAmount > 0) {
  //   topRightCtx.font = `${0.055 * WIDTH}px SFPro`
  //   topRightCtx.fillStyle = 'white'
  //   topRightCtx.fillText(
  //     `${paymentAmount} ${
  //       PAYMENT_MINTS.find(
  //         ({ mint }) => mint.toString() === paymentMint.toString()
  //       )?.symbol || paymentMint.toString()
  //     }`,
  //     WIDTH - PADDING,
  //     PADDING * 2
  //   )
  // }

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
