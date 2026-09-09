// import React, { useCallback, useEffect, useState } from 'react';
// import { Navigate } from 'react-router-dom';
// import { Edit2, KeyRound, Plus, Power, Shield, ShieldCheck, Trash2, Users } from 'lucide-react';
// import { useAuth } from '../../context/AuthContext';
// import { useToast } from '../../context/ToastContext';
// import userService from '../../services/user.service';
// import roleService from '../../services/role.service';
// import { User, CreateUserPayload } from '../../types/user.types';
// import { Role, RoleModule, RoleAction } from '../../types/role.types';
// import Card from '../../components/common/card/Card';
// import Button from '../../components/common/button/Button';
// import Input from '../../components/common/input/Input';
// import Select from '../../components/common/select/Select';
// import Table from '../../components/common/table/Table';
// import Modal from '../../components/common/modal/Modal';
// import Badge from '../../components/common/badge/Badge';
// import ConfirmDialog from '../../components/common/confirm/ConfirmDialog';
// import DataTransferBar from '../../components/common/data-transfer/DataTransferBar';
// import './UserManagement.css';

// const MODULES: { key: RoleModule; label: string }[] = [
//   { key: 'customers', label: 'Customers' },
//   { key: 'products', label: 'Products' },
//   { key: 'purchase', label: 'Purchases' },
//   { key: 'sales', label: 'Sales & Invoices' },
//   { key: 'quotations', label: 'Quotations' },
//   { key: 'receipts', label: 'Receipts' },
//   { key: 'users', label: 'Users' },
//   { key: 'vat', label: 'VAT' },
// ];
// const ACTIONS: RoleAction[] = ['view', 'create', 'modify', 'report'];

// const emptyPermissions = () => {
//   const matrix = {} as Record<RoleModule, Record<RoleAction, boolean>>;
//   MODULES.forEach(({ key }) => { matrix[key] = { view: false, create: false, modify: false, report: false }; });
//   return matrix;
// };

// export const UserManagement: React.FC = () => {
//   const { user } = useAuth();
//   const toast = useToast();
//   if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;

//   const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
//   const [users, setUsers] = useState<User[]>([]);
//   const [roles, setRoles] = useState<Role[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

//   const [isUserModalOpen, setIsUserModalOpen] = useState(false);
//   const [editingUser, setEditingUser] = useState<User | null>(null);
//   const [userName, setUserName] = useState('');
//   const [userEmail, setUserEmail] = useState('');
//   const [userPassword, setUserPassword] = useState('');
//   const [userPhone, setUserPhone] = useState('');
//   const [userRoleId, setUserRoleId] = useState('');
//   const [isSavingUser, setIsSavingUser] = useState(false);

//   const [resetUser, setResetUser] = useState<User | null>(null);
//   const [newPassword, setNewPassword] = useState('');
//   const [isResetting, setIsResetting] = useState(false);
//   const [statusUser, setStatusUser] = useState<User | null>(null);
//   const [isChangingStatus, setIsChangingStatus] = useState(false);

//   const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
//   const [editingRole, setEditingRole] = useState<Role | null>(null);
//   const [roleName, setRoleName] = useState('');
//   const [roleStatus, setRoleStatus] = useState<'Active' | 'Inactive'>('Active');
//   const [permissionsMatrix, setPermissionsMatrix] = useState(emptyPermissions());
//   const [isSavingRole, setIsSavingRole] = useState(false);
//   const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
//   const [isDeletingRole, setIsDeletingRole] = useState(false);

//   const loadData = useCallback(async () => {
//     setIsLoading(true);
//     try {
//       const [userList, roleList] = await Promise.all([userService.getAllUsers(), roleService.getAllRoles()]);
//       setUsers(userList);
//       setRoles(roleList);
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to load users and roles');
//     } finally { setIsLoading(false); }
//   }, [toast]);

//   useEffect(() => { loadData(); }, [loadData]);

