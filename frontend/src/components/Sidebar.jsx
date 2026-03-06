import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.is_super_admin || user?.email === 'admin@digisanduk';
  const isOrgAdmin = user?.is_org_admin;
  const isEmployee = !isSuperAdmin && !isOrgAdmin;

  const navItems = [
    { to: '/', label: 'Dashboard', description: 'Threat overview' },

    ...(isSuperAdmin
      ? [
          { to: '/admin', label: 'Super Admin', description: 'Orgs, users, trust' },
          { to: '/audit', label: 'Audit Logs', description: 'Global activity' }
        ]
      : []),

    ...(isOrgAdmin
      ? [
          { to: '/admin/team', label: 'Team', description: 'Add employees' },
          { to: '/requests', label: 'Data Requests', description: 'Request intel' },
          { to: '/approvals', label: 'Manage Requests', description: 'Approve & toggle sharing' },
          { to: '/share', label: 'Share Data', description: 'Outbound shares' },
          { to: '/received', label: 'Shared With Me', description: 'Inbound feeds' },
          { to: '/integrations', label: 'Integrations', description: 'SIEM setup' },
          { to: '/monitoring', label: 'Monitoring', description: 'Live alerts' }
        ]
      : []),

    ...(isEmployee
      ? [
          { to: '/share', label: 'Share Data', description: 'Outbound shares' },
          { to: '/received', label: 'Shared With Me', description: 'Inbound feeds' }
        ]
      : []),

    { to: '/profile', label: 'Profile', description: 'Edit your profile' }
  ];

  return (
    <aside className="hidden w-72 flex-col border-r border-cyan/10 bg-midnight/80 p-6 lg:flex">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-haze">Secure Console</p>
        <div className="mt-4 flex items-center gap-4">
          <img src="/logo.png" alt="DigiSanduk" className="h-24 w-24 rounded-3xl border border-gold/40 shadow-glow" />
          <h2 className="text-2xl font-semibold brand-gold">DigiSanduk</h2>
        </div>
        <p className="mt-2 text-sm text-haze">Enterprise-grade data sharing for security teams.</p>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `rounded-2xl border border-transparent px-4 py-3 transition ${
                isActive
                  ? 'bg-carbon/80 border-cyan/30 text-white shadow-glow'
                  : 'text-haze hover:border-cyan/10 hover:bg-carbon/40 hover:translate-x-1'
              }`
            }
          >
            <p className="text-sm font-semibold">{item.label}</p>
            <p className="text-xs text-haze">{item.description}</p>
          </NavLink>
        ))}
      </nav>

      <div className="rounded-2xl border border-cyan/10 bg-carbon/70 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-haze">System Status</p>
        <p className="mt-2 text-sm text-white">All channels operational</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-neon">
          <span className="h-2 w-2 rounded-full bg-neon" />
          Live monitoring enabled
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
