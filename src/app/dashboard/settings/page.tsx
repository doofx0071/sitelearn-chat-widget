"use client";

import { useState } from "react";
import {
  Building2,
  Users,
  CreditCard,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Crown,
  Shield,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/dashboard/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mock data — replace with Convex queries
const MOCK_WORKSPACE = {
  name: "Acme Corp",
  slug: "acme-corp",
  plan: "pro" as const,
  seats: { used: 4, total: 10 },
};

const MOCK_MEMBERS = [
  {
    id: "m1",
    name: "Jane Doe",
    email: "jane@acme.com",
    role: "admin" as const,
    avatar: "https://github.com/shadcn.png",
    initials: "JD",
    joinedAt: "2024-01-15",
    isCurrentUser: true,
  },
  {
    id: "m2",
    name: "John Smith",
    email: "john@acme.com",
    role: "member" as const,
    avatar: "",
    initials: "JS",
    joinedAt: "2024-02-01",
    isCurrentUser: false,
  },
  {
    id: "m3",
    name: "Alice Johnson",
    email: "alice@acme.com",
    role: "member" as const,
    avatar: "",
    initials: "AJ",
    joinedAt: "2024-03-10",
    isCurrentUser: false,
  },
  {
    id: "m4",
    name: "Bob Lee",
    email: "bob@acme.com",
    role: "member" as const,
    avatar: "",
    initials: "BL",
    joinedAt: "2024-04-05",
    isCurrentUser: false,
  },
];

const MOCK_API_KEYS = [
  {
    id: "key_1",
    name: "Production",
    key: "sl_live_••••••••••••••••3f8a",
    createdAt: "2024-01-15",
    lastUsed: "2m ago",
  },
  {
    id: "key_2",
    name: "Staging",
    key: "sl_test_••••••••••••••••9c2b",
    createdAt: "2024-03-01",
    lastUsed: "1d ago",
  },
];

export default function SettingsPage() {
  const [workspaceName, setWorkspaceName] = useState(MOCK_WORKSPACE.name);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [apiKeys, setApiKeys] = useState(MOCK_API_KEYS);
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const handleSaveWorkspace = () => {
    toast.success("Workspace settings saved");
  };

  const handleInvite = () => {
    if (!inviteEmail) return;
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail("");
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast.success("Member removed");
  };

  const handleChangeRole = (id: string, role: "admin" | "member") => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role } : m))
    );
    toast.success("Role updated");
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;
    const newKey = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      key: `sl_live_${"•".repeat(16)}${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
    };
    setApiKeys((prev) => [newKey, ...prev]);
    setNewKeyName("");
    toast.success("API key created");
  };

  const handleCopyKey = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success("API key revoked");
  };

  return (
    <>
      <Header breadcrumbs={[{ label: "Settings" }]} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your workspace, team members, and integrations.
            </p>
          </div>

          <Tabs defaultValue="workspace">
            <TabsList className="h-9 w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
              {[
                { value: "workspace", label: "Workspace", icon: Building2 },
                { value: "members", label: "Members", icon: Users },
                { value: "billing", label: "Billing", icon: CreditCard },
                { value: "api-keys", label: "API Keys", icon: Key },
              ].map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="relative h-9 rounded-none border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <Icon className="mr-1.5 h-3.5 w-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Workspace */}
            <TabsContent value="workspace" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">General</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Update your workspace name and settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="workspace-name" className="text-xs font-medium">
                      Workspace name
                    </Label>
                    <Input
                      id="workspace-name"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="h-8 max-w-sm text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Workspace URL</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        app.sitelearn.ai/
                      </span>
                      <Input
                        defaultValue={MOCK_WORKSPACE.slug}
                        className="h-8 max-w-[200px] text-xs"
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button size="sm" onClick={handleSaveWorkspace}>
                      Save changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive/40">
                <CardHeader>
                  <CardTitle className="text-sm text-destructive">
                    Danger zone
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Irreversible actions for this workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        Delete workspace
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Permanently deletes all projects, content, and data.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Members */}
            <TabsContent value="members" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">Team members</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {MOCK_WORKSPACE.seats.used} / {MOCK_WORKSPACE.seats.total} seats
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Manage who has access to this workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Invite form */}
                  <div className="flex gap-2">
                    <Input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                      placeholder="colleague@company.com"
                      className="h-8 flex-1 text-xs"
                      type="email"
                    />
                    <Select
                      value={inviteRole}
                      onValueChange={(v) =>
                        setInviteRole(v as "admin" | "member")
                      }
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member" className="text-xs">
                          Member
                        </SelectItem>
                        <SelectItem value="admin" className="text-xs">
                          Admin
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={handleInvite}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Invite
                    </Button>
                  </div>

                  <Separator />

                  {/* Member list */}
                  <ul className="space-y-2">
                    {members.map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs font-medium">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium text-foreground truncate">
                              {member.name}
                            </p>
                            {member.isCurrentUser && (
                              <Badge variant="secondary" className="text-[9px] h-4 px-1">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {member.email}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(v) =>
                              handleChangeRole(
                                member.id,
                                v as "admin" | "member"
                              )
                            }
                            disabled={member.isCurrentUser}
                          >
                            <SelectTrigger className="h-7 w-24 text-[11px]">
                              <div className="flex items-center gap-1">
                                {member.role === "admin" ? (
                                  <Crown className="h-3 w-3 text-amber-500" />
                                ) : (
                                  <Shield className="h-3 w-3 text-muted-foreground" />
                                )}
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin" className="text-xs">
                                Admin
                              </SelectItem>
                              <SelectItem value="member" className="text-xs">
                                Member
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {!member.isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveMember(member.id)}
                              aria-label="Remove member"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing */}
            <TabsContent value="billing" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">Current plan</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          Pro Plan
                        </p>
                        <Badge className="text-[10px]">Current</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        $29 / month · Billed monthly
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs">
                      Manage plan
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Pages indexed", used: "1,330", limit: "10,000" },
                      { label: "AI responses", used: "8,421", limit: "20,000" },
                      { label: "Projects", used: "4", limit: "Unlimited" },
                      { label: "Team seats", used: "4", limit: "10" },
                    ].map((usage) => (
                      <div
                        key={usage.label}
                        className="rounded-lg border border-border bg-card p-3"
                      >
                        <p className="text-[10px] text-muted-foreground">
                          {usage.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                          {usage.used}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          of {usage.limit}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
                    <Settings className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                      Billing portal coming soon
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Manage payment methods, invoices, and plan changes here.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      disabled
                    >
                      Open billing portal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys */}
            <TabsContent value="api-keys" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">API Keys</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Use these keys to authenticate requests to the SiteLearn API.
                    Keep them secret — never commit them to version control.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Create key */}
                  <div className="flex gap-2">
                    <Input
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
                      placeholder="Key name (e.g. Production)"
                      className="h-8 flex-1 text-xs"
                    />
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={handleCreateKey}
                      disabled={!newKeyName.trim()}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create key
                    </Button>
                  </div>

                  <Separator />

                  {/* Key list */}
                  {apiKeys.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No API keys yet. Create one above.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {apiKeys.map((apiKey) => (
                        <li
                          key={apiKey.id}
                          className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-foreground">
                                {apiKey.name}
                              </p>
                              <Badge variant="secondary" className="text-[9px] h-4">
                                Live
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <code className="font-mono text-[11px] text-muted-foreground">
                                {revealedKey === apiKey.id
                                  ? apiKey.key.replace(/•+/, "sk_real_example_key_here")
                                  : apiKey.key}
                              </code>
                              <button
                                onClick={() =>
                                  setRevealedKey(
                                    revealedKey === apiKey.id ? null : apiKey.id
                                  )
                                }
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {revealedKey === apiKey.id ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Created {apiKey.createdAt} · Last used {apiKey.lastUsed}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 text-[11px]"
                              onClick={() => handleCopyKey(apiKey.key, apiKey.id)}
                            >
                              {copiedKey === apiKey.id ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-500" />
                                  <span className="text-emerald-500">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  Copy
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRevokeKey(apiKey.id)}
                              aria-label="Revoke key"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">LLM Provider Keys</CardTitle>
                  <CardDescription className="text-xs">
                    Optionally bring your own OpenAI or Anthropic API keys.
                    These are encrypted at rest and never logged.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(
                    [
                      { provider: "OpenAI", placeholder: "sk-proj-…", icon: "🤖" },
                      { provider: "Anthropic", placeholder: "sk-ant-…", icon: "🧠" },
                    ] as const
                  ).map(({ provider, placeholder, icon }) => (
                    <div key={provider} className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        {icon} {provider} API Key
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          placeholder={placeholder}
                          className="h-8 flex-1 font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() =>
                            toast.success(`${provider} key saved`)
                          }
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-foreground">
                    Your keys are encrypted with AES-256 before storage.
                    SiteLearn uses your keys only to serve requests for your projects.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
