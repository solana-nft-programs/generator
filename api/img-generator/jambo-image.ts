import * as questPool from "@solana-nft-programs/quest-pool";
import * as stakePool from "@solana-nft-programs/stake-pool";
import { getLevelNumber } from "@solana-nft-programs/stake-pool";
import { BN } from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import * as canvas from "canvas";

import type { TokenData } from "../common/tokenData";
import { getTokenData } from "../common/tokenData";

export async function getJamboImage(
  tokenData: TokenData,
  connection: web3.Connection,
  textParam?: string,
  imgUri?: string
) {
  console.log("Rendering jambo image");
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

  canvas.registerFont(__dirname.concat("/fonts/SF-Pro.ttf"), {
    family: "SFPro",
  });
  const WIDTH = 250;
  const HEIGHT = 250;
  const imageCanvas = canvas.createCanvas(WIDTH, HEIGHT);
  const GROUP_AND_HUNGRY_THRESHOLD = 10000;

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
  }
  // overlay
  const overlayCtx = imageCanvas.getContext("2d");
  overlayCtx.fillStyle = "rgba(26, 27, 32, 0.3)";
  overlayCtx.fillRect(0, 0, WIDTH, HEIGHT);
  // // logo
  // const logoCtx = imageCanvas.getContext("2d");
  // logoCtx.drawImage(
  //   logo,
  //   HEIGHT - PADDING / 1.5 - HEIGHT * 0.16,
  //   WIDTH - PADDING / 1.5 - WIDTH * 0.16,
  //   WIDTH * 0.16,
  //   HEIGHT * 0.16
  // );

  // date
  const dateCtx = imageCanvas.getContext("2d");
  const UTCNow = Date.now() / 1000;
  dateCtx.font = "500 15px SFPro";
  dateCtx.fillStyle = "white";
  if (textParam === "TRAINING") {
    const entry = await stakePool.getStakeEntry(connection, originalMint);
    const lastStakedAt = entry?.parsed.lastStakedAt.toNumber() || UTCNow;
    const stakeBoost = (entry?.parsed.stakeBoost || new BN(1)).toNumber();
    const totalStakeSeconds = (
      entry?.parsed.totalStakeSeconds || new BN(0)
    ).toNumber();
    const stakedTime =
      totalStakeSeconds +
      (stakeBoost / (stakeBoost >= GROUP_AND_HUNGRY_THRESHOLD ? 10000 : 100)) *
        (UTCNow - lastStakedAt);

    const [level, requiredSeconds] = getLevelNumber(stakedTime);
    const levelUpDate = new Date(
      (UTCNow + (requiredSeconds - stakedTime)) * 1000
    );
    const date = levelUpDate.toLocaleDateString().split("/");
    const time = levelUpDate.toTimeString().split(":");
    dateCtx.fillText(
      `Level ${level + 1} on ${date[0]}/${date[1]}/${date[2].substring(
        date[2].length - 2,
        date[2].length
      )} ${time[0]}:${time[1]} GMT`,
      30,
      20
    );
  } else {
    const [questEntryId] = await questPool.findQuestEntryId(
      new web3.PublicKey(originalMint)
    );
    const entry = (
      await questPool.getQuestEntries(connection, [questEntryId])
    )[0];
    try {
      const pool = (
        await questPool.getQuestPools(connection, [
          new web3.PublicKey(entry.parsed.stakePool.toString()),
        ])
      )[0];
      const questStart = entry?.parsed.questStart.toNumber() || UTCNow;
      const questDuration = pool.parsed.rewardDurationSeconds.toNumber();
      const questEnd = new Date(
        (UTCNow + (questDuration - (UTCNow - questStart))) * 1000
      );
      const date = questEnd.toLocaleDateString().split("/");
      const time = questEnd.toTimeString().split(":");
      dateCtx.fillText(
        `Claimable on ${date[0]}/${date[1]}/${date[2].substring(
          date[2].length - 2,
          date[2].length
        )} ${time[0]}:${time[1]} GMT`,
        20,
        20
      );
    } catch (e) {
      console.log(e);
    }
  }

  const nameCtx = imageCanvas.getContext("2d");
  const textImageUrl = textParam === "TRAINING" ? "TRAINING" : "HUNTING";
  const textImage = await canvas.loadImage(
    __dirname.concat(`/assets/jambo/${textImageUrl}.png`)
  );
  nameCtx.drawImage(
    textImage,
    WIDTH * 0.1,
    HEIGHT * 0.4,
    WIDTH * 0.8,
    WIDTH * 0.2
  );

  return imageCanvas.toBuffer("image/png");
}
