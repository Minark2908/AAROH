"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Search,
  Shield,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  Ban,
  CheckCircle2,
  History,
  MoreVertical,
  Bug,
} from "lucide-react";
import {
  fetchUsers,
  deleteUser,
  promoteUser,
  demoteUser,
  disableUser,
  enableUser,
} from "@/api/adminApi";
import { UserHistoryModal } from "@/components/admin/UserHistoryModal";

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_disabled: boolean;
  created_at: string;
  detection_count: number;
}

type ActionMenuState = { userId: number; x: number; y: number } | null;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMenu, setActionMenu] = useState<ActionMenuState>(null);
  const [historyUser, setHistoryUser] = useState<{ id: number; name: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentUserId = typeof window !== "undefined"
    ? parseInt(localStorage.getItem("aaroh_user_id") || "0", 10)
    : 0;

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Close action menu on outside click
  useEffect(() => {
    if (!actionMenu) return;

    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenu(null);
      }
    };
    
    // Small delay to ensure the opening click doesn't trigger the close logic
    const timer = setTimeout(() => {
      document.addEventListener("click", handle);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handle);
    };
  }, [actionMenu]);

  const runAction = async (userId: number, action: () => Promise<unknown>) => {
    setActionLoading(userId);
    setActionMenu(null);
    try {
      await action();
      await loadUsers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      alert(e.response?.data?.detail || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight text-slate-900 dark:text-white">
            User Management
          </h1>
          <p className="text-muted-foreground mt-1 text-base">
            Manage roles, status and activity for all platform users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-800/30">
            {users.filter((u) => u.role === "admin").length} Admins
          </div>
          <div className="px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-100 dark:border-rose-800/30">
            {users.filter((u) => u.is_disabled).length} Disabled
          </div>
          <div className="px-3 py-1.5 rounded-full bg-slate-50 dark:bg-zinc-900/60 text-slate-600 dark:text-slate-400 text-xs font-bold border border-slate-100 dark:border-white/10">
            {users.length} Total
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-white/5 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or phone..."
                className="pl-10 h-11 bg-slate-50 dark:bg-zinc-900 border-none focus-visible:ring-indigo-500/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50/50 dark:bg-zinc-900/50">
                <tr>
                  <th className="py-4 px-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground border-none">
                    User
                  </th>
                  <th className="py-4 px-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground border-none">
                    Contact
                  </th>
                  <th className="py-4 px-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground border-none">
                    Role & Status
                  </th>
                  <th className="py-4 px-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground border-none">
                    Detections
                  </th>
                  <th className="py-4 px-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground border-none">
                    Joined
                  </th>
                  <th className="py-4 px-6 font-semibold uppercase text-[10px] tracking-wider text-muted-foreground text-right border-none">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading users...
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                      No users found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`group hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition-colors ${
                        user.is_disabled ? "opacity-60" : ""
                      }`}
                    >
                      <td className="py-4 px-6 border-none">
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                              user.role === "admin"
                                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
                                : "bg-slate-100 dark:bg-zinc-800 text-slate-600"
                            }`}
                          >
                            {user.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white leading-none">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">ID: #{user.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 border-none">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 border-none">
                        <div className="flex flex-col gap-1.5">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit ${
                              user.role === "admin"
                                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                            }`}
                          >
                            {user.role === "admin" ? (
                              <Shield className="h-3 w-3" />
                            ) : (
                              <UserIcon className="h-3 w-3" />
                            )}
                            {user.role}
                          </div>
                          {user.is_disabled && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 text-[9px] font-bold uppercase tracking-wider w-fit">
                              <Ban className="h-2.5 w-2.5" />
                              Disabled
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6 border-none">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Bug className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-semibold">{user.detection_count}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 border-none text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right border-none relative">
                        {actionLoading === user.id ? (
                          <div className="flex justify-end">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="relative inline-block">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-9 w-9 transition-all rounded-lg ${
                                actionMenu?.userId === user.id 
                                  ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30" 
                                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActionMenu(
                                  actionMenu?.userId === user.id 
                                    ? null 
                                    : { 
                                        userId: user.id, 
                                        x: rect.left - 180, // Offset to align right edge
                                        y: rect.bottom + 8 
                                      }
                                );
                              }}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>

                            {actionMenu?.userId === user.id && typeof document !== 'undefined' && createPortal(
                              <div
                                ref={menuRef}
                                className="fixed w-52 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                                style={{ 
                                  top: `${actionMenu.y}px`, 
                                  left: `${actionMenu.x}px` 
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors text-left"
                                  onClick={() => {
                                    setHistoryUser({ id: user.id, name: user.name });
                                    setActionMenu(null);
                                  }}
                                >
                                  <History className="h-4 w-4 text-indigo-500" />
                                  View Detection History
                                </button>

                                <div className="border-t border-slate-50 dark:border-white/5" />

                                {user.role === "user" ? (
                                  <button
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors text-left text-indigo-600 dark:text-indigo-400"
                                    onClick={() =>
                                      runAction(user.id, () => promoteUser(user.id))
                                    }
                                  >
                                    <ArrowUpCircle className="h-4 w-4" />
                                    Promote to Admin
                                  </button>
                                ) : (
                                  user.id !== currentUserId && (
                                    <button
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors text-left text-amber-600 dark:text-amber-400"
                                      onClick={() =>
                                        runAction(user.id, () => demoteUser(user.id))
                                      }
                                    >
                                      <ArrowDownCircle className="h-4 w-4" />
                                      Demote to User
                                    </button>
                                  )
                                )}

                                <div className="border-t border-slate-50 dark:border-white/5" />

                                {user.is_disabled ? (
                                  <button
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors text-left text-emerald-600 dark:text-emerald-400"
                                    onClick={() =>
                                      runAction(user.id, () => enableUser(user.id))
                                    }
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Re-enable Account
                                  </button>
                                ) : (
                                  user.id !== currentUserId && (
                                    <button
                                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors text-left text-orange-600 dark:text-orange-400"
                                      onClick={() =>
                                        runAction(user.id, () => disableUser(user.id))
                                      }
                                    >
                                      <Ban className="h-4 w-4" />
                                      Disable Account
                                    </button>
                                  )
                                )}

                                <div className="border-t border-slate-50 dark:border-white/5" />

                                {user.id !== currentUserId && (
                                  <button
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left text-rose-600 dark:text-rose-400"
                                    onClick={() => {
                                      if (
                                        confirm(
                                          `Delete ${user.name}? This cannot be undone.`
                                        )
                                      ) {
                                        runAction(user.id, () => deleteUser(user.id));
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete User
                                  </button>
                                )}
                              </div>,
                              document.body
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {historyUser && (
        <UserHistoryModal
          userId={historyUser.id}
          userName={historyUser.name}
          open={!!historyUser}
          onClose={() => setHistoryUser(null)}
        />
      )}
    </div>
  );
}
