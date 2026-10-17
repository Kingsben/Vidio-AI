import { animationFilms } from '../components/animationFilms'

export const inspirationCategories = [
  'Cinematic',
  'Animation',
  'Marketing',
  'Music & Motion',
  'Nature',
  'Educational',
  'Social Content',
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
}

const animationReferences: InspirationVideo[] = animationFilms.map((film) => ({
  id: film.id,
  title: film.title,
  description: film.description,
  category: ['Animation'],
  source: film.source,
  mimeType: film.mimeType,
  poster: film.poster,
  thumbnail: film.thumbnail,
  sourcePage: film.commons,
  creator: 'See film credits',
  license: 'See film credits',
}))

export const inspirationVideos: InspirationVideo[] = [
  {
    id: 'artemis-timelapse',
    title: 'Artemis III · A journey begins',
    description: 'A NASA Kennedy Space Center timelapse of the SLS core stage arriving in Florida.',
    category: ['Cinematic', 'Educational'],
    source: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/9/9a/Artemis_III_Core_Stage_Arrival_at_KSC_Timelapse_%28KSC-20260427-RV-FMX01-M20626%29.webm/Artemis_III_Core_Stage_Arrival_at_KSC_Timelapse_%28KSC-20260427-RV-FMX01-M20626%29.webm.240p.vp9.webm',
    mimeType: 'video/webm',
    poster: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/Artemis_III_Core_Stage_Arrival_at_KSC_Timelapse_%28KSC-20260427-RV-FMX01-M20626%29.webm/960px--Artemis_III_Core_Stage_Arrival_at_KSC_Timelapse_%28KSC-20260427-RV-FMX01-M20626%29.webm.jpg',
    thumbnail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/Artemis_III_Core_Stage_Arrival_at_KSC_Timelapse_%28KSC-20260427-RV-FMX01-M20626%29.webm/330px--Artemis_III_Core_Stage_Arrival_at_KSC_Timelapse_%28KSC-20260427-RV-FMX01-M20626%29.webm.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Artemis_III_Core_Stage_Arrival_at_KSC_Timelapse_(KSC-20260427-RV-FMX01-M20626).webm',
    creator: 'NASA Kennedy Space Center',
    license: 'Public domain (U.S. Government work)',
  },
  {
    id: 'pico-sacro-timelapse',
    title: 'Pico Sacro · A landscape in time',
    description: 'A nature timelapse of Pico Sacro in Galicia, Spain.',
    category: ['Nature'],
    source: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Pico_Sacro_%28TIMELAPSE%29.webm',
    mimeType: 'video/webm',
    poster: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Pico_Sacro_%28TIMELAPSE%29.webm/960px--Pico_Sacro_%28TIMELAPSE%29.webm.jpg',
    thumbnail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5b/Pico_Sacro_%28TIMELAPSE%29.webm/330px--Pico_Sacro_%28TIMELAPSE%29.webm.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Pico_Sacro_(TIMELAPSE).webm',
    creator: 'Endogamia',
    license: 'CC BY 2.0',
  },
  {
    id: 'abstract-motion-graphics',
    title: 'Abstract Motion Graphics',
    description: 'An independent study of geometric shapes in motion, with music.',
    category: ['Music & Motion'],
    source: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Abstract_Motion_graphics.webm',
    mimeType: 'video/webm',
    poster: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Abstract_Motion_graphics.webm/960px--Abstract_Motion_graphics.webm.jpg',
    thumbnail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Abstract_Motion_graphics.webm/330px--Abstract_Motion_graphics.webm.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Abstract_Motion_graphics.webm',
    creator: 'I-Cheng Lee (design and animation); music credited to freeloops.com',
    license: 'CC BY 3.0',
  },
  {
    id: 'biore-guard-ad',
    title: 'Biore Guard · Barisan Garuk-Garuk',
    description: 'A playful, character-led product spot shared as a commercial-film reference.',
    category: ['Marketing'],
    source: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Biore_Guard_%E2%80%9CBarisan_Garuk-Garuk%E2%80%9D.webm',
    mimeType: 'video/webm',
    poster: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/Biore_Guard_%E2%80%9CBarisan_Garuk-Garuk%E2%80%9D.webm/960px--Biore_Guard_%E2%80%9CBarisan_Garuk-Garuk%E2%80%9D.webm.jpg',
    thumbnail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/Biore_Guard_%E2%80%9CBarisan_Garuk-Garuk%E2%80%9D.webm/330px--Biore_Guard_%E2%80%9CBarisan_Garuk-Garuk%E2%80%9D.webm.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Biore_Guard_%E2%80%9CBarisan_Garuk-Garuk%E2%80%9D.webm',
    creator: 'Ren Bramantyo',
    license: 'CC BY 3.0',
  },
  {
    id: 'shrinking-aral-sea',
    title: 'Shrinking Aral Sea · 2000–2018',
    description: 'A square satellite time-lapse showing two decades of change in the Aral Sea.',
    category: ['Nature', 'Educational', 'Social Content'],
    source: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Shrinking_Aral_Sea_2000-2018.webm',
    mimeType: 'video/webm',
    poster: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/Shrinking_Aral_Sea_2000-2018.webm/500px--Shrinking_Aral_Sea_2000-2018.webm.jpg',
    thumbnail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c4/Shrinking_Aral_Sea_2000-2018.webm/500px--Shrinking_Aral_Sea_2000-2018.webm.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Shrinking_Aral_Sea_2000-2018.webm',
    creator: 'NASA Earth Observatory; animation by Wikimedia user Dexxor',
    license: 'Public domain (NASA)',
  },
  {
    id: 'five-minutes-in-orbit',
    title: 'Five Minutes in Orbit',
    description: 'A five-minute journey above Earth captured from the International Space Station.',
    category: ['Cinematic', 'Nature', 'Educational'],
    source: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Five_Minutes_in_Orbit_%28154728%29.webm',
    mimeType: 'video/webm',
    poster: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Five_Minutes_in_Orbit_%28154728%29.webm/960px--Five_Minutes_in_Orbit_%28154728%29.webm.jpg',
    thumbnail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Five_Minutes_in_Orbit_%28154728%29.webm/330px--Five_Minutes_in_Orbit_%28154728%29.webm.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Five_Minutes_in_Orbit_(154728).webm',
    creator: 'NASA Earth Observatory; imagery by the ISS Expedition 73 crew',
    license: 'Public domain (NASA)',
  },
  {
    id: 'coffee-run',
    title: 'Coffee Run',
    description: 'A cinematic, character-driven short from the Blender Open Movies collection.',
    category: ['Cinematic', 'Animation'],
    source: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3f/Coffee_Run_-_Blender_Open_Movie-full_movie.webm/Coffee_Run_-_Blender_Open_Movie-full_movie.webm.480p.vp9.webm',
    mimeType: 'video/webm; codecs="vp9, opus"',
    poster: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Coffee_Run_-_Blender_Open_Movie-full_movie.webm/960px--Coffee_Run_-_Blender_Open_Movie-full_movie.webm.jpg',
    thumbnail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3f/Coffee_Run_-_Blender_Open_Movie-full_movie.webm/330px--Coffee_Run_-_Blender_Open_Movie-full_movie.webm.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Coffee_Run_-_Blender_Open_Movie-full_movie.webm',
    creator: 'Blender Foundation',
    license: 'CC BY 4.0',
  },
  {
    id: 'joy-and-heron',
    title: 'Joy & Heron',
    description: 'A character-led commercial short about kindness and a fishing trip.',
    category: ['Animation', 'Marketing'],
    source: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/1/1c/Joy_%26_Heron_-_Animated_CGI_Spot_by_Passion_Pictures.webm/Joy_%26_Heron_-_Animated_CGI_Spot_by_Passion_Pictures.webm.480p.vp9.webm',
    mimeType: 'video/webm; codecs="vp9, opus"',
    poster: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1c/Joy_%26_Heron_-_Animated_CGI_Spot_by_Passion_Pictures.webm/960px--Joy_%26_Heron_-_Animated_CGI_Spot_by_Passion_Pictures.webm.jpg',
    thumbnail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1c/Joy_%26_Heron_-_Animated_CGI_Spot_by_Passion_Pictures.webm/330px--Joy_%26_Heron_-_Animated_CGI_Spot_by_Passion_Pictures.webm.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Joy_%26_Heron_-_Animated_CGI_Spot_by_Passion_Pictures.webm',
    creator: 'Passion Pictures; directed by Kyra & Constantin; commissioned by JD.com',
    license: 'CC BY 4.0',
  },
  {
    id: 'caminandes-gran-dillama',
    title: 'Caminandes: Gran Dillama',
    description: 'A playful short about a llama navigating an electric fence.',
    category: ['Animation'],
    source: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/7/7c/Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm/Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm.480p.vp9.webm',
    mimeType: 'video/webm; codecs="vp9, opus"',
    poster: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm/960px--Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm.jpg',
    thumbnail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm/330px--Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Caminandes_-_Gran_Dillama_-_Blender_Foundation%27s_new_Open_Movie.webm',
    creator: 'Pablo Vazquez, Beorn Leonard, and Francesco Siddi; soundtrack by Jan Morgenstern',
    license: 'CC BY-SA 3.0',
  },
  {
    id: 'caminandes-llama-drama',
    title: 'Caminandes: Llama Drama',
    description: 'A short animated adventure from the creators of the Caminandes series.',
    category: ['Animation'],
    source: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/d/d0/Caminandes-_Llama_Drama_-_Short_Movie.ogv/Caminandes-_Llama_Drama_-_Short_Movie.ogv.480p.vp9.webm',
    mimeType: 'video/webm; codecs="vp9, opus"',
    poster: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Caminandes-_Llama_Drama_-_Short_Movie.ogv/960px--Caminandes-_Llama_Drama_-_Short_Movie.ogv.jpg',
    thumbnail: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d0/Caminandes-_Llama_Drama_-_Short_Movie.ogv/330px--Caminandes-_Llama_Drama_-_Short_Movie.ogv.jpg',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Caminandes-_Llama_Drama_-_Short_Movie.ogv',
    creator: 'Pablo Vazquez, Beorn Leonard, and Francesco Siddi; music and sound by Jan Morgenstern',
    license: 'CC BY 3.0',
  },
  ...animationReferences,
]
