import React, { useState } from "react";
import { 
  User, 
  Mail, 
  Shield, 
  Phone, 
  CreditCard, 
  MapPin, 
  Search, 
  Briefcase, 
  Pencil, 
  Trash2, 
  X, 
  CheckCircle2,
  Users,
  ChevronDown
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  serviceAccountNo: string | null;
  address?: string | null;
}

interface UsersSectionProps {
  users: UserData[];
  sessionUserId: string;
  userSearchQuery: string;
  setUserSearchQuery: (q: string) => void;
  updatingUserId: string | null;
  handleUpdateUserProfile: (
    id: string, 
    updates: { role?: string; serviceAccountNo?: string; phone?: string; address?: string }
  ) => Promise<void>;
  handleDeleteUser: (id: string) => void;
}

export default function UsersSection({
  users,
  sessionUserId,
  userSearchQuery,
  setUserSearchQuery,
  updatingUserId,
  handleUpdateUserProfile,
  handleDeleteUser,
}: UsersSectionProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAccountNo, setEditAccountNo] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "CONSUMER_RESIDENT" | "FIELD_ENGINEER_TECHNICIAN">("ALL");

  const startEditing = (u: UserData) => {
    setEditingUserId(u.id);
    setEditRole(u.role);
    setEditPhone(u.phone || "");
    setEditAccountNo(u.serviceAccountNo || "");
    setEditAddress(u.address || "");
  };

  const cancelEditing = () => {
    setEditingUserId(null);
  };

  const saveEditing = async (userId: string) => {
    await handleUpdateUserProfile(userId, {
      role: editRole,
      phone: editPhone || null,
      serviceAccountNo: editAccountNo || null,
      address: editAddress || null,
    });
    setEditingUserId(null);
  };

  // Filter out ADMIN roles, apply selected role filter, and then filter by search query (Name or Email)
  const filteredUsers = users.filter(
    (u) =>
      u.role !== "ADMIN" &&
      (roleFilter === "ALL" || u.role === roleFilter) &&
      (u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
       u.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-[#001e66] dark:text-slate-100 rounded-xl shadow-inner">
            <Users className="w-5 h-5 text-[#00aeef]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#001e66] dark:text-slate-100 tracking-tight">Staff &amp; Resident Profiles</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Configure roles, link service accounts, and manage user directories</p>
          </div>
        </div>
        
        {/* Search Bar and Role Filter Dropdown */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch w-full sm:w-auto">
          {/* Role Filter Dropdown */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#001e66] dark:text-slate-100 font-bold text-xs py-2.5 pl-8 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all cursor-pointer shadow-sm w-full sm:w-56"
            >
              <option value="ALL">All Roles</option>
              <option value="CONSUMER_RESIDENT">CONSUMER RESIDENT</option>
              <option value="FIELD_ENGINEER_TECHNICIAN">FIELD ENGINEER TECHNICIAN</option>
            </select>
            <Shield className="absolute left-2.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by name or email…"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-[#001e66] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Modern Card wrapped Table */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200/85 dark:border-slate-800/85 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-300 font-black uppercase tracking-wider text-[10px]">
                <th className="py-4 px-5">Full Name</th>
                <th className="py-4 px-5">Email</th>
                <th className="py-4 px-5">Role</th>
                <th className="py-4 px-5">Phone Number</th>
                <th className="py-4 px-5">Service Account Number</th>
                <th className="py-4 px-5">Address</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 dark:bg-slate-950/20">
              {filteredUsers.map((u) => {
                const isCurrentlyEditing = editingUserId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors">
                    {/* 1. Full Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-[#001e66] dark:text-slate-100 text-xs.5">{u.name}</div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Email */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-600 dark:text-slate-300 font-mono font-bold">{u.email}</span>
                      </div>
                    </td>

                    {/* 3. Role */}
                    <td className="py-4 px-5 font-bold">
                      {isCurrentlyEditing ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-[#00aeef] text-[#001e66] dark:text-slate-100 font-bold text-xs py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aeef]/30 transition-all cursor-pointer"
                        >
                          <option value="CONSUMER_RESIDENT">CONSUMER_RESIDENT</option>
                          <option value="FIELD_ENGINEER_TECHNICIAN">FIELD_ENGINEER_TECHNICIAN</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                          u.role === "FIELD_ENGINEER_TECHNICIAN"
                            ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}>
                          {u.role === "FIELD_ENGINEER_TECHNICIAN" ? (
                            <Briefcase className="w-3 h-3 text-purple-500 dark:text-purple-400 shrink-0" />
                          ) : (
                            <User className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
                          )}
                          {u.role.replace(/_/g, " ")}
                        </span>
                      )}
                    </td>

                    {/* 4. Phone Number */}
                    <td className="py-4 px-5 font-mono text-slate-600 dark:text-slate-300 font-bold">
                      {isCurrentlyEditing ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="Phone Number"
                            className="bg-white dark:bg-slate-900 border border-[#00aeef] text-[#001e66] dark:text-slate-100 font-bold text-xs py-1.5 pl-8 pr-3 rounded-lg w-36 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/30 transition-all"
                          />
                          <Phone className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ) : (
                        u.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic">None registered</span>
                        )
                      )}
                    </td>

                    {/* 5. Service Account Number */}
                    <td className="py-4 px-5">
                      {isCurrentlyEditing ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={editAccountNo}
                            onChange={(e) => setEditAccountNo(e.target.value)}
                            placeholder="Account Number"
                            className="bg-white dark:bg-slate-900 border border-[#00aeef] text-[#001e66] dark:text-slate-100 font-bold text-xs py-1.5 pl-8 pr-3 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/30 transition-all"
                          />
                          <CreditCard className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ) : (
                        u.serviceAccountNo ? (
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-extrabold text-[#001e66] dark:text-slate-100">{u.serviceAccountNo}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic">None assigned</span>
                        )
                      )}
                    </td>

                    {/* 6. Address */}
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300 font-semibold">
                      {isCurrentlyEditing ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            placeholder="Address"
                            className="bg-white dark:bg-slate-900 border border-[#00aeef] text-[#001e66] dark:text-slate-100 font-bold text-xs py-1.5 pl-8 pr-3 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/30 transition-all"
                          />
                          <MapPin className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                        </div>
                      ) : (
                        u.address ? (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]" title={u.address}>{u.address}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic">None registered</span>
                        )
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      {isCurrentlyEditing ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="flex items-center gap-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 font-extrabold text-[10px] py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 transition-all focus:outline-none cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditing(u.id)}
                            disabled={updatingUserId === u.id}
                            className="flex items-center gap-1 bg-[#00aeef] dark:bg-[#00aeef] hover:bg-[#001e66] dark:hover:bg-[#00aeef]/90 text-white dark:text-[#001e66] font-extrabold text-[10px] py-1.5 px-3.5 rounded-lg border-none transition-all focus:outline-none disabled:opacity-50 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEditing(u)}
                            disabled={updatingUserId !== null}
                            className="flex items-center gap-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#001e66] dark:text-slate-200 font-extrabold text-[10px] py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 transition-all focus:outline-none disabled:opacity-50 cursor-pointer"
                          >
                            <Pencil className="w-3 h-3 text-[#00aeef]" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={updatingUserId !== null}
                            className="flex items-center gap-1 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 dark:text-red-300 hover:text-red-700 font-extrabold text-[10px] py-1.5 px-3 rounded-lg border border-red-100 dark:border-red-900/50 hover:border-red-200 dark:hover:border-red-800 transition-all focus:outline-none disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400 italic">
                    No users matched search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
