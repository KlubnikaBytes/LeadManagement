import { getInitials } from '../../utils/helpers'

const colors = [
  'bg-primary-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600',
  'bg-purple-600', 'bg-cyan-600', 'bg-pink-600', 'bg-indigo-600',
]

const getColor = (name) => {
  if (!name) return colors[0]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export const Avatar = ({ name, src, size = 'md' }) => {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }
  const sizeClass = sizes[size] || sizes.md

  if (src) {
    return <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover ring-2 ring-slate-700`} />
  }

  return (
    <div className={`${sizeClass} ${getColor(name)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  )
}
