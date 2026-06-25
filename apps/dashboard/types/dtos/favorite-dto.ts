import { type ContactRecord } from '@prisma/client';

export type FavoriteDto = {
  id: string;
  order: number;
  contactId: string;
  name: string;
  record: ContactRecord;
  image?: string;
};
