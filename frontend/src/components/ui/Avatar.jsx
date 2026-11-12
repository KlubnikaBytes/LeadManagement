import { getInitials } from '../../utils/helpers'

const colors = [
  'bg-kb-strawberry', 'bg-kb-cocoa', 'bg-kb-umber', 'bg-kb-crimson',
  'bg-kb-espresso', 'bg-kb-won-fg', 'bg-kb-teal-fg', 'bg-kb-amber-fg',
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
    return <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover ring-2 ring-kb-sand`} />
  }

  return (
    <div className={`${sizeClass} ${getColor(name)} rounded-full flex items-center justify-center text-kb-white font-semibold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  )
}
