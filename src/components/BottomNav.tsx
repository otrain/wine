import { NavLink } from 'react-router-dom'
import { Home, List, BarChart2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

export const NAV_HEIGHT = 64

const LINKS = [
  { to: '/',        icon: Home,     label: 'Home' },
  { to: '/wines',   icon: List,     label: 'Wines' },
  { to: '/explore', icon: BarChart2,label: 'Explore' },
  { to: '/export',  icon: Download, label: 'Export' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 z-40">
      <div className="max-w-lg mx-auto flex">
        {LINKS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors min-h-[56px] justify-center',
                isActive ? 'text-rose-400' : 'text-zinc-500 hover:text-zinc-300'
              )
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
