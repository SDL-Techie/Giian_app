import React, { useState } from 'react';
import { UserCheck, Lock, User as UserIcon, Phone, Mail, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import authService from '../../services/auth.service';
import Card from '../../components/common/card/Card';
import Button from '../../components/common/button/Button';
import Input from '../../components/common/input/Input';
import Badge from '../../components/common/badge/Badge';
import './Profile.css';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  // Profile details state
  const [name, setName] = useState(user?.name || '');
  const [phoneno, setPhoneno] = useState(user?.phoneno || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be blank');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updatedUser = await authService.updateProfile({
        name,
        phoneno: phoneno.trim() || undefined,
      });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error('Current password is required');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: oldPassword,
        newPassword,
      });
      toast.success('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="profile-page" id="profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Account Profile</h1>
          <p className="page-subtitle">Manage personal profile details, account credentials and security settings</p>
        </div>
      </div>

      <div className="profile-layout">
        {/* Left Side: Overview Card */}
        <Card>
          <div className="profile-overview-card">
            <div className="profile-avatar-large">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-name">{user?.name}</div>
            <div className="profile-email">{user?.email}</div>
            <div style={{ marginTop: '10px' }}>
              <Badge variant={user?.isAdmin ? 'primary' : 'neutral'}>
                {user?.isAdmin ? 'Administrator' : 'Staff Member'}
              </Badge>
            </div>

            <div className="profile-meta-list">
              <div className="profile-meta-item">
                <span>Account Status:</span>
                <strong style={{ color: 'var(--color-success)' }}>Active</strong>
              </div>
              <div className="profile-meta-item">
                <span>Role:</span>
                <strong>
                  {user?.isAdmin
                    ? 'Super Admin'
                    : typeof user?.role === 'object'
                    ? user.role?.name
                    : 'Standard Staff'}
                </strong>
              </div>
              <div className="profile-meta-item">
                <span>Phone:</span>
                <span>{user?.phoneno || 'Not set'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Side: Edit Profile & Change Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Update Profile Details">
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={<UserIcon size={18} />}
                isRequired
              />

              <Input
                label="Email Address"
                value={user?.email || ''}
                icon={<Mail size={18} />}
                disabled
                helperText="Email cannot be changed directly"
              />

              <Input
                label="Phone Number"
                value={phoneno}
                onChange={(e) => setPhoneno(e.target.value)}
                icon={<Phone size={18} />}
                placeholder="+1 555-0100"
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isUpdatingProfile}
                  loadingText="Updating Profile..."
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Change Account Password">
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                type="password"
                label="Current Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                icon={<Lock size={18} />}
                isRequired
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  icon={<KeyRound size={18} />}
                  isRequired
                />
                <Input
                  type="password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  icon={<KeyRound size={18} />}
                  isRequired
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isChangingPassword}
                  loadingText="Updating Password..."
                >
                  Change Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
