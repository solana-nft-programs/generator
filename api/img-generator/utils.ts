import * as anchor from "@project-serum/anchor";
import * as metaplex from "@metaplex/js";
import * as certificates from "@cardinal/certificates";
import * as namespaces from "@cardinal/namespaces";
import * as web3 from "@solana/web3.js";
import * as fetch from "node-fetch";
import * as canvas from "canvas";
import * as splToken from "@solana/spl-token";
import BigNumber from "bignumber.js";
import { getTwitterImage } from "./twitter-image";
import { connectionFor } from "../common/connection";

function getMintDecimalAmount(mint, mintAmount) {
  return new BigNumber(mintAmount.toString()).shiftedBy(-mint.decimals);
}

function fmtMintAmount(mint, mintAmount) {
  return mint
    ? getMintDecimalAmount(mint, mintAmount).toFormat()
    : new BigNumber(mintAmount.toString()).toFormat();
}

function easeInOut(t) {
  return 4 * t * t * t;
  // return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
}

const COLOR_RED = "rgba(200, 0, 0, 1)";
const COLOR_ORANGE = "rgba(89, 56, 21, 1)";
const COLOR_GREEN = "rgba(39, 73, 22, 1)";

export async function getCertificateImage(
  mintId: string,
  imgUri: string,
  textParam: string,
  cluster: string | null
) {
  console.log(
    `Handling img generatation for mintId (${mintId}) imgUri (${imgUri}) text (${textParam}) and cluster (${cluster})`
  );

  const connection = connectionFor(cluster);

  let certificate = {};
  let originalMintUri = null;
  let name: string = "";
  let symbol: string = "";

  // fetch and set certificate data
  try {
    const [certificateId] = await certificates.certificateIdForMint(
      new web3.PublicKey(mintId)
    );
    const certificateData = await certificates.getCertificate(
      connection,
      certificateId
    );
    certificate = certificateData.parsed;
  } catch (e) {
    if (cluster !== "devnet") {
      console.log("Falling back to devnet metadata");
      return getCertificateImage(mintId, imgUri, textParam, "devnet");
    }
    console.log(`Error fetching certificate for mint (${mintId})`, e);
  }

  const {
    // @ts-ignore
    issuer,
    // @ts-ignore
    revokeAuthority,
    // @ts-ignore
    expiration,
    // @ts-ignore
    maxUsages,
    // @ts-ignore
    originalMint,
    // @ts-ignore
    isExtendable,
    // @ts-ignore
    isReturnable,
    // @ts-ignore
    usages,
    // @ts-ignore
    paymentAmount,
    // @ts-ignore
    paymentMint,
    // @ts-ignore
    state,
  } = certificate;

  // ovverride imageUri with imageUri if present
  if (originalMint) {
    try {
      const [metaplexId] = await web3.PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode(
            metaplex.programs.metadata.MetadataProgram.PREFIX
          ),
          metaplex.programs.metadata.MetadataProgram.PUBKEY.toBuffer(),
          originalMint.toBuffer(),
        ],
        metaplex.programs.metadata.MetadataProgram.PUBKEY
      );

      const metaplexData = await metaplex.programs.metadata.Metadata.load(
        connection,
        metaplexId
      );
      if (metaplexData.data.data.name) {
        name = metaplexData.data.data.name;
      }
      if (metaplexData.data.data.symbol) {
        symbol = metaplexData.data.data.symbol;
      }
      if (metaplexData.data.data.uri) {
        const metadata = await fetch(metaplexData.data.data.uri, {}).then((r) =>
          r.json()
        );
        originalMintUri = metadata.image;
      }
    } catch (e) {
      console.log(
        `Error fetching metaplex metadata for original mint (${originalMint})`,
        e
      );
    }
  } else {
    try {
      const [metaplexId] = await web3.PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode(
            metaplex.programs.metadata.MetadataProgram.PREFIX
          ),
          metaplex.programs.metadata.MetadataProgram.PUBKEY.toBuffer(),
          new web3.PublicKey(mintId).toBuffer(),
        ],
        metaplex.programs.metadata.MetadataProgram.PUBKEY
      );

      const metaplexData = await metaplex.programs.metadata.Metadata.load(
        connection,
        metaplexId
      );
      if (metaplexData.data.data.name) {
        name = metaplexData.data.data.name;
      }
      if (metaplexData.data.data.symbol) {
        symbol = metaplexData.data.data.symbol;
      }
    } catch (e) {
      console.log(
        `Error fetching metaplex metadata for original mint (${originalMint})`,
        e
      );
    }
  }

  const [namespace, entryName] = namespaces.breakName(name || textParam || "");
  if (namespace === "twitter") {
    return getTwitterImage(namespace, entryName);
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
  if (originalMintUri || imgUri) {
    const backgroundCtx = imageCanvas.getContext("2d");
    backgroundCtx.fillStyle = "rgba(26, 27, 32, 1)";
    backgroundCtx.fillRect(0, 0, WIDTH, HEIGHT);

    const img = await canvas.loadImage(originalMintUri || imgUri);
    const imgContext = imageCanvas.getContext("2d");
    if (img.height > img.width) {
      const imgHeightMultiplier = WIDTH / img.height;
      imgContext.drawImage(img, 0, 0, img.width * imgHeightMultiplier, HEIGHT);
    } else {
      const imgWidthMultiplier = HEIGHT / img.width;
      imgContext.drawImage(img, 0, 0, WIDTH, img.height * imgWidthMultiplier);
    }

    if (state != null) {
      // overlay
      // const overlayCtx = imageCanvas.getContext('2d')
      // const grd = overlayCtx.createLinearGradient(0, HEIGHT, 0, 0)
      // for (let t = 0.8; t >= 0.1; t -= 0.02) {
      //   // convert linear t to "easing" t:
      //   grd.addColorStop(t, 'rgba(26, 27, 32, ' + easeInOut(1 - t - 0.2) + ')')
      // }
      // overlayCtx.fillStyle = grd
      // overlayCtx.fillRect(0, 0, WIDTH, HEIGHT)

      // outline shadow
      const shadowCtx = imageCanvas.getContext("2d");
      if (
        state === certificates.CertificateState.Invalidated ||
        (maxUsages && usages >= maxUsages) ||
        (expiration && expiration.toNumber() <= Math.floor(Date.now() / 1000))
      ) {
        shadowCtx.shadowColor = COLOR_RED;
      } else if (state === certificates.CertificateState.Issued) {
        shadowCtx.shadowColor = COLOR_ORANGE;
      } else {
        shadowCtx.shadowColor = COLOR_GREEN;
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
      const logoCtx = imageCanvas.getContext("2d");
      const logo = await canvas.loadImage(
        __dirname.concat("/assets/cardinal-icon-colored-transparent.png")
      );
      logoCtx.drawImage(
        logo,
        HEIGHT - PADDING / 10 - HEIGHT * 0.2,
        WIDTH - PADDING / 10 - WIDTH * 0.2,
        WIDTH * 0.2,
        HEIGHT * 0.2
      );
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
    grd.addColorStop(0, "#ee7752");
    grd.addColorStop(0.4, "#e7cae4");
    grd.addColorStop(0.9, "#23a6d5");
    // grd.addColorStop(0, 'rgba(238, 119, 82, 0.8')
    // grd.addColorStop(0.4, 'rgba(231, 202 ,228 ,0.8')
    // grd.addColorStop(0.9, 'rgba(35, 166, 213, 0.8)')
    backgroundCtx.fillStyle = grd;
    backgroundCtx.fillRect(0, 0, WIDTH, HEIGHT);

    const nameCtx = imageCanvas.getContext("2d");
    nameCtx.font = `${0.1 * WIDTH}px SFPro`;
    nameCtx.fillStyle = "white";
    nameCtx.textAlign = "center";
    nameCtx.textBaseline = "middle";
    let nameText = textParam || name;
    if (symbol && symbol.includes("NAME") && nameText) {
      const [name, namespace] = nameText.split(".");
      nameText = namespaces.formatName(namespace, name);
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

  if (symbol && symbol.includes("$JAMB")) {
    bottomLeftCtx.font = `${0.055 * WIDTH}px SFPro`;
    bottomLeftCtx.fillStyle = "white";
    bottomLeftCtx.fillText("LEVEL 2", PADDING, HEIGHT - bottomLeft);
    bottomLeft += 0.075 * WIDTH;
  }

  if (expiration) {
    if (expiration.toNumber() <= Math.floor(Date.now() / 1000)) {
      const dateTime = new Date(expiration * 1000);
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
      const dateTime = new Date(expiration * 1000);
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

  if (maxUsages) {
    if (usages >= maxUsages) {
      bottomLeftCtx.font = `${0.055 * WIDTH}px SFPro`;
      bottomLeftCtx.fillStyle = "rgba(255,0,0,1)";
      bottomLeftCtx.fillText(
        `INVALID (${usages}/${maxUsages.toString()})`,
        PADDING,
        HEIGHT - bottomLeft
      );
      bottomLeft += 0.075 * WIDTH;
    } else {
      bottomLeftCtx.font = `${0.055 * WIDTH}px SFPro`;
      bottomLeftCtx.fillStyle = "white";
      bottomLeftCtx.fillText(
        `Used (${usages}/${maxUsages.toString()})`,
        PADDING,
        HEIGHT - bottomLeft
      );
      bottomLeft += 0.075 * WIDTH;
    }
  }

  if (!expiration && !maxUsages) {
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

  if (paymentMint && paymentAmount > 0) {
    const token = new splToken.Token(
      connection,
      paymentMint,
      splToken.TOKEN_PROGRAM_ID,
      // @ts-ignore -- unused
      null
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
  if (symbol && symbol.includes("NAME")) {
    const [namespace, entryName] = namespaces.breakName(name);
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
  } else {
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
  }

  const buffer = imageCanvas.toBuffer("image/png");
  return buffer;
}
