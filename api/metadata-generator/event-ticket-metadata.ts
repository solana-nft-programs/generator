export const getTicketMetadataLink = (ticketId: string) => {
  return `https://firebasestorage.googleapis.com/v0/b/cardinal-events.appspot.com/o/tickets%2F${ticketId}%2Fmetadata.json?alt=media`;
};
