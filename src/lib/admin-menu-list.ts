import {
  LayoutGrid,
  Users,
  Building2,
  HeartPulse,
  BrainCircuit,
  ShieldAlert,
  LucideIcon,
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

export function getAdminMenuList(_pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/admin",
          label: "Overview",
          icon: LayoutGrid,
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "Management",
      menus: [
        {
          href: "/admin/users",
          label: "Users",
          icon: Users,
          submenus: [],
        },
        {
          href: "/admin/workspaces",
          label: "Workspaces",
          icon: Building2,
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "System",
      menus: [
        {
          href: "/admin/health",
          label: "System Health",
          icon: HeartPulse,
          submenus: [],
        },
        {
          href: "/admin/ai",
          label: "AI",
          icon: BrainCircuit,
          submenus: [],
        },
        {
          href: "/admin/security",
          label: "Security",
          icon: ShieldAlert,
          submenus: [],
        },
      ],
    },
  ];
}
