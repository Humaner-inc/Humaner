import { type ContactRecord } from '@prisma/client';

export type VisitedContactDto = {
  id: string;
  name: string;
  image?: string;
  record: ContactRecord;
  pageVisits: number;
};
