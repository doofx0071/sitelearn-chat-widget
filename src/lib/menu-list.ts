import {
  LayoutGrid,
  Globe,
  Bot,
  Settings,
  CreditCard,
  BarChart3,
  LucideIcon
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutGrid,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Projects",
      menus: [
        {
          href: "/dashboard/projects",
          label: "My Projects",
          icon: Globe,
          submenus: []
        },
        {
          href: "/dashboard/bots",
          label: "Chat Bots",
          icon: Bot,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Analytics",
      menus: [
        {
          href: "/dashboard/analytics",
          label: "Overview",
          icon: BarChart3,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/dashboard/settings",
          label: "Settings",
          icon: Settings,
          submenus: []
        },
        {
          href: "/dashboard/billing",
          label: "Billing",
          icon: CreditCard,
          submenus: []
        }
      ]
    }
  ];
}
