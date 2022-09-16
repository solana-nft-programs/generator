import { initializeApp } from "firebase/app";
import type { DocumentReference } from "firebase/firestore";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCJgPBVSp2TokeX_UpydLf4M7yamYA0nhs",
  authDomain: "cardinal-events.firebaseapp.com",
  projectId: "cardinal-events",
  storageBucket: "cardinal-events.appspot.com",
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
  creatorId: string;
  docId: string;
  environment: string;
  eventDescription: string;
  eventEndTime: string;
  eventLocation: string;
  eventName: string;
  eventStartTime: string;
  shortLink: string;
  eventBannerImage: string;
  eventPaymentMint: string;
};

export type FirebaseTicket = {
  docId: string;
  eventId: string;
  ticketId: string;
  ticketName: string;
  ticketQuantity: string;
  ticketShortLink: string;
  ticketPrice: string;
  additionalSigners?: string[];
  feePayer?: string;
};
