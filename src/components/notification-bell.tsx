"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markNotificationsReadAction } from "@/actions/profile";

type Notif = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const router = useRouter();

  const load = () => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : { count: 0, items: [] }))
      .then((d) => {
        setItems(d.items ?? []);
        setUnread(d.count ?? 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && unread > 0) {
          void markNotificationsReadAction().then(() => {
            setUnread(0);
            setItems((prev) => prev.map((i) => ({ ...i, read: true })));
            router.refresh();
          });
        }
      }}
    >
      <DropdownMenuTrigger className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground outline-none">
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        </DropdownMenuGroup>
        {items.length === 0 && (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        )}
        {items.slice(0, 12).map((n) => (
          <button
            key={n.id}
            className={`w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent ${
              n.read ? "opacity-70" : ""
            }`}
            onClick={() => {
              if (n.link) router.push(n.link);
            }}
          >
            <div className="font-medium">{n.title}</div>
            <div className="text-muted-foreground line-clamp-2">{n.body}</div>
            <div className="text-xs text-muted-foreground/70">{timeAgo(n.createdAt)}</div>
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
