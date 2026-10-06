'use client';

import * as React from 'react';
import { Trash } from '@phosphor-icons/react/dist/ssr/Trash';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

import {
  addContactToGroup,
  createContactGroup,
  deleteContactGroup,
  removeContactFromGroup,
  updateContactGroup
} from '@/actions/contacts/manage-contact-groups';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type {
  ContactGroupListItem,
  ContactListItem
} from '@/data/contacts/get-contacts';
import { companyDomainFromEmail } from '@/lib/contacts/contact-email';
import {
  colorShowcaseStack,
  CONTACT_GROUP_COLORS,
  contactGroupColor,
  nextGroupColor,
  type ContactGroupColorId
} from '@/lib/contacts/group-colors';
import { parseContactListText } from '@/lib/contacts/parse-contact-list';
import { getLogoUrl } from '@/lib/logo';
import { cn, getInitials } from '@/lib/utils';

function MiniAvatar({
  contact
}: {
  contact: Pick<ContactListItem, 'name' | 'email' | 'image'>;
}): React.JSX.Element {
  const domain = companyDomainFromEmail(contact.email);
  const src = contact.image || (domain ? getLogoUrl(domain, 64) : null);
  return (
    <Avatar className="size-7 rounded-md">
      {src ? (
        <AvatarImage
          src={src}
          alt=""
        />
      ) : null}
      <AvatarFallback className="rounded-md text-[9px]">
        {getInitials(contact.name)}
      </AvatarFallback>
    </Avatar>
  );
}

const SWATCH = 20;
const STACK_STEP = 7;
const FAN_STEP = 28;
/** Extra room so selected scale + ring-offset don’t clip. */
const FAN_WIDTH = SWATCH + FAN_STEP * (CONTACT_GROUP_COLORS.length - 1) + 6;
const STACK_WIDTH = SWATCH + STACK_STEP * 2;

/**
 * 3-swatch stack that fans left into the full palette on hover.
 * Anchored before the delete control so growth eats the title, not the card edge.
 */
function GroupColorHeader({
  name,
  value,
  onChange,
  onDelete,
  deleteLabel
}: {
  name: string;
  value: string;
  onChange: (color: ContactGroupColorId) => void;
  onDelete: () => void;
  deleteLabel: string;
}): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const stack = colorShowcaseStack(value);

  return (
    <div className="mb-2 flex min-w-0 items-center gap-2">
      <p className="min-w-0 flex-1 truncate font-fellix text-sm">{name}</p>
      <div
        className="flex shrink-0 items-center gap-1.5"
        onMouseLeave={() => setOpen(false)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setOpen(false);
          }
        }}
      >
        <div
          role="listbox"
          aria-label="Group color"
          aria-expanded={open}
          className="relative h-7 shrink-0"
          style={{
            width: open ? FAN_WIDTH : STACK_WIDTH,
            transition: 'width 300ms cubic-bezier(0.22, 1, 0.36, 1)'
          }}
          onMouseEnter={() => setOpen(true)}
          onFocus={() => setOpen(true)}
        >
          {CONTACT_GROUP_COLORS.map((c, i) => {
            const stackIndex = stack.indexOf(c.id);
            const inStack = stackIndex >= 0;
            const visible = open || inStack;
            const right = open
              ? (CONTACT_GROUP_COLORS.length - 1 - i) * FAN_STEP
              : inStack
                ? (stack.length - 1 - stackIndex) * STACK_STEP
                : 0;
            return (
              <button
                key={c.id}
                type="button"
                role="option"
                tabIndex={visible ? 0 : -1}
                title={c.label}
                aria-label={c.label}
                aria-selected={value === c.id}
                className={cn(
                  'absolute top-1 size-5 rounded-full outline-none shadow-sm ring-1 ring-black/15 dark:ring-white/20',
                  c.accent,
                  open &&
                    value === c.id &&
                    'scale-110 ring-2 ring-foreground ring-offset-1 ring-offset-background',
                  !visible && 'pointer-events-none'
                )}
                style={{
                  right,
                  zIndex: open
                    ? value === c.id
                      ? CONTACT_GROUP_COLORS.length + 1
                      : i + 1
                    : inStack
                      ? stackIndex + 1
                      : 0,
                  opacity: visible ? 1 : 0,
                  transition:
                    'right 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease, transform 200ms ease'
                }}
                onClick={() => {
                  if (!open && !inStack) return;
                  onChange(c.id);
                  setOpen(false);
                }}
              />
            );
          })}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="relative z-20 size-7 shrink-0 p-0 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
          aria-label={deleteLabel}
          onClick={onDelete}
        >
          <Trash
            className="size-3.5"
            weight="regular"
          />
        </Button>
      </div>
    </div>
  );
}

