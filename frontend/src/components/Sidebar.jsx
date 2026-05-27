import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Phone, Package, Users, PhoneCall } from 'lucide-react'

const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/agent', icon: Phone, label: 'Sales Agent' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/calls', icon: PhoneCall, label: 'Call Logs' },
]

export default function Sidebar() {
    return (
        <aside className="w-56 min-h-screen bg-stone-800 flex flex-col">
            <div className="p-5 border-b border-stone-700">
                <div className="text-white font-bold text-lg">Sales Agent</div>
                <div className="text-stone-400 text-xs mt-1">AI powered calling</div>
            </div>

            <nav className="flex-1 mt-2">
                {links.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-5 py-3 text-sm transition-colors
              ${isActive
                                ? 'bg-stone-600 text-white font-medium border-l-4 border-amber-400'
                                : 'text-stone-300 hover:bg-stone-700 hover:text-white border-l-4 border-transparent'
                            }`
                        }
                    >
                        <Icon size={17} />
                        {label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    )
}