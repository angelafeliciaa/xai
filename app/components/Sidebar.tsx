'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Inbox', href: '/inbox', icon: '📥' },
    { name: 'Brands', href: '/brands', icon: '🏢' },
    { name: 'Products', href: '/products', icon: '📦' },
    { name: 'Asset Library', href: '/assets', icon: '🖼️' },
  ];

  const creatorItems = [
    { name: 'Campaigns', href: '/campaigns', icon: '📢' },
    { name: 'Find Creators', href: '/creators', icon: '👥' },
    { name: 'Saved Creators', href: '/saved', icon: '⭐' },
    { name: 'Orders', href: '/orders', icon: '📋' },
  ];

  const accountItems = [
    { name: 'Profile Settings', href: '/settings', icon: '⚙️' },
    { name: 'Billing', href: '/billing', icon: '💳' },
    { name: 'Payment History', href: '/payments', icon: '📊' },
  ];

  return (
    <div className="w-56 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold tracking-tight">UGC Platform</h1>
        <p className="text-xs text-gray-500 mt-1">Brand Account</p>
      </div>

      {/* Subscribe Button */}
      <div className="px-4 pt-4">
        <button className="w-full bg-black text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-900 transition-colors">
          Subscribe Now
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Platform Section */}
        <div className="px-4 mb-6">
          <p className="text-xs font-medium text-gray-500 mb-2 px-2">Platform</p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>

        {/* Creator Marketplace Section */}
        <div className="px-4 mb-6">
          <p className="text-xs font-medium text-gray-500 mb-2 px-2">Creator Marketplace</p>
          {creatorItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>

        {/* Account Section */}
        <div className="px-4">
          <p className="text-xs font-medium text-gray-500 mb-2 px-2">Account</p>
          {accountItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Campaigns Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-500 mb-1">Campaigns</p>
        <p className="text-xs text-gray-400">No active campaigns</p>
        <p className="text-xs text-gray-400 mt-1">Click + to create one</p>
      </div>
    </div>
  );
}

