"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Inbox, Heart, LayoutDashboard } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/actions/auth";

export function UserMenu({
  user,
}: {
  user: { name: string; email: string; role: "USER" | "PROVIDER" };
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="font-medium leading-tight">{user.name}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {user.role === "USER" ? (
          <>
            <DropdownMenuItem onClick={() => router.push("/favorites")}>
              <Heart className="mr-2 size-4" /> Favorites
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/my-requests")}>
              <Inbox className="mr-2 size-4" /> My requests
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            <LayoutDashboard className="mr-2 size-4" /> Provider dashboard
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            startTransition(async () => {
              await logoutAction();
              router.push("/");
              router.refresh();
            })
          }
        >
          <LogOut className="mr-2 size-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
