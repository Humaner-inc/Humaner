'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, SearchIcon } from '@humaner/shared/icons';
import { AddressBook } from '@phosphor-icons/react/dist/ssr/AddressBook';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import {
  addContact,
  deleteContact,
  getContactHistory,
  updateContact
} from '@/actions/contacts/manage-contacts';
import { PresentationPageMark } from '@/components/dashboard/workspace-page-shell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Routes } from '@/constants/routes';
import type { ContactListItem } from '@/data/contacts/get-contacts';
import {
  companyDomainFromEmail,
  companyFromEmail
} from '@/lib/contacts/contact-email';
import type { ContactHistoryThread } from '@/lib/contacts/contact-history';
import { dashboardSurfaceClassName } from '@/lib/dashboard/surface-styles';
import { HUMANER_NAV_COLORS } from '@/lib/humaner-nav-colors';
import { getLogoUrl } from '@/lib/logo';
import { cn, getInitials } from '@/lib/utils';

function playReveal(el: HTMLElement, start: number | null): void {
  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  el.style.transition = 'none';
  el.style.height = 'auto';
  const target = el.offsetHeight;

  if (start === null || reduceMotion || Math.abs(start - target) < 0.5) {
    el.style.height = 'auto';
    el.style.opacity = '1';
    el.style.filter = 'blur(0px)';
    return;
  }

  el.style.height = `${start}px`;
  el.style.opacity = '0';
  el.style.filter = 'blur(2px)';
  void el.offsetHeight;
  el.style.transition = '';
  el.style.height = `${target}px`;
  el.style.opacity = '1';
  el.style.filter = 'blur(0px)';

  const done = (event: TransitionEvent) => {
    if (event.propertyName !== 'height' || event.target !== el) return;
    el.style.height = 'auto';
    el.removeEventListener('transitionend', done);
  };
  el.addEventListener('transitionend', done);
}

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

