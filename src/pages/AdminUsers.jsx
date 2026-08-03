import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminNavigation from '../components/AdminNavigation';
import Breadcrumbs from '../components/Breadcrumbs';
import ConfirmModal from '../components/ConfirmModal';
import NotificationModal from '../components/NotificationModal';
import { adminUsers } from '../services/admin';
import { useAuth } from '../contexts/useAuth';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const ROLES = {
  guest: { label: 'Tamu', icon: 'person', variant: 'secondary' },
  admin: { label: 'Admin', icon: 'admin_panel_settings', variant: 'default' },
  manager: { label: 'Manager', icon: 'monitoring', variant: 'warning' },
};

function RoleBadge({ role }) {
  const config = ROLES[role] || { label: role || 'Tidak diketahui', icon: 'help', variant: 'outline' };
  return (
    <Badge variant={config.variant} className="gap-1.5 px-2.5 py-1 text-[11px]">
      <span className="material-symbols-outlined text-[15px]" aria-hidden="true">{config.icon}</span>
      {config.label}
    </Badge>
  );
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingRole, setPendingRole] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: 'success', title: '', message: '' });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await adminUsers.list({ page, limit: 20 });
      setUsers(result.data);
      setTotalUsers(result.total);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat data pengguna.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((profile) => {
      const matchesFilter = filter === 'all' || profile.role === filter;
      const matchesSearch = !query || [profile.full_name, profile.phone, profile.role, profile.id]
        .some((value) => value?.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [users, search, filter]);

  const handleRoleChange = async () => {
    if (!pendingRole) return;
    setProcessing(true);
    try {
      await adminUsers.updateRole(pendingRole.id, pendingRole.role);
      setUsers((currentUsers) => currentUsers.map((profile) => (
        profile.id === pendingRole.id ? { ...profile, role: pendingRole.role } : profile
      )));
      setNotification({
        show: true,
        type: 'success',
        title: 'Role Berhasil Diubah',
        message: `Role ${pendingRole.name || 'pengguna'} sekarang menjadi ${ROLES[pendingRole.role]?.label || pendingRole.role}.`,
      });
      setPendingRole(null);
    } catch (err) {
      setPendingRole(null);
      setNotification({
        show: true,
        type: 'error',
        title: 'Perubahan Gagal',
        message: err.message || 'Role pengguna gagal diubah.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const totalPages = Math.ceil(totalUsers / 20);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  return (
    <main className="page-shell py-8 text-left md:py-12">
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[
          { label: 'Beranda', href: '#/' },
          { label: 'Admin', href: '#/admin/properties' },
          { label: 'Pengguna' },
        ]} />

        <AdminNavigation current="users" />

        <header className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-level-1">
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between md:p-8">
            <div>
              <p className="font-label-md text-xs uppercase tracking-[0.18em] text-tertiary">Admin Console</p>
              <h1 className="mt-2 font-headline-xl-mobile text-primary md:text-[38px] md:leading-[46px] font-bold">
                Kelola Pengguna
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
                Lihat akun terdaftar dan atur role akses sesuai tanggung jawab tim.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-outline-variant/35 bg-surface shadow-level-1">
          <div className="border-b border-outline-variant/35 p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row">
              <label className="flex min-h-11 flex-1 items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-3.5">
                <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">search</span>
                <span className="sr-only">Cari pengguna</span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, telepon, role, atau ID"
                  className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-outline"
                />
              </label>
              <div className="flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3.5 text-sm text-on-surface">
                <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">filter_list</span>
                <span className="sr-only">Filter role</span>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="h-9 border-none bg-transparent p-0 text-sm font-semibold shadow-none focus:shadow-none">
                    <SelectValue placeholder="Semua role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua role</SelectItem>
                    <SelectItem value="guest">Tamu</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {errorMsg ? (
            <div className="m-4 rounded-2xl border border-error/20 bg-error-container/65 px-4 py-3 text-sm text-on-error-container md:m-5">
              {errorMsg}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-3 p-5" aria-label="Memuat pengguna">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-xl bg-surface-container-low" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="m-5 rounded-2xl border border-dashed border-outline-variant px-5 py-14 text-center">
              <span className="material-symbols-outlined text-[44px] text-outline" aria-hidden="true">group_off</span>
              <h2 className="mt-3 text-base font-bold text-on-surface">Pengguna tidak ditemukan</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Ubah pencarian atau filter role.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <caption className="sr-only">Daftar seluruh pengguna</caption>
                  <thead className="border-b border-outline-variant/35 bg-surface-container-low text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-bold">Pengguna</th>
                      <th scope="col" className="px-5 py-3 font-bold">Kontak</th>
                      <th scope="col" className="px-5 py-3 font-bold">Role</th>
                      <th scope="col" className="px-5 py-3 text-right font-bold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/25">
                    {filteredUsers.map((profile) => {
                      const isCurrentUser = profile.id === user?.id;
                      return (
                        <tr key={profile.id} className="align-middle hover:bg-surface-container-low/60">
                          <th scope="row" className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed/45 text-primary">
                                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">person</span>
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-on-surface">{profile.full_name || 'Tanpa nama'}</p>
                                <p className="mt-0.5 max-w-[220px] truncate font-mono text-[10px] text-on-surface-variant" title={profile.id}>{profile.id}</p>
                              </div>
                            </div>
                          </th>
                          <td className="px-5 py-4 text-sm text-on-surface-variant">{profile.phone || '-'}</td>
                          <td className="px-5 py-4"><RoleBadge role={profile.role} /></td>
                          <td className="px-5 py-4 text-right">
                            {isCurrentUser ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">lock</span>
                                Akun Anda
                              </span>
                            ) : (
                              <div className="inline-flex min-h-10 min-w-[130px] items-center rounded-xl border border-outline-variant bg-surface px-3 text-xs font-semibold text-on-surface focus-within:border-primary">
                                <span className="sr-only">Ubah role {profile.full_name || 'pengguna'}</span>
                                <Select
                                  value={profile.role || 'guest'}
                                  onValueChange={(role) => setPendingRole({
                                    id: profile.id,
                                    name: profile.full_name,
                                    currentRole: profile.role,
                                    role,
                                  })}
                                >
                                  <SelectTrigger className="h-8 border-none bg-transparent p-0 text-xs font-semibold shadow-none focus:shadow-none">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="guest">Tamu</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 ? (
                <div className="flex flex-col gap-3 border-t border-outline-variant/35 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-on-surface-variant">Halaman {page} dari {totalPages}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition ${
                          pageNum === page ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm text-on-surface-variant transition hover:bg-surface-container-low hover:text-primary disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>

      <ConfirmModal
        open={pendingRole !== null}
        title="Konfirmasi Perubahan Role"
        message={`Ubah role ${pendingRole?.name || 'pengguna'} dari ${ROLES[pendingRole?.currentRole]?.label || pendingRole?.currentRole} menjadi ${ROLES[pendingRole?.role]?.label || pendingRole?.role}?`}
        confirmLabel="Ya, Ubah Role"
        cancelLabel="Batal"
        confirmVariant="default"
        icon="manage_accounts"
        onConfirm={handleRoleChange}
        onCancel={() => setPendingRole(null)}
        processing={processing}
      />

      <NotificationModal
        open={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification({ show: false, type: 'success', title: '', message: '' })}
      />
    </main>
  );
}