//   const openUserModal = (target?: User) => {
//     setEditingUser(target || null);
//     setUserName(target?.name || '');
//     setUserEmail(target?.email || '');
//     setUserPassword('');
//     setUserPhone(target?.phoneno || '');
//     setUserRoleId(target ? (typeof target.role === 'object' ? target.role?._id || '' : target.role || '') : '');
//     setIsUserModalOpen(true);
//   };

//   const saveUser = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!userName.trim() || !userEmail.trim()) return toast.warning('Name and email are required');
//     if (!editingUser && userPassword.length < 6) return toast.warning('Password must be at least 6 characters');
//     setIsSavingUser(true);
//     try {
//       if (editingUser) {
//         await userService.updateUserDetails(editingUser._id, { name: userName.trim(), email: userEmail.trim(), phoneno: userPhone.trim() || undefined, roleId: userRoleId || undefined });
//         toast.success('User updated successfully');
//       } else {
//         const payload: CreateUserPayload = { name: userName.trim(), email: userEmail.trim(), password: userPassword, phoneno: userPhone.trim() || undefined, roleId: userRoleId || undefined };
//         await userService.createUser(payload);
//         toast.success('Staff user created successfully');
//       }
//       setIsUserModalOpen(false);
//       await loadData();
//     } catch (err: any) { toast.error(err.message || 'Failed to save user'); }
//     finally { setIsSavingUser(false); }
//   };

//   const changeStatus = async () => {
//     if (!statusUser) return;
//     const nextStatus = statusUser.status === 'Active' ? 'Inactive' : 'Active';
//     setIsChangingStatus(true);
//     try {
//       await userService.setUserStatus(statusUser._id, nextStatus);
//       toast.success(`User ${nextStatus === 'Active' ? 'activated' : 'deactivated'} successfully`);
//       setStatusUser(null);
//       await loadData();
//     } catch (err: any) { toast.error(err.message || 'Failed to change user status'); }
//     finally { setIsChangingStatus(false); }
//   };

//   const resetPassword = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!resetUser || newPassword.length < 6) return toast.warning('New password must be at least 6 characters');
//     setIsResetting(true);
//     try {
//       await userService.resetPassword(resetUser._id, newPassword);
//       toast.success('Password reset successfully');
//       setResetUser(null); setNewPassword('');
//     } catch (err: any) { toast.error(err.message || 'Failed to reset password'); }
//     finally { setIsResetting(false); }
//   };

//   const openRoleModal = (target?: Role) => {
//     setEditingRole(target || null);
//     setRoleName(target?.name || '');
//     setRoleStatus(target?.status || 'Active');
//     const next = emptyPermissions();
//     if (target) MODULES.forEach(({ key }) => ACTIONS.forEach((action) => { next[key][action] = !!(target.permissions as any)?.[key]?.[action]; }));
//     setPermissionsMatrix(next);
//     setIsRoleModalOpen(true);
//   };

//   const togglePermission = (module: RoleModule, action: RoleAction) => setPermissionsMatrix((prev) => ({ ...prev, [module]: { ...prev[module], [action]: !prev[module][action] } }));

//   const saveRole = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!roleName.trim()) return toast.warning('Role name is required');
//     setIsSavingRole(true);
//     try {
//       if (editingRole) {
//         await roleService.updateRole(editingRole._id, { name: roleName.trim(), permissions: permissionsMatrix, status: roleStatus });
//         toast.success('Role updated successfully');
//       } else {
//         await roleService.createRole({ name: roleName.trim(), permissions: permissionsMatrix });
//         toast.success('Role created successfully');
//       }
//       setIsRoleModalOpen(false);
//       await loadData();
//     } catch (err: any) { toast.error(err.message || 'Failed to save role'); }
//     finally { setIsSavingRole(false); }
//   };

