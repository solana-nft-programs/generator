import { initializeApp } from "firebase/app";
import type { DocumentReference } from "firebase/firestore";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCJgPBVSp2TokeX_UpydLf4M7yamYA0nhs",
  authDomain: "solana-nft-programs-events.firebaseapp.com",
  projectId: "solana-nft-programs-events",
  storageBucket: "solana-nft-programs-events.appspot.com",
  messagingSenderId: "453139651235",
  appId: "1:453139651235:web:67443d5b218b600e7f3d16",
  measurementId: "G-R9SVMD5CRT",
};

export const firebaseEventApp = initializeApp(firebaseConfig);
export const eventFirestore = getFirestore(firebaseEventApp);
export const eventStorage = getStorage(firebaseEventApp);

export const getTicketRef = (
  eventDocumentId?: string,
  ticketDocumentId?: string
): DocumentReference => {
  if (ticketDocumentId) {
    return doc(eventFirestore, "tickets", ticketDocumentId);
  }

  if (!eventDocumentId) {
    throw "No event id passed in";
  }
  const generatedTicketId = `crd-${eventDocumentId}-${
    Math.floor(Math.random() * 90000) + 10000
  }`;
  return doc(eventFirestore, "tickets", generatedTicketId);
};

export const tryGetEventTicket = async (
  ticketDocId: string
): Promise<FirebaseTicket | undefined> => {
  const ticketRef = getTicketRef(undefined, ticketDocId);
  const ticketSnap = await getDoc(ticketRef);
  if (ticketSnap.exists()) {
    return ticketSnap.data() as FirebaseTicket;
  } else {
    return undefined;
  }
};

export const tryGetEvent = async (
  docId: string
): Promise<FirebaseEvent | undefined> => {
  const eventRef = doc(eventFirestore, "events", docId);
  const eventsSnap = await getDoc(eventRef);
  if (!eventsSnap.exists()) {
    return undefined;
  }
  return eventsSnap.data() as FirebaseEvent;
};


export type FirebaseEvent = {
  bannerImage: string | null;
  config: string | null;
  creatorAddress: string;
  description: string;
  docId: string;
  endTime: string;
  environment: string;
  location: string;
  name: string;
  paymentMint: string;
  shortLink: string;
  startTime: string;
  questions: string[];
  timezone?: string;
};

export type FirebaseTicket = {
  additionalSigners: string[] | null;
  description: string | null;
  docId: string;
  eventId: string;
  feePayer: string | null;
  name: string;
  price: number;
  paymentMint: string | null;
  quantity: number;
  ticketSignerAddress: string;
  ticketSignerId: string;
  totalClaimed: number;

  allowedCollections: string[] | null;
  allowedVerifiedCreators: string[] | null;
  allowedMints: string[] | null;

  verifiedTokenMaximum: number | null;
  approverAddressMaximum: number | null;
  approverEmailMaximum: number | null;
  claimerAddressMaximum: number | null;

  includeQRCode: boolean;
};