/** Color swatches aligned to the create-group name field height. */
function CreateColorPicker({
  value,
  onChange
}: {
  value: ContactGroupColorId;
  onChange: (color: ContactGroupColorId) => void;
}): React.JSX.Element {
  return (
    <div
      className="flex h-9 shrink-0 items-center gap-1.5 px-2.5"
      role="listbox"
      aria-label="New group color"
    >
      {CONTACT_GROUP_COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          role="option"
          title={c.label}
          aria-label={c.label}
          aria-selected={value === c.id}
          className={cn(
            'size-5 shrink-0 rounded-full outline-none shadow-sm ring-1 ring-black/15 transition dark:ring-white/20',
            c.accent,
            value === c.id
              ? 'scale-110 ring-2 ring-foreground ring-offset-1 ring-offset-background'
              : 'hover:scale-105'
          )}
          onClick={() => onChange(c.id)}
        />
      ))}
    </div>
  );
}

type DragState = {
  contactId: string;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
};

/**
 * Canvas-style contact groups: pointer-drag contacts into colored group cards,
 * import CSV/markdown, or leave contacts ungrouped.
 */
export function ContactsGroupsCanvas({
  contacts,
  groups: initialGroups
}: {
  contacts: ContactListItem[];
  groups: ContactGroupListItem[];
}): React.JSX.Element {
  const [groups, setGroups] = React.useState(initialGroups);
  const [groupName, setGroupName] = React.useState('');
  const [color, setColor] = React.useState<ContactGroupColorId>(
    nextGroupColor(initialGroups.length)
  );
  const [drag, setDrag] = React.useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    React.useState<ContactGroupListItem | null>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  const groupedIds = React.useMemo(() => {
    const set = new Set<string>();
    for (const g of groups) for (const id of g.contactIds) set.add(id);
    return set;
  }, [groups]);

  const ungrouped = contacts.filter((c) => !groupedIds.has(c.id));
  const draggingContact = drag
    ? contacts.find((c) => c.id === drag.contactId)
    : null;

  const { execute: createGroup, isExecuting: creating } = useAction(
    createContactGroup,
    {
      onSuccess: ({ data }) => {
        if (data) {
          setGroups((prev) => [
            ...prev,
            {
              id: data.id,
              name: data.name,
              color: data.color ?? color,
              contactIds: data.contactIds ?? []
            }
          ]);
        }
        setGroupName('');
        setColor(nextGroupColor(groups.length + 1));
        toast.success('Group created');
      },
      onError: ({ error }) =>
        toast.error(error.serverError ?? 'Could not create group')
    }
  );

  const { execute: updateGroup } = useAction(updateContactGroup, {
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Could not update group')
  });

  const { execute: deleteGroup, isExecuting: deleting } = useAction(
    deleteContactGroup,
    {
      onSuccess: ({ data }) => {
        if (data) {
          setGroups((prev) => prev.filter((g) => g.id !== data.id));
          toast.success('Group removed — contacts kept');
        }
        setPendingDelete(null);
      },
      onError: ({ error }) =>
        toast.error(error.serverError ?? 'Could not delete group')
    }
  );

  const { execute: addToGroup } = useAction(addContactToGroup, {
    onSuccess: () => toast.success('Added to group'),
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Could not add contact')
  });

  const { execute: removeFromGroup } = useAction(removeContactFromGroup, {
    onError: ({ error }) =>
      toast.error(error.serverError ?? 'Could not remove contact')
  });

  const hitTarget = React.useCallback((clientX: number, clientY: number) => {
    const els = document.elementsFromPoint(clientX, clientY);
    for (const el of els) {
      if (!(el instanceof HTMLElement)) continue;
      const id = el.dataset.dropTarget;
      if (id) return id;
    }
    return null;
  }, []);

  const startDrag = (
    contactId: string,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({
      contactId,
      x: e.clientX,
      y: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width
    });
    setDropTarget(null);
  };

  React.useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      setDrag((prev) =>
        prev ? { ...prev, x: e.clientX, y: e.clientY } : prev
      );
      setDropTarget(hitTarget(e.clientX, e.clientY));
    };
    const onUp = (e: PointerEvent) => {
      const target = hitTarget(e.clientX, e.clientY);
      const contactId = drag.contactId;
      setDrag(null);
      setDropTarget(null);
      if (!target || !contactId) return;

      if (target === 'ungrouped') {
        for (const g of groups) {
          if (!g.contactIds.includes(contactId)) continue;
          setGroups((prev) =>
            prev.map((row) =>
              row.id === g.id
                ? {
                    ...row,
                    contactIds: row.contactIds.filter((id) => id !== contactId)
                  }
                : row
            )
          );
          removeFromGroup({ groupId: g.id, contactId });
        }
        return;
      }

      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === target) {
            if (g.contactIds.includes(contactId)) return g;
            return { ...g, contactIds: [...g.contactIds, contactId] };
          }
          return {
            ...g,
            contactIds: g.contactIds.filter((id) => id !== contactId)
          };
        })
      );
      addToGroup({ groupId: target, contactId });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [addToGroup, drag, groups, hitTarget, removeFromGroup]);

  const importFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const rows = parseContactListText(text);
    if (rows.length === 0) {
      toast.error('No emails found in that file.');
      return;
    }
    const name =
      groupName.trim() ||
      file.name.replace(/\.(csv|md|markdown|txt)$/i, '') ||
      'Imported group';
    createGroup({
      name,
      color,
      members: rows.map((r) => ({
        email: r.email,
        name: r.name
      }))
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const ContactChip = ({
    contact,
    trailing
  }: {
    contact: ContactListItem;
    trailing?: React.ReactNode;
  }) => (
    <div
      onPointerDown={(e) => startDrag(contact.id, e)}
      className={cn(
        'flex touch-none cursor-grab items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 active:cursor-grabbing',
        drag?.contactId === contact.id && 'opacity-30'
      )}
    >
      <MiniAvatar contact={contact} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{contact.name}</p>
        <p className="truncate font-mono text-[10px] text-muted-foreground">
          {contact.email}
        </p>
      </div>
      {trailing}
    </div>
  );

  const showCreateColors = groupName.trim().length > 0;

  return (
    <div className="flex min-h-[min(70vh,720px)] flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[220px] flex-1 items-center rounded-lg border border-input bg-transparent shadow-sm focus-within:ring-1 focus-within:ring-ring">
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="New group name"
            className="min-w-0 flex-1 border-0 shadow-none focus-visible:ring-0"
          />
          {showCreateColors ? (
            <div className="shrink-0 border-l border-border">
              <CreateColorPicker
                value={color}
                onChange={setColor}
              />
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          disabled={creating || !groupName.trim()}
          onClick={() => createGroup({ name: groupName.trim(), color })}
        >
          Create group
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={creating}
          onClick={() => fileRef.current?.click()}
        >
          Import CSV / MD
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.md,.markdown,.txt,text/csv,text/markdown,text/plain"
          className="hidden"
          onChange={(e) => void importFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div
        ref={canvasRef}
        className="relative min-h-[420px] flex-1 overflow-auto rounded-xl border border-border"
        style={{
          backgroundImage:
            'radial-gradient(circle, hsl(var(--muted-foreground) / 0.18) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      >
        <div className="relative z-[1] grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          <div
            data-drop-target="ungrouped"
            className={cn(
              'rounded-xl border border-dashed border-border bg-background/90 p-3 transition',
              dropTarget === 'ungrouped' &&
                'border-sky-400 ring-2 ring-sky-400/30'
            )}
          >
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              Ungrouped
            </p>
            <ul className="max-h-72 space-y-1.5 overflow-auto">
              {ungrouped.map((c) => (
                <li key={c.id}>
                  <ContactChip contact={c} />
                </li>
              ))}
              {ungrouped.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Drag contacts here to keep them generic.
                </p>
              ) : null}
            </ul>
          </div>

          {groups.map((group) => {
            const palette = contactGroupColor(group.color);
            const members = contacts.filter((c) =>
              group.contactIds.includes(c.id)
            );
            return (
              <div
                key={group.id}
                data-drop-target={group.id}
                className={cn(
                  'relative overflow-hidden rounded-xl border bg-background/60 p-3 shadow-none backdrop-blur-[2px] transition',
                  palette.card,
                  dropTarget === group.id && `ring-1 ${palette.ring}`
                )}
              >
                <GroupColorHeader
                  name={group.name}
                  value={group.color}
                  onChange={(next) => {
                    setGroups((prev) =>
                      prev.map((g) =>
                        g.id === group.id ? { ...g, color: next } : g
                      )
                    );
                    updateGroup({ groupId: group.id, color: next });
                  }}
                  deleteLabel={`Delete group ${group.name}`}
                  onDelete={() => setPendingDelete(group)}
                />
                <ul className="relative z-0 max-h-72 space-y-1.5 overflow-auto">
                  {members.map((c) => (
                    <li key={c.id}>
                      <ContactChip
                        contact={c}
                        trailing={
                          <button
                            type="button"
                            className="text-[10px] text-muted-foreground hover:text-foreground"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => {
                              setGroups((prev) =>
                                prev.map((g) =>
                                  g.id === group.id
                                    ? {
                                        ...g,
                                        contactIds: g.contactIds.filter(
                                          (id) => id !== c.id
                                        )
                                      }
                                    : g
                                )
                              );
                              removeFromGroup({
                                groupId: group.id,
                                contactId: c.id
                              });
                            }}
                          >
                            Remove
                          </button>
                        }
                      />
                    </li>
                  ))}
                  {members.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Drop contacts here
                    </p>
                  ) : null}
                </ul>
              </div>
            );
          })}
        </div>

        {drag && draggingContact ? (
          <div
            className="pointer-events-none fixed z-50 flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 shadow-xl"
            style={{
              left: drag.x - drag.offsetX,
              top: drag.y - drag.offsetY,
              width: drag.width
            }}
          >
            <MiniAvatar contact={draggingContact} />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">
                {draggingContact.name}
              </p>
              <p className="truncate font-mono text-[10px] text-muted-foreground">
                {draggingContact.email}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <AlertDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove “{pendingDelete?.name}” from your lists. Contacts stay in
              your address book and move back to Ungrouped — nothing is
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting || !pendingDelete}
              className={cn(
                'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              )}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) {
                  deleteGroup({ groupId: pendingDelete.id });
                }
              }}
            >
              Delete group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