//   const deleteRole = async () => {
//     if (!roleToDelete) return;
//     setIsDeletingRole(true);
//     try {
//       await roleService.deleteRole(roleToDelete._id);
//       toast.success('Role deleted successfully');
//       setRoleToDelete(null);
//       await loadData();
//     } catch (err: any) { toast.error(err.message || 'Failed to delete role'); }
//     finally { setIsDeletingRole(false); }
//   };

//   return <div className="users-page" id="users-page">
//     <div className="page-header">
//       <div><h1 className="page-title">User & Role Management</h1><p className="page-subtitle">Admin-only staff accounts, password resets, status and role permissions</p></div>
//       <div className="responsive-actions"><Button variant="outline" icon={<Shield size={16} />} onClick={() => openRoleModal()}>Create Role</Button><Button variant="primary" icon={<Plus size={16} />} onClick={() => openUserModal()}>Create Staff User</Button></div>
//     </div>

//     <DataTransferBar module={activeTab === 'users' ? 'users' : 'roles'} onImported={() => void loadData()} />

//     <div className="page-tabs"><button className={`page-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><Users size={16} /> Staff Accounts ({users.length})</button><button className={`page-tab-btn ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}><ShieldCheck size={16} /> Security Roles ({roles.length})</button></div>

//     {activeTab === 'users' ? <Card title="All System Users"><Table<User> data={users} isLoading={isLoading} keyExtractor={(u) => u._id} columns={[
//       { header: 'Name', accessor: (u) => <strong>{u.name} {u.isAdmin && <Badge variant="primary">Admin</Badge>}</strong> },
//       { header: 'Email', accessor: (u) => u.email },
//       { header: 'Role', accessor: (u) => u.isAdmin ? 'All permissions' : typeof u.role === 'object' ? u.role?.name || 'Unassigned' : 'Unassigned' },
//       { header: 'Status', accessor: (u) => <Badge variant={u.status === 'Active' ? 'success' : 'danger'}>{u.status}</Badge> },
//       { header: 'Actions', accessor: (u) => <div className="table-actions"><button className="action-icon-btn btn-edit" onClick={() => openUserModal(u)} title="Edit user"><Edit2 size={16}/></button><button className="action-icon-btn btn-view" onClick={() => { setResetUser(u); setNewPassword(''); }} title="Reset password"><KeyRound size={16}/></button>{!u.isAdmin && <button className="action-icon-btn btn-delete" onClick={() => setStatusUser(u)} title={u.status === 'Active' ? 'Deactivate user' : 'Activate user'}><Power size={16}/></button>}</div> },
//     ]} /></Card> : <Card title="Defined Security Roles"><Table<Role> data={roles} isLoading={isLoading} keyExtractor={(r) => r._id} columns={[
//       { header: 'Role Name', accessor: (r) => <strong>{r.name}</strong> },
//       { header: 'Status', accessor: (r) => <Badge variant={r.status === 'Active' ? 'success' : 'danger'}>{r.status}</Badge> },
//       { header: 'Actions', accessor: (r) => <div className="table-actions"><button className="action-icon-btn btn-edit" onClick={() => openRoleModal(r)} title="Edit role"><Edit2 size={16}/></button>{!r.isSystem && <button className="action-icon-btn btn-delete" onClick={() => setRoleToDelete(r)} title="Delete role"><Trash2 size={16}/></button>}</div> },
//     ]} /></Card>}

//     <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingUser ? 'Edit Staff User' : 'Create Staff User'} size="md"><form onSubmit={saveUser} className="admin-form-stack"><Input label="Full Name" value={userName} onChange={(e) => setUserName(e.target.value)} isRequired/><Input type="email" label="Email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} isRequired/>{!editingUser && <Input type="password" label="Temporary Password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} isRequired/>}<Input label="Phone" value={userPhone} onChange={(e) => setUserPhone(e.target.value)}/><Select label="Assigned Role" value={userRoleId} onChange={(e) => setUserRoleId(e.target.value)} options={[{value:'',label:'No role'}, ...roles.filter((r) => r.status === 'Active').map((r) => ({value:r._id,label:r.name}))]}/><div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</Button><Button type="submit" variant="primary" isLoading={isSavingUser} loadingText="Saving...">Save User</Button></div></form></Modal>

