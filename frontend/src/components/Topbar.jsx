import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const routeTitles = [
  { match: '/', label: 'Dashboard' },
  { match: '/admin', label: 'Super Admin' },
  { match: '/admin/team', label: 'Team Management' },
  { match: '/requests', label: 'Data Requests' },
  { match: '/approvals', label: 'Manage Requests' },
  { match: '/share', label: 'Share Data' },
  { match: '/received', label: 'Shared With Me' },
  { match: '/integrations', label: 'Integrations' },
  { match: '/audit', label: 'Audit Logs' },
  { match: '/monitoring', label: 'Monitoring' },
  { match: '/profile', label: 'Profile' }
];

const Topbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.is_super_admin || user?.email === 'admin@digisanduk';
  const isOrgAdmin = user?.is_org_admin;
  const canShare = !isSuperAdmin;

  const mobileNavItems = [
    { to: '/', label: 'Dashboard' },
    ...(isSuperAdmin
      ? [
          { to: '/admin', label: 'Admin' },
          { to: '/audit', label: 'Audit' }
        ]
      : []),
    ...(isOrgAdmin
      ? [
          { to: '/admin/team', label: 'Team' },
          { to: '/requests', label: 'Requests' },
          { to: '/approvals', label: 'Manage' },
          { to: '/share', label: 'Share' },
          { to: '/received', label: 'Received' },
          { to: '/integrations', label: 'SIEM' },
          { to: '/monitoring', label: 'Monitor' }
        ]
      : []),
    ...(!isOrgAdmin && canShare
      ? [
          { to: '/share', label: 'Share' },
          { to: '/received', label: 'Received' }
        ]
      : []),
    { to: '/profile', label: 'Profile' }
  ];

  const current = routeTitles.find((route) =>
    route.match === '/' ? location.pathname === '/' : location.pathname.startsWith(route.match)
  );

  const displayName = user?.name ? `${user.name} (${user?.email || ''})` : (user?.email || user?.username || user?.sub || 'Security Operator');

  return (
    <header className="sticky top-0 z-20 border-b border-cyan/10 bg-midnight/80 backdrop-blur">
      <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-haze">Active Workspace</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{current?.label || 'Console'}</h2>
          <p className="text-xs text-haze">Signed in as {displayName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-cyan/30 px-3 py-1 text-xs text-cyan shimmer-line">JWT Guarded</span>
          <button type="button" onClick={logout} className="button-secondary">
            Log out
          </button>
        </div>
      </div>
      <nav className="flex gap-3 overflow-x-auto border-t border-cyan/10 px-6 py-3 text-xs text-haze lg:hidden">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `rounded-full px-3 py-1 ${isActive ? 'bg-carbon text-white' : 'text-haze'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

export default Topbar;