function ContactAvatar({
  contact,
  className
}: {
  contact: Pick<ContactListItem, 'name' | 'email' | 'image'>;
  className?: string;
}): React.JSX.Element {
  const domain = companyDomainFromEmail(contact.email);
  const src = contact.image || (domain ? getLogoUrl(domain, 128) : null);

  return (
    <Avatar className={cn('size-9 rounded-md', className)}>
      {src ? (
        <AvatarImage
          src={src}
          alt=""
        />
      ) : null}
      <AvatarFallback className="rounded-md text-[10px]">
        {getInitials(contact.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function ContactsBrowser({
  contacts: initialContacts,
  businessName
}: {
  contacts: ContactListItem[];
  businessName: string;
}): React.JSX.Element {
  const [contacts, setContacts] = React.useState(initialContacts);
  const [query, setQuery] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [draftName, setDraftName] = React.useState('');
  const [draftEmail, setDraftEmail] = React.useState('');
  const addShellRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLElement>(null);
  const cardHeightRef = React.useRef<number | null>(null);
  const revealedContactRef = React.useRef<string | null | undefined>(undefined);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [history, setHistory] = React.useState<ContactHistoryThread[]>([]);
  const [historyFor, setHistoryFor] = React.useState<string | null>(null);
  const historyRequest = React.useRef<string | null>(null);

  React.useEffect(() => {
    setContacts(initialContacts);
  }, [initialContacts]);

  const closeAddForm = () => {
    setAdding(false);
    setDraftName('');
    setDraftEmail('');
  };

  const showContact = (id: string | null) => {
    const card = cardRef.current;
    if (card) cardHeightRef.current = card.getBoundingClientRect().height;
    if (id) closeAddForm();
    setSelectedId(id);
  };

  React.useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const key = selectedId ?? '';
    if (revealedContactRef.current === key) return;
    const initial = revealedContactRef.current === undefined;
    revealedContactRef.current = key;
    playReveal(card, initial ? null : cardHeightRef.current);
  }, [selectedId]);

  React.useLayoutEffect(() => {
    const el = addShellRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const start = el.getBoundingClientRect().height;

    el.style.transition = 'none';

    if (adding) {
      el.style.height = 'auto';
      const target = el.offsetHeight;
      el.style.height = `${start}px`;
      if (start < 0.5) {
        el.style.opacity = '0';
        el.style.filter = 'blur(2px)';
      }
      void el.offsetHeight;
      if (!reduceMotion) el.style.transition = '';
      el.style.height = `${target}px`;
      el.style.opacity = '1';
      el.style.filter = 'blur(0px)';
      return;
    }

    el.style.height = `${start}px`;
    void el.offsetHeight;
    if (!reduceMotion && start >= 0.5) el.style.transition = '';
    el.style.height = '0px';
    el.style.opacity = '0';
    el.style.filter = 'blur(2px)';
  }, [adding, selectedId]);

  const selected =
    contacts.find((contact) => contact.id === selectedId) ?? null;
  const [name, setName] = React.useState(selected?.name ?? '');
  const [notes, setNotes] = React.useState(selected?.notes ?? '');
  const company = selected ? companyFromEmail(selected.email) : null;

  React.useEffect(() => {
    setName(selected?.name ?? '');
    setNotes(selected?.notes ?? '');
    setConfirmRemove(false);
  }, [selected?.id, selected?.name, selected?.notes]);

  const { execute: runHistory, isExecuting: loadingHistory } = useAction(
    getContactHistory,
    {
      onSuccess: ({ data, input }) => {
        if (historyRequest.current !== input.contactId) return;
        setHistory(data?.threads ?? []);
        setHistoryFor(input.contactId);
      },
      onError: () => {
        setHistory([]);
      }
    }
  );

  React.useEffect(() => {
    if (!selectedId || historyRequest.current === selectedId) return;
    historyRequest.current = selectedId;
    runHistory({ contactId: selectedId });
  }, [runHistory, selectedId]);

  const { execute: runAdd, isExecuting: savingNew } = useAction(addContact, {
    onSuccess: ({ data }) => {
      if (!data) return;
      setContacts((current) => {
        const without = current.filter((contact) => contact.id !== data.id);
        return [...without, data].toSorted((a, b) =>
          a.name.localeCompare(b.name)
        );
      });
      setSelectedId(null);
      closeAddForm();
      toast.success(
        data.created ? `Added ${data.name}` : `${data.name} is already saved`
      );
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Could not add contact');
    }
  });

  const { execute: runUpdate, isExecuting: saving } = useAction(updateContact, {
    onSuccess: ({ data }) => {
      if (!data) return;
      setContacts((current) =>
        current
          .map((contact) =>
            contact.id === data.id ? { ...contact, ...data } : contact
          )
          .toSorted((a, b) => a.name.localeCompare(b.name))
      );
      toast.success('Saved');
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Could not save contact');
    }
  });

  const { execute: runDelete, isExecuting: removing } = useAction(
    deleteContact,
    {
      onSuccess: ({ data }) => {
        if (!data) return;
        setContacts((current) =>
          current.filter((contact) => contact.id !== data.id)
        );
        showContact(null);
        setHistory([]);
        setHistoryFor(null);
        historyRequest.current = null;
        toast.success('Removed');
      },
      onError: ({ error }) => {
        toast.error(error.serverError || 'Could not remove contact');
      }
    }
  );

  const visible = contacts.filter((contact) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    const derived = companyFromEmail(contact.email)?.toLowerCase() ?? '';
    return (
      contact.name.toLowerCase().includes(needle) ||
      contact.email.toLowerCase().includes(needle) ||
      derived.includes(needle)
    );
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <PresentationPageMark
            className="text-[#fcf4ec]"
            style={{ backgroundColor: HUMANER_NAV_COLORS.success }}
          >
            <AddressBook
              className="size-6"
              weight="duotone"
            />
          </PresentationPageMark>
          <div className="min-w-0 flex-1">
            <h1 className="page-title">Contacts</h1>
            {selected ? null : (
              <label className="mt-1.5 flex w-full max-w-md items-center gap-2 text-muted-foreground">
                <SearchIcon className="size-3.5 shrink-0" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, company, or email"
                  aria-label="Search contacts"
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </label>
            )}
          </div>
        </div>
        {selected ? null : (
          <Button
            type="button"
            onClick={() => {
              if (adding) {
                closeAddForm();
                return;
              }
              setAdding(true);
            }}
          >
            {adding ? (
              'Cancel'
            ) : (
              <>
                <PlusIcon className="mr-1.5 size-4" />
                Add contact
              </>
            )}
          </Button>
        )}
      </header>

      <section
        ref={cardRef}
        className={cn(
          dashboardSurfaceClassName,
          't-reveal-swap overflow-hidden'
        )}
      >
        {selected ? (
          <>
            <div className="flex items-center gap-3 border-b border-border/60 px-5 py-3 sm:px-6">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2"
                onClick={() => showContact(null)}
              >
                <ArrowLeftIcon className="mr-1.5 size-4" />
                Contacts
              </Button>
            </div>
            <div className="flex items-start gap-4 px-5 py-4 sm:px-6">
              <ContactAvatar
                contact={selected}
                className="size-11"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-medium text-foreground">
                  {selected.name}
                </h2>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {selected.email}
                </p>
              </div>
              {company ? (
                <p className="shrink-0 text-xs text-muted-foreground">
                  {company}
                </p>
              ) : null}
            </div>

            <form
              className="space-y-3 border-t border-border/60 px-5 py-4 sm:px-6"
              onSubmit={(event) => {
                event.preventDefault();
                runUpdate({
                  contactId: selected.id,
                  name,
                  notes
                });
              }}
            >
              <label className="block space-y-1.5">
                <span className="text-xs text-muted-foreground">Name</span>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs text-muted-foreground">Notes</span>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                />
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving || name.trim().length === 0}
                >
                  Save
                </Button>
                {confirmRemove ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={removing}
                    onClick={() => runDelete({ contactId: selected.id })}
                  >
                    Remove contact
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmRemove(true)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </form>

            <div className="border-t border-border/60">
              <p className="px-5 pt-4 text-xs text-muted-foreground sm:px-6">
                Mail with {businessName}
              </p>
              {loadingHistory && historyFor !== selected.id ? (
                <div className="mx-5 my-4 h-12 animate-pulse rounded-lg bg-muted/40 sm:mx-6" />
              ) : history.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground sm:px-6">
                  No mail with {selected.name} yet.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border/60">
                  {history.map((thread) => (
                    <li key={thread.id}>
                      <Link
                        href={`${Routes.InboxAll}?thread=${thread.id}`}
                        className="block px-5 py-3 transition-colors hover:bg-muted/40 sm:px-6"
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-sm">
                            {thread.subject || '(no subject)'}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatWhen(thread.lastAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {thread.direction === 'OUTBOUND'
                            ? 'Sent'
                            : 'Received'}
                          {' · '}
                          {thread.mailbox}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <>
            <div
              ref={addShellRef}
              className="t-reveal-height"
              data-open={adding ? 'true' : 'false'}
              inert={adding ? undefined : true}
            >
              <form
                className="space-y-2 border-b border-border/60 px-5 py-4 sm:px-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  runAdd({
                    email: draftEmail,
                    name: draftName || undefined
                  });
                }}
              >
                <Input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="Name"
                  aria-label="Contact name"
                />
                <Input
                  value={draftEmail}
                  onChange={(event) => setDraftEmail(event.target.value)}
                  placeholder="email@company.com"
                  type="email"
                  required
                  aria-label="Contact email"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingNew || draftEmail.trim().length === 0}
                  >
                    Save
                  </Button>
                </div>
              </form>
            </div>

            {visible.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
                {contacts.length === 0
                  ? 'No contacts yet. Add a sender from the inbox, or save someone here.'
                  : 'No contacts match that search.'}
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {visible.map((contact) => {
                  const contactCompany = companyFromEmail(contact.email);
                  return (
                    <li key={contact.id}>
                      <button
                        type="button"
                        onClick={() => showContact(contact.id)}
                        className="flex w-full items-start gap-4 px-5 py-3 text-left hover:bg-muted/40 sm:px-6"
                      >
                        <ContactAvatar contact={contact} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {contact.name}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {contact.email}
                          </span>
                        </span>
                        {contactCompany ? (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {contactCompany}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