//     <Modal isOpen={!!resetUser} onClose={() => setResetUser(null)} title={`Reset Password · ${resetUser?.name || ''}`} size="sm"><form onSubmit={resetPassword} className="admin-form-stack"><Input type="password" label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} isRequired/><div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setResetUser(null)}>Cancel</Button><Button type="submit" variant="primary" isLoading={isResetting} loadingText="Resetting...">Reset Password</Button></div></form></Modal>

//     <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title={editingRole ? 'Edit Security Role' : 'Create Security Role'} size="lg"><form onSubmit={saveRole} className="admin-form-stack"><div className="form-grid-2"><Input label="Role Name" value={roleName} onChange={(e) => setRoleName(e.target.value)} isRequired/><Select label="Status" value={roleStatus} onChange={(e) => setRoleStatus(e.target.value as 'Active'|'Inactive')} options={[{value:'Active',label:'Active'},{value:'Inactive',label:'Inactive'}]} disabled={!editingRole}/></div><div className="permissions-scroll"><table className="permissions-matrix"><thead><tr><th>Module</th>{ACTIONS.map((a) => <th key={a}>{a}</th>)}</tr></thead><tbody>{MODULES.map((m) => <tr key={m.key}><td>{m.label}</td>{ACTIONS.map((a) => <td key={a}><input type="checkbox" className="permission-checkbox" checked={permissionsMatrix[m.key][a]} onChange={() => togglePermission(m.key,a)}/></td>)}</tr>)}</tbody></table></div><div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button><Button type="submit" variant="primary" isLoading={isSavingRole} loadingText="Saving...">{editingRole ? 'Update Role' : 'Create Role'}</Button></div></form></Modal>

//     <ConfirmDialog isOpen={!!statusUser} onClose={() => setStatusUser(null)} onConfirm={changeStatus} title={statusUser?.status === 'Active' ? 'Deactivate User' : 'Activate User'} message={`Change ${statusUser?.name}'s account status to ${statusUser?.status === 'Active' ? 'Inactive' : 'Active'}?`} confirmText="Confirm" isLoading={isChangingStatus}/>
//     <ConfirmDialog isOpen={!!roleToDelete} onClose={() => setRoleToDelete(null)} onConfirm={deleteRole} title="Delete Role" message={`Delete role "${roleToDelete?.name}"?`} confirmText="Delete Role" isLoading={isDeletingRole}/>
//   </div>;
// };

// export default UserManagement;



import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Edit2, KeyRound, Plus, Power, Shield, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import userService from '../../services/user.service';
import roleService from '../../services/role.service';
import { User, CreateUserPayload } from '../../types/user.types';
import { Role, RoleModule, RoleAction } from '../../types/role.types';
import Card from '../../components/common/card/Card';
import Button from '../../components/common/button/Button';
import Input from '../../components/common/input/Input';
import Select from '../../components/common/select/Select';
import Table from '../../components/common/table/Table';
import Modal from '../../components/common/modal/Modal';
import Badge from '../../components/common/badge/Badge';
import ConfirmDialog from '../../components/common/confirm/ConfirmDialog';
import DataTransferBar from '../../components/common/data-transfer/DataTransferBar';
import './UserManagement.css';

const MODULES: { key: RoleModule; label: string }[] = [
  { key: 'customers', label: 'Customers' },
  { key: 'products', label: 'Products' },
  { key: 'purchase', label: 'Purchases' },
  { key: 'sales', label: 'Sales & Invoices' },
  { key: 'quotations', label: 'Quotations' },
  { key: 'receipts', label: 'Receipts' },
  { key: 'users', label: 'Users' },
  { key: 'vat', label: 'VAT' },
];
const ACTIONS: RoleAction[] = ['view', 'create', 'modify', 'report'];

