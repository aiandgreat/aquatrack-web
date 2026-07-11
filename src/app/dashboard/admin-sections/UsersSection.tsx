import React from "react";

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
  handleUpdateRole: (id: string, role: string) => void;
  handleUpdateServiceAccount: (id: string, accountNo: string) => void;
}

export default function UsersSection({
  users,
  sessionUserId,
  userSearchQuery,
  setUserSearchQuery,
  updatingUserId,
  handleUpdateRole,
  handleUpdateServiceAccount,
}: UsersSectionProps) {
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
          <p className="text-xs text-slate-500 font-medium">Configure access levels and link service accounts</p>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-extrabold text-[#001e66] text-sm">{u.name}</div>
                  <div className="text-slate-600 font-medium mt-0.5">{u.email}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 select-all">{u.id}</div>
                </td>
                <td className="py-4 px-4">
                  <select
                    value={u.role}
                    disabled={updatingUserId === u.id || u.id === sessionUserId}
                    onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                    className="bg-white border border-slate-200 hover:border-[#00aeef] disabled:opacity-50 text-[#001e66] font-bold text-xs py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 transition-all"
                  >
                    <option value="CONSUMER_RESIDENT">CONSUMER_RESIDENT</option>
                    <option value="FIELD_ENGINEER_TECHNICIAN">FIELD_ENGINEER_TECHNICIAN</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td className="py-4 px-4 font-mono text-slate-600 font-bold">
                  {u.phone || (
                    <span className="text-slate-400 font-normal italic">None registered</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <input
                    type="text"
                    defaultValue={u.serviceAccountNo || ""}
                    placeholder="Assign Account No."
                    onBlur={(e) => handleUpdateServiceAccount(u.id, e.target.value)}
                    className="bg-white border border-slate-200 hover:border-[#00aeef] text-[#001e66] font-bold text-xs py-1.5 px-3 rounded-lg w-40 focus:outline-none focus:ring-2 focus:ring-[#00aeef]/40 focus:border-[#00aeef] transition-all"
                  />
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500 italic">
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
