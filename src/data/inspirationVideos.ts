export const inspirationCategories = [
  'Cinematic', 'Animation', 'Marketing', 'Music & Motion', 'Nature', 'Educational', 'Social Content',
] as const
export type InspirationCategory = (typeof inspirationCategories)[number]

export interface InspirationVideo {
  id: string
  title: string
  description: string
  category: InspirationCategory[]
  source: string
  mimeType: string
  poster: string
  thumbnail: string
  sourcePage: string
  creator: string
  license: string
  licenseUrl: string
  hasAudio: boolean
  audioNote: string
}

// Availability is determined by the media element at runtime, never by a saved
// verification label or a poster request. All previews are served by this app.
const media = (id: string, extension: 'mp4' | 'webp') => `${import.meta.env.BASE_URL}videos/${id}.${extension}`

export const inspirationVideos: InspirationVideo[] = [
  {
    id: "sintel-trailer",
    hasAudio: true,
    audioNote: "Original source audio included",
    title: "Sintel · A journey through a fantasy world",
    description: "A trailer for Blender Foundation’s independently produced fantasy short. A 12-second excerpt.",
    category: ["Cinematic", "Animation"],
    source: media('sintel-trailer', 'mp4'),
    mimeType: 'video/mp4',
    poster: media('sintel-trailer', 'webp'),
    thumbnail: media('sintel-trailer', 'webp'),
    sourcePage: "https://durian.blender.org/about/",
    creator: "(c) copyright Blender Foundation | durian.blender.org",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
  },
  {
    id: "pico-sacro-timelapse",
    hasAudio: false,
    audioNote: "Source audio track is silent",
    title: "Pico Sacro · A landscape in time",
    description: "A nature timelapse of Pico Sacro in Galicia, Spain. A 12-second excerpt.",
    category: ["Nature"],
    source: media('pico-sacro-timelapse', 'mp4'),
    mimeType: 'video/mp4',
    poster: media('pico-sacro-timelapse', 'webp'),
    thumbnail: media('pico-sacro-timelapse', 'webp'),
    sourcePage: "https://commons.wikimedia.org/wiki/File:Pico_Sacro_(TIMELAPSE).webm",
    creator: "Endogamia",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
  },
  {
    id: "abstract-motion-graphics",
    hasAudio: false,
    audioNote: "Source file has no audio track",
    title: "Abstract Motion Graphics",
    description: "An independent study of geometric shapes in motion. A 12-second excerpt.",
    category: ["Music & Motion"],
    source: media('abstract-motion-graphics', 'mp4'),
    mimeType: 'video/mp4',
    poster: media('abstract-motion-graphics', 'webp'),
    thumbnail: media('abstract-motion-graphics', 'webp'),
    sourcePage: "https://commons.wikimedia.org/wiki/File:Abstract_Motion_graphics.webm",
    creator: "I-Cheng Lee (design and animation); music credited to freeloops.com",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
  },
  {
    id: "biore-guard-ad",
    hasAudio: true,
    audioNote: "Original source audio included",
    title: "Biore Guard · Barisan Garuk-Garuk",
    description: "A playful, character-led product spot shared as a commercial-film reference. A 12-second excerpt.",
    category: ["Marketing"],
    source: media('biore-guard-ad', 'mp4'),
    mimeType: 'video/mp4',
    poster: media('biore-guard-ad', 'webp'),
    thumbnail: media('biore-guard-ad', 'webp'),
    sourcePage: "https://commons.wikimedia.org/wiki/File:Biore_Guard_%E2%80%9CBarisan_Garuk-Garuk%E2%80%9D.webm",
    creator: "Ren Bramantyo",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
  },
  {
    id: "shrinking-aral-sea",
    hasAudio: false,
    audioNote: "Source file has no audio track",
    title: "Shrinking Aral Sea · 2000–2018",
    description: "A square satellite time-lapse showing two decades of change in the Aral Sea. A 12-second excerpt.",
    category: ["Nature", "Educational", "Social Content"],
    source: media('shrinking-aral-sea', 'mp4'),
    mimeType: 'video/mp4',
    poster: media('shrinking-aral-sea', 'webp'),
    thumbnail: media('shrinking-aral-sea', 'webp'),
    sourcePage: "https://commons.wikimedia.org/wiki/File:Shrinking_Aral_Sea_2000-2018.webm",
    creator: "NASA Earth Observatory; animation by Wikimedia user Dexxor",
    license: "Public domain (NASA)",
    licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
  },
  {
    id: "five-minutes-in-orbit",
    hasAudio: false,
    audioNote: "Source audio track is silent",
    title: "Five Minutes in Orbit",
    description: "An orbital timelapse above Earth captured from the International Space Station. A 12-second excerpt.",
    category: ["Cinematic", "Nature", "Educational"],
    source: media('five-minutes-in-orbit', 'mp4'),
    mimeType: 'video/mp4',
    poster: media('five-minutes-in-orbit', 'webp'),
    thumbnail: media('five-minutes-in-orbit', 'webp'),
    sourcePage: "https://commons.wikimedia.org/wiki/File:Five_Minutes_in_Orbit_(154728).webm",
    creator: "NASA Earth Observatory; imagery by the ISS Expedition 73 crew",
    license: "Public domain (NASA)",
    licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
  },
]

export const featuredReferenceVideo = inspirationVideos[0]
