import coastSmall from '../assets/photography/coast-400.webp'
import coastMedium from '../assets/photography/coast-800.webp'
import coastLarge from '../assets/photography/coast-1600.webp'
import forestSmall from '../assets/photography/forest-400.webp'
import forestMedium from '../assets/photography/forest-800.webp'
import forestLarge from '../assets/photography/forest-1600.webp'
import dunesSmall from '../assets/photography/dunes-400.webp'
import dunesMedium from '../assets/photography/dunes-800.webp'
import dunesLarge from '../assets/photography/dunes-1600.webp'
import citySmall from '../assets/photography/city-400.webp'
import cityMedium from '../assets/photography/city-800.webp'
import cityLarge from '../assets/photography/city-1600.webp'
import architectureSmall from '../assets/photography/architecture-400.webp'
import architectureMedium from '../assets/photography/architecture-800.webp'
import architectureLarge from '../assets/photography/architecture-1600.webp'

const photographs = {
  coast: {
    sources: [coastSmall, coastMedium, coastLarge],
    alt: 'White surf breaking around a rugged rocky coastline, seen from above',
    height: 900,
  },
  forest: {
    sources: [forestSmall, forestMedium, forestLarge],
    alt: 'Low mist drifting over a forest beneath a soft peach sunrise',
    height: 1066,
  },
  dunes: {
    sources: [dunesSmall, dunesMedium, dunesLarge],
    alt: 'Wind-shaped ripples in warm sand, picked out by low sunlight',
    height: 1066,
  },
  city: {
    sources: [citySmall, cityMedium, cityLarge],
    alt: 'A taxi on a rainy Tokyo street, surrounded by signs and reflected light',
    height: 2000,
  },
  architecture: {
    sources: [architectureSmall, architectureMedium, architectureLarge],
    alt: 'A concrete facade with deep window recesses and a sharply angled roofline',
    height: 1066,
  },
} as const

type PhotoProps = {
  name: keyof typeof photographs
  sizes: string
  className?: string
  priority?: boolean
  decorative?: boolean
}

export function Photo({ name, sizes, className = '', priority = false, decorative = false }: PhotoProps) {
  const photo = photographs[name]

  return (
    <img
      className={`photo ${className}`}
      src={photo.sources[1]}
      srcSet={`${photo.sources[0]} 400w, ${photo.sources[1]} 800w, ${photo.sources[2]} 1600w`}
      sizes={sizes}
      width={1600}
      height={photo.height}
      alt={decorative ? '' : photo.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
    />
  )
}

