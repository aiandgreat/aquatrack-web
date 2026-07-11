import React, { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  serviceAccountNo: string | null;
}

interface UsersSectionProps {
  users: User[];
  sessionUserId: string;
  userSearchQuery: string;
  setUserSearchQuery: (q: string) => void;
  updatingUserId: string | null;
  handleUpdateUserProfile: (id: string, updates: { role?: string; serviceAccountNo?: string; phone?: string }) => Promise<void>;
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

  const startEditing = (u: User) => {
    setEditingUserId(u.id);
    setEditRole(u.role);
    setEditPhone(u.phone || "");
    setEditAccountNo(u.serviceAccountNo || "");
  };

  const cancelEditing = () => {
    setEditingUserId(null);
  };

  const saveEditing = async (userId: string) => {
    await handleUpdateUserProfile(userId, {
      role: editRole,
      phone: editPhone || null,
      serviceAccountNo: editAccountNo || null,
    });
    setEditingUserId(null);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-black text-[#001e66] tracking-tight">Staff &amp; Resident Profiles</h2>
          <p className="text-xs text-slate-500 font-medium">Configure access levels, link service accounts, and manage user directories</p>
        </div>
        <div className="w-full sm:w-64 relative">
          <input
            type="text"
            placeholder="Search by name or email…"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#001e66] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3 px-4">User Details</th>
              <th className="py-3 px-4">Access Role</th>
              <th className="py-3 px-4">Phone Number</th>
              <th className="py-3 px-4">Service Account No.</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((u) => {
              const isAdmin = u.role === "ADMIN";
              const isCurrentlyEditing = editingUserId === u.id;

              return (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-extrabold text-[#001e66] text-sm">{u.name}</div>
                    <div className="text-slate-600 font-medium mt-0.5">{u.email}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1 select-all">{u.id}</div>
                  </td>
                  <td className="py-4 px-4 font-bold">
                    {isAdmin ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                        🛡️ Administrator
                      </span>
                    ) : isCurrentlyEditing ? (
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="bg-white border border-[#00aeef] text-[#001e66] font-bold text-xs py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aeef]/30 transition-all"
                      >
                        <option value="CONSUMER_RESIDENT">CONSUMER_RESIDENT</option>
                        <option value="FIELD_ENGINEER_TECHNICIAN">FIELD_ENGINEER_TECHNICIAN</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        u.role === "FIELD_ENGINEER_TECHNICIAN"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {u.role.replace("_", " ")}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-600 font-bold">
                    {isCurrentlyEditing ? (
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Phone Number"
                        className="bg-white border border-[#00aeef] text-[#001e66] font-bold text-xs py-1.5 px-3 rounded-lg w-32 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/30 transition-all"
                      />
                    ) : (
                      u.phone || (
                        <span className="text-slate-400 font-normal italic">None registered</span>
                      )
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {isAdmin ? (
                      <span className="text-slate-400 font-bold italic text-xxs">N/A - System Admin</span>
                    ) : isCurrentlyEditing ? (
                      <input
                        type="text"
                        value={editAccountNo}
                        onChange={(e) => setEditAccountNo(e.target.value)}
                        placeholder="Account Number"
                        className="bg-white border border-[#00aeef] text-[#001e66] font-bold text-xs py-1.5 px-3 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/30 transition-all"
                      />
                    ) : (
                      u.serviceAccountNo || (
                        <span className="text-slate-400 font-normal italic">None assigned</span>
                      )
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {isAdmin ? (
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider pr-2 flex items-center justify-end gap-1">
                        🔒 Protected
                      </span>
                    ) : isCurrentlyEditing ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEditing}
                          className="bg-white hover:bg-slate-50 text-slate-500 font-extrabold text-[10px] py-1.5 px-3 rounded-lg border border-slate-200 transition-all focus:outline-none"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEditing(u.id)}
                          disabled={updatingUserId === u.id}
                          className="bg-[#00aeef] hover:bg-[#001e66] text-white font-extrabold text-[10px] py-1.5 px-3.5 rounded-lg transition-all focus:outline-none disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEditing(u)}
                          disabled={updatingUserId !== null}
                          className="bg-white hover:bg-slate-50 text-[#001e66] font-extrabold text-[10px] py-1.5 px-3 rounded-lg border border-slate-200 transition-all focus:outline-none"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          disabled={updatingUserId !== null}
                          className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-extrabold text-[10px] py-1.5 px-3 rounded-lg border border-red-100 hover:border-red-200 transition-all focus:outline-none disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                  No users matched search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
