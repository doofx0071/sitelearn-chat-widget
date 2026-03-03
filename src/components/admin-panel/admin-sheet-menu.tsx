"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";

import { SiteLogo } from "@/components/site-logo";
import { Button } from "@/components/ui/button";
import { AdminMenu } from "@/components/admin-panel/admin-menu";
import {
  Sheet,
  SheetHeader,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

export function AdminSheetMenu() {
  return (
    <Sheet>
      <SheetTrigger className="lg:hidden" asChild>
        <Button className="h-8" variant="outline" size="icon">
          <MenuIcon size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:w-72 px-3 h-full flex flex-col" side="left">
        <SheetHeader>
          <Button
            className="flex justify-center items-center pb-2 pt-1"
            variant="link"
            asChild
          >
            <Link href="/admin" className="flex items-center gap-2">
              <SiteLogo className="h-7 w-7 shrink-0" />
              <SheetTitle className="font-bold text-lg">Super Admin</SheetTitle>
            </Link>
          </Button>
        </SheetHeader>
        <AdminMenu isOpen />
      </SheetContent>
    </Sheet>
  );
}
