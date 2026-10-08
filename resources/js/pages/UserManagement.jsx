import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Lock,
  Edit2,
  Trash2,
  CheckCircle2,
  Search,
  ShieldCheck,
  Calculator,
  UserCheck,
  RefreshCw,
  X
} from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Cashier'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users?.data || res.data.users || []);
      setRoles(res.data.roles || []);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load user records.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: roles[0]?.name || 'Cashier'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.roles?.[0]?.name || 'Cashier'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingUser) {
        // Update
        const payload = {
          name: formData.name,
          email: formData.email,
          role: formData.role
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await api.put(`/users/${editingUser.id}`, payload);
        Swal.fire({
          icon: 'success',
          title: 'Updated',
          text: `User ${formData.name} updated successfully.`,
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        // Create
        await api.post('/users', formData);
        Swal.fire({
          icon: 'success',
          title: 'Created',
          text: `User ${formData.name} created successfully.`,
          timer: 1500,
          showConfirmButton: false
        });
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to save user.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to permanently delete user "${user.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete user'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/users/${user.id}`);
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'User deleted successfully.',
          timer: 1500,
          showConfirmButton: false
        });
        fetchUsers();
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Action Failed',
          text: err.response?.data?.message || 'Could not delete user.'
        });
      }
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.roles?.[0]?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Spatie RBAC Security</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">User & Employee Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage system users and assign Spatie security roles (Admin, Cashier, Accountant).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Controls / Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs"
          />
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 shadow-xs transition-colors self-end sm:self-auto"
          title="Refresh table"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">User / Employee</th>
                <th className="py-3.5 px-6">Email Address</th>
                <th className="py-3.5 px-6">Spatie Role</th>
                <th className="py-3.5 px-6">Joined Date</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading user accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    No users matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleName = u.roles?.[0]?.name || 'No Role';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[10px] text-slate-400">ID #{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-600">
                        {u.email}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            roleName === 'Admin'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : roleName === 'Accountant'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {roleName === 'Admin' ? <ShieldCheck className="w-3.5 h-3.5" /> :
                           roleName === 'Accountant' ? <Calculator className="w-3.5 h-3.5" /> :
                           <UserCheck className="w-3.5 h-3.5" />}
                          {roleName}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-500 text-[11px]">
                        {new Date(u.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                            title="Edit user"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {editingUser ? 'Edit User & Role' : 'Create New User Account'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@minipos.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editingUser ? 'Password (leave blank to keep existing)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Spatie Security Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Controls permissions across POS counter, inventory, purchases, and accounting reports.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
