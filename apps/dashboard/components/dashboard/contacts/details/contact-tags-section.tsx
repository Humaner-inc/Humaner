'use client';

import * as React from 'react';
import { type SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';

import { updateContactTags } from '@/actions/contacts/update-contact-tags';
import {
  FormControl,
  FormField,
  FormItem,
  FormProvider
} from '@/components/ui/form';
import { TagInput } from '@/components/ui/tag-input';
import { useZodForm } from '@/hooks/use-zod-form';
import {
  UpdateContactTagsSchema,
  updateContactTagsSchema
} from '@/schemas/contacts/update-contact-tags-schema';
import type { ContactDto } from '@/types/dtos/contact-dto';

export type ContactTagsSectionProps =
  React.HtmlHTMLAttributes<HTMLDivElement> & {
    contact: ContactDto;
  };

export function ContactTagsSection({
  contact,
  ...other
}: ContactTagsSectionProps): React.JSX.Element {
  const methods = useZodForm({
    schema: updateContactTagsSchema,
    mode: 'all',
    defaultValues: {
      id: contact.id,
      tags: contact.tags
    }
  });
  const onSubmit: SubmitHandler<UpdateContactTagsSchema> = async (values) => {
    const result = await updateContactTags(values);
    if (!result?.serverError && !result?.validationErrors) {
      toast.success('Tags updated');
    } else {
      toast.error("Couldn't update tags");
    }
  };
  return (
    <FormProvider {...methods}>
      <section {...other}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div className="flex h-16 flex-row items-center p-6">
            <h3 className="text-sm font-semibold tracking-tight">Tags</h3>
          </div>
          <div className="p-6 pt-0">
            <FormField
              name="tags"
              control={methods.control}
              render={({ field }) => (
                <FormItem className="flex flex-col gap-4">
                  <FormControl>
                    <TagInput
                      {...field}
                      allowDuplicates={false}
                      inputFieldPosition="top"
                      placeholder="Type your tag and press enter"
                      tags={field.value}
                      onTagsChange={(values) => {
                        field.onChange(values);
                        onSubmit(methods.getValues());
                      }}
                      size="sm"
                      variant="default"
                      shape="rounded"
                      borderStyle="default"
                      textCase={null}
                      textStyle="normal"
                      animation="fadeIn"
                      direction="row"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </form>
      </section>
    </FormProvider>
  );
}