const emptyPermissions = () => {
  const matrix = {} as Record<RoleModule, Record<RoleAction, boolean>>;
  MODULES.forEach(({ key }) => { matrix[key] = { view: false, create: false, modify: false, report: false }; });
  return matrix;
};

export const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;

  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRoleId, setUserRoleId] = useState('');
  const [userEsign, setUserEsign] = useState<File | null>(null);
  const [userEsignPreview, setUserEsignPreview] = useState<string>('');
  const [isSavingUser, setIsSavingUser] = useState(false);

  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [statusUser, setStatusUser] = useState<User | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleStatus, setRoleStatus] = useState<'Active' | 'Inactive'>('Active');
  const [permissionsMatrix, setPermissionsMatrix] = useState(emptyPermissions());
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userList, roleList] = await Promise.all([userService.getAllUsers(), roleService.getAllRoles()]);
      setUsers(userList);
      setRoles(roleList);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load users and roles');
    } finally { setIsLoading(false); }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const openUserModal = (target?: User) => {
    setEditingUser(target || null);
    setUserName(target?.name || '');
    setUserEmail(target?.email || '');
    setUserPassword('');
    setUserPhone(target?.phoneno || '');
    setUserRoleId(target ? (typeof target.role === 'object' ? target.role?._id || '' : target.role || '') : '');
    setUserEsign(null);
    setUserEsignPreview(target?.esignUrl || '');
    setIsUserModalOpen(true);
  };

  const onEsignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUserEsign(file);
    if (file) setUserEsignPreview(URL.createObjectURL(file));
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return toast.warning('Name and email are required');
    if (!editingUser && userPassword.length < 6) return toast.warning('Password must be at least 6 characters');
    setIsSavingUser(true);
    try {
      if (editingUser) {
        await userService.updateUserDetails(editingUser._id, { name: userName.trim(), email: userEmail.trim(), phoneno: userPhone.trim() || undefined, roleId: userRoleId || undefined, esign: userEsign || undefined });
        toast.success('User updated successfully');
      } else {
        const payload: CreateUserPayload = { name: userName.trim(), email: userEmail.trim(), password: userPassword, phoneno: userPhone.trim() || undefined, roleId: userRoleId || undefined, esign: userEsign || undefined };
        await userService.createUser(payload);
        toast.success('Staff user created successfully');
      }
      setIsUserModalOpen(false);
      await loadData();
    } catch (err: any) { toast.error(err.message || 'Failed to save user'); }
    finally { setIsSavingUser(false); }
  };

  const changeStatus = async () => {
    if (!statusUser) return;
    const nextStatus = statusUser.status === 'Active' ? 'Inactive' : 'Active';
    setIsChangingStatus(true);
    try {
      await userService.setUserStatus(statusUser._id, nextStatus);
      toast.success(`User ${nextStatus === 'Active' ? 'activated' : 'deactivated'} successfully`);
      setStatusUser(null);
      await loadData();
    } catch (err: any) { toast.error(err.message || 'Failed to change user status'); }
    finally { setIsChangingStatus(false); }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || newPassword.length < 6) return toast.warning('New password must be at least 6 characters');
    setIsResetting(true);
    try {
      await userService.resetPassword(resetUser._id, newPassword);
      toast.success('Password reset successfully');
      setResetUser(null); setNewPassword('');
    } catch (err: any) { toast.error(err.message || 'Failed to reset password'); }
    finally { setIsResetting(false); }
  };

  const openRoleModal = (target?: Role) => {
    setEditingRole(target || null);
    setRoleName(target?.name || '');
    setRoleStatus(target?.status || 'Active');
    const next = emptyPermissions();
    if (target) MODULES.forEach(({ key }) => ACTIONS.forEach((action) => { next[key][action] = !!(target.permissions as any)?.[key]?.[action]; }));
    setPermissionsMatrix(next);
    setIsRoleModalOpen(true);
  };

  const togglePermission = (module: RoleModule, action: RoleAction) => setPermissionsMatrix((prev) => ({ ...prev, [module]: { ...prev[module], [action]: !prev[module][action] } }));

  const saveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return toast.warning('Role name is required');
    setIsSavingRole(true);
    try {
      if (editingRole) {
        await roleService.updateRole(editingRole._id, { name: roleName.trim(), permissions: permissionsMatrix, status: roleStatus });
        toast.success('Role updated successfully');
      } else {
        await roleService.createRole({ name: roleName.trim(), permissions: permissionsMatrix });
        toast.success('Role created successfully');
      }
      setIsRoleModalOpen(false);
      await loadData();
    } catch (err: any) { toast.error(err.message || 'Failed to save role'); }
    finally { setIsSavingRole(false); }
  };

  const deleteRole = async () => {
    if (!roleToDelete) return;
    setIsDeletingRole(true);
    try {
      await roleService.deleteRole(roleToDelete._id);
      toast.success('Role deleted successfully');
      setRoleToDelete(null);
      await loadData();
    } catch (err: any) { toast.error(err.message || 'Failed to delete role'); }
    finally { setIsDeletingRole(false); }
  };

  return <div className="users-page" id="users-page">
    <div className="page-header">
      <div><h1 className="page-title">User & Role Management</h1><p className="page-subtitle">Admin-only staff accounts, password resets, status and role permissions</p></div>
      <div className="responsive-actions"><Button variant="outline" icon={<Shield size={16} />} onClick={() => openRoleModal()}>Create Role</Button><Button variant="primary" icon={<Plus size={16} />} onClick={() => openUserModal()}>Create Staff User</Button></div>
    </div>

    <DataTransferBar module={activeTab === 'users' ? 'users' : 'roles'} onImported={() => void loadData()} />

    <div className="page-tabs"><button className={`page-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}><Users size={16} /> Staff Accounts ({users.length})</button><button className={`page-tab-btn ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}><ShieldCheck size={16} /> Security Roles ({roles.length})</button></div>

    {activeTab === 'users' ? <Card title="All System Users"><Table<User> data={users} isLoading={isLoading} keyExtractor={(u) => u._id} columns={[
      { header: 'Name', accessor: (u) => <strong>{u.name} {u.isAdmin && <Badge variant="primary">Admin</Badge>}</strong> },
      { header: 'Email', accessor: (u) => u.email },
      { header: 'Role', accessor: (u) => u.isAdmin ? 'All permissions' : typeof u.role === 'object' ? u.role?.name || 'Unassigned' : 'Unassigned' },
      { header: 'E-Sign', accessor: (u) => u.esignUrl ? <img src={u.esignUrl} alt="e-sign" className="esign-thumb" /> : <span className="text-muted">Not uploaded</span> },
      { header: 'Status', accessor: (u) => <Badge variant={u.status === 'Active' ? 'success' : 'danger'}>{u.status}</Badge> },
      { header: 'Actions', accessor: (u) => <div className="table-actions"><button className="action-icon-btn btn-edit" onClick={() => openUserModal(u)} title="Edit user"><Edit2 size={16}/></button><button className="action-icon-btn btn-view" onClick={() => { setResetUser(u); setNewPassword(''); }} title="Reset password"><KeyRound size={16}/></button>{!u.isAdmin && <button className="action-icon-btn btn-delete" onClick={() => setStatusUser(u)} title={u.status === 'Active' ? 'Deactivate user' : 'Activate user'}><Power size={16}/></button>}</div> },
    ]} /></Card> : <Card title="Defined Security Roles"><Table<Role> data={roles} isLoading={isLoading} keyExtractor={(r) => r._id} columns={[
      { header: 'Role Name', accessor: (r) => <strong>{r.name}</strong> },
      { header: 'Status', accessor: (r) => <Badge variant={r.status === 'Active' ? 'success' : 'danger'}>{r.status}</Badge> },
      { header: 'Actions', accessor: (r) => <div className="table-actions"><button className="action-icon-btn btn-edit" onClick={() => openRoleModal(r)} title="Edit role"><Edit2 size={16}/></button>{!r.isSystem && <button className="action-icon-btn btn-delete" onClick={() => setRoleToDelete(r)} title="Delete role"><Trash2 size={16}/></button>}</div> },
    ]} /></Card>}

    <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingUser ? 'Edit Staff User' : 'Create Staff User'} size="md"><form onSubmit={saveUser} className="admin-form-stack"><Input label="Full Name" value={userName} onChange={(e) => setUserName(e.target.value)} isRequired/><Input type="email" label="Email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} isRequired/>{!editingUser && <Input type="password" label="Temporary Password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} isRequired/>}<Input label="Phone" value={userPhone} onChange={(e) => setUserPhone(e.target.value)}/><Select label="Assigned Role" value={userRoleId} onChange={(e) => setUserRoleId(e.target.value)} options={[{value:'',label:'No role'}, ...roles.filter((r) => r.status === 'Active').map((r) => ({value:r._id,label:r.name}))]}/>
      <div className="form-field">
        <label className="form-label">Staff E-Sign</label>
        <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={onEsignChange} className="form-file-input" />
        {userEsignPreview && <img src={userEsignPreview} alt="e-sign preview" className="esign-preview" />}
      </div>
      <div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</Button><Button type="submit" variant="primary" isLoading={isSavingUser} loadingText="Saving...">Save User</Button></div></form></Modal>

    <Modal isOpen={!!resetUser} onClose={() => setResetUser(null)} title={`Reset Password · ${resetUser?.name || ''}`} size="sm"><form onSubmit={resetPassword} className="admin-form-stack"><Input type="password" label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} isRequired/><div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setResetUser(null)}>Cancel</Button><Button type="submit" variant="primary" isLoading={isResetting} loadingText="Resetting...">Reset Password</Button></div></form></Modal>

    <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title={editingRole ? 'Edit Security Role' : 'Create Security Role'} size="lg"><form onSubmit={saveRole} className="admin-form-stack"><div className="form-grid-2"><Input label="Role Name" value={roleName} onChange={(e) => setRoleName(e.target.value)} isRequired/><Select label="Status" value={roleStatus} onChange={(e) => setRoleStatus(e.target.value as 'Active'|'Inactive')} options={[{value:'Active',label:'Active'},{value:'Inactive',label:'Inactive'}]} disabled={!editingRole}/></div><div className="permissions-scroll"><table className="permissions-matrix"><thead><tr><th>Module</th>{ACTIONS.map((a) => <th key={a}>{a}</th>)}</tr></thead><tbody>{MODULES.map((m) => <tr key={m.key}><td>{m.label}</td>{ACTIONS.map((a) => <td key={a}><input type="checkbox" className="permission-checkbox" checked={permissionsMatrix[m.key][a]} onChange={() => togglePermission(m.key,a)}/></td>)}</tr>)}</tbody></table></div><div className="modal-actions"><Button type="button" variant="secondary" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button><Button type="submit" variant="primary" isLoading={isSavingRole} loadingText="Saving...">{editingRole ? 'Update Role' : 'Create Role'}</Button></div></form></Modal>

    <ConfirmDialog isOpen={!!statusUser} onClose={() => setStatusUser(null)} onConfirm={changeStatus} title={statusUser?.status === 'Active' ? 'Deactivate User' : 'Activate User'} message={`Change ${statusUser?.name}'s account status to ${statusUser?.status === 'Active' ? 'Inactive' : 'Active'}?`} confirmText="Confirm" isLoading={isChangingStatus}/>
    <ConfirmDialog isOpen={!!roleToDelete} onClose={() => setRoleToDelete(null)} onConfirm={deleteRole} title="Delete Role" message={`Delete role "${roleToDelete?.name}"?`} confirmText="Delete Role" isLoading={isDeletingRole}/>
  </div>;
};

export default UserManagement;