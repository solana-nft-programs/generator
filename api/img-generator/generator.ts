import type * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import * as canvas from "canvas";

import { secondaryConnectionFor } from "../common/connection";
import type { TokenData } from "../common/tokenData";
import { getTokenData } from "../common/tokenData";
import { getTicketImage } from "./event-ticket-image";
import {
  drawBackgroundImage,
  drawDefaultBackground,
  drawLogo,
  drawShadow,
  drawText,
} from "./img-utils";
import { getJamboImage } from "./jambo-image";
import { getNamespaceImage } from "./namespace-image";
import { tryDrawStakedOverlay } from "./staked-token";

export async function getImage(
  mintIdParam: string,
  nameParam: string,
  imgUriParam: string,
  textParam: string,
  cluster: string | null
): Promise<Buffer> {
  console.log(
    `Handling img generatation for mintIdParam (${mintIdParam}) imgUriParam (${imgUriParam}) text (${textParam}) and cluster (${
      cluster ? cluster : ""
    })`
  );

  const connection = secondaryConnectionFor(cluster);
  let tokenData: TokenData = {};
  if (mintIdParam) {
    try {
      tokenData = await getTokenData(connection, new PublicKey(mintIdParam));
    } catch (e) {
      console.log(e);
    }
  }
  if (
    !tokenData.metaplexData &&
    !tokenData.certificateData &&
    !tokenData.tokenManagerData &&
    !tokenData.timeInvalidatorData &&
    !tokenData.useInvalidatorData &&
    cluster !== "devnet"
  ) {
    console.log("Falling back to devnet image");
    return getImage(mintIdParam, nameParam, imgUriParam, textParam, "devnet");
  }

  if (
    (tokenData?.metaplexData?.parsed.data.symbol === "NAME" ||
      tokenData?.metaplexData?.parsed.data.symbol === "TICKET" ||
      tokenData?.metaplexData?.parsed.data.symbol === "TIX") &&
    tokenData?.metaplexData?.parsed.data.name.startsWith("crd-")
  ) {
    return getTicketImage(tokenData);
  }

  if (
    tokenData?.metaplexData?.parsed.data.symbol === "NAME" ||
    (textParam && textParam.includes("@"))
  ) {
    return getNamespaceImage(tokenData, nameParam, textParam);
  }

  if (tokenData?.metaplexData?.parsed.data.symbol === "$JAMB") {
    return getJamboImage(tokenData, connection, textParam, imgUriParam);
  }

  if (tokenData?.metaplexData?.parsed.data.symbol.startsWith("POOl")) {
    const img = await tryDrawStakedOverlay(tokenData, imgUriParam);
    if (img) {
      return img;
    }
  }

  // setup
  const WIDTH = 250;
  const HEIGHT = 250;
  const imageCanvas = canvas.createCanvas(WIDTH, HEIGHT);

  // draw base image
  if (imgUriParam) {
    await drawBackgroundImage(imageCanvas, imgUriParam);
    if (textParam) {
      drawText(imageCanvas, textParam, {
        defaultStyle: "overlay",
      });
    }
  } else {
    drawDefaultBackground(imageCanvas);
    drawText(
      imageCanvas,
      textParam || tokenData?.metaplexData?.parsed?.data?.name || "",
      { defaultStyle: "none" }
    );
  }

  if (tokenData.tokenManagerData) {
    drawShadow(imageCanvas, tokenData.tokenManagerData.parsed.state);
  }

  await drawLogo(imageCanvas);

  // draw badges
  const PADDING = 0.05 * WIDTH;
  const bottomLeftCtx = imageCanvas.getContext("2d");
  bottomLeftCtx.textAlign = "left";
  let bottomLeft = PADDING * 1.5;

  canvas.registerFont(__dirname.concat("/fonts/SF-Pro.ttf"), {
    family: "SFPro",
  });
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

  return imageCanvas.toBuffer("image/png");
}
