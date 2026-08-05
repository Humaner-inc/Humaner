import { z } from 'zod';

export const leaveOrganizationSchema = z.object({
  statement: z.coerce
    .boolean()
    .refine((value) => value === true, 'Confirmation is required.')
});

export type LeaveOrganizationSchema = z.infer<typeof leaveOrganizationSchema>;
