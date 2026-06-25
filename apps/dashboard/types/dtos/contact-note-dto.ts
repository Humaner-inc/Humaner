export type ContactNoteDto = {
  id: string;
  contactId: string;
  text?: string;
  edited: boolean;
  createdAt: Date;
  updatedAt: Date;
  sender: {
    id: string;
    name: string;
    image?: string;
  };
};
