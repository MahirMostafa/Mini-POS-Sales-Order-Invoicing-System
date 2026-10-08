import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Swal from 'sweetalert2';
import {
  ShieldCheck,
  Key,
  Save,
  CheckCircle2,
  Lock,
  Plus,
  RefreshCw,
  Info,
  ShieldAlert,
  UserCheck,
  Calculator,
  Shield
} from 'lucide-react';

export default function RolePermissionManagement() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRolesAndPermissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/roles');
      const fetchedRoles = res.data.roles || [];
      const fetchedPerms = res.data.permissions || [];
      setRoles(fetchedRoles);
      setPermissions(fetchedPerms);

      if (fetchedRoles.length > 0) {
        // Keep current selected or default to first
        const currentId = selectedRole ? selectedRole.id : fetchedRoles[0].id;
        const active = fetchedRoles.find((r) => r.id === currentId) || fetchedRoles[0];
        setSelectedRole(active);
        setSelectedPermissions(active.permissions?.map((p) => p.name) || []);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load Spatie roles and permissions.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions?.map((p) => p.name) || []);
  };

  const handleTogglePermission = (permName) => {
    if (selectedPermissions.includes(permName)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permName));
    } else {
      setSelectedPermissions([...selectedPermissions, permName]);
    }
  };

  const handleSelectAll = () => {
    setSelectedPermissions(permissions.map((p) => p.name));
  };

  const handleDeselectAll = () => {
    setSelectedPermissions([]);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await api.put(`/roles/${selectedRole.id}/permissions`, {
        permissions: selectedPermissions
      });
      Swal.fire({
        icon: 'success',
        title: 'Permissions Saved',
        text: `Permissions for ${selectedRole.name} have been updated in database.`,
        timer: 1500,
        showConfirmButton: false
      });
      fetchRolesAndPermissions();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.response?.data?.message || 'Could not update role permissions.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Group permissions logically
  const getPermissionGroup = (name) => {
    if (name.includes('pos') || name.includes('order') || name.includes('invoice') || name.includes('customer')) {
      return 'POS, Sales & Customer Orders';
    }
    if (name.includes('product') || name.includes('purchase')) {
      return 'Inventory & Purchase Inflows';
    }
    if (name.includes('accounting') || name.includes('ledger') || name.includes('journal') || name.includes('tax')) {
      return 'Double-Entry Accounting & Taxes';
    }
    return 'Security & User Administration';
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const group = getPermissionGroup(perm.name);
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Spatie Laravel Permission Matrix</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Role & Permission Access Control</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure atomic route and module permissions for Admin, Cashier, and Accountant roles.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !selectedRole}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Permissions Matrix'}</span>
        </button>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {roles.map((r) => {
          const isSelected = selectedRole?.id === r.id;
          const roleIcon =
            r.name === 'Admin' ? ShieldAlert :
            r.name === 'Accountant' ? Calculator : UserCheck;

          const Icon = roleIcon;

          return (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelectRole(r)}
              className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    r.name === 'Admin'
                      ? 'bg-amber-100 text-amber-800'
                      : r.name === 'Accountant'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                  {r.permissions?.length || 0} permissions
                </span>
              </div>

              <div className="font-black text-slate-900 text-sm mb-0.5">{r.name}</div>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                {r.name === 'Admin' && 'Unrestricted access to all terminal, inventory, user, and accounting modules.'}
                {r.name === 'Cashier' && 'Access to POS checkout terminal, sales orders, invoicing, and customer records.'}
                {r.name === 'Accountant' && 'Access to Double-Entry General Ledger, Journal, Tax configuration, and Financials.'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Permission Matrix Grid */}
      {selectedRole && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                Configuring Permissions for: <span className="text-indigo-600 font-black">{selectedRole.name}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Check or uncheck the modules this role is authorized to perform.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedPermissions).map(([groupName, perms]) => (
              <div key={groupName} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  {groupName}
                </div>

                <div className="space-y-2">
                  {perms.map((p) => {
                    const isChecked = selectedPermissions.includes(p.name);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-white border-indigo-400 text-slate-900 shadow-xs'
                            : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(p.name)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                          <span className="font-semibold">{p.name}</span>
                        </div>

                        <span className="text-[10px] text-slate-400 font-mono">web</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-500" />
              Changes are immediately enforced across all Spatie middleware endpoints & UI sidebars.
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
