import type { InspirationCategory } from './inspirationVideos'
import type { ProjectInput } from './projects'

export interface BriefTemplate extends ProjectInput {
  id: string
  label: string
  description: string
}

// Templates are editable starting points. Only the existing title, brief and
// format fields are saved; choosing a template never creates a cloud project.
export const briefTemplates: readonly BriefTemplate[] = [
  {
    id: 'cinematic',
    label: 'Cinematic scene',
    description: 'Shape a text-led scene with deliberate action, light and camera movement.',
    title: 'A cinematic moment',
    format: 'landscape',
    brief: 'Goal: Create a short cinematic scene for [audience].\nSubject and setting: [Who or what] in [place and time of day].\nAction: One clear moment: [what happens, from beginning to end].\nVisual direction: [realistic or stylized], [lighting], [colour palette].\nCamera: [shot size] with [one simple camera movement].\nTiming and sound: [duration], [ambience, dialogue or silence].\nKeep consistent: [character, wardrobe, environment]. Avoid: [unwanted elements].',
  },
  {
    id: 'image-to-video',
    label: 'Image-to-video direction',
    description: 'Plan how an image should move, with clear details to preserve.',
    title: 'Bring a still image to life',
    format: 'landscape',
    brief: 'Goal: Animate an image I own or have permission to use.\nReference image description: [subject, composition, setting]. The image is not uploaded with this brief.\nMotion: [one subtle subject action] and [environmental movement].\nCamera: [locked shot, slow push-in or gentle pan].\nPreserve: [identity, product shape, colours and composition].\nTiming: [duration] and [start/end pose or loop].\nSound direction: [ambience or silence]. Avoid: [distortion, unwanted new objects].',
  },
  {
    id: 'animation-2d',
    label: '2D animation',
    description: 'Outline an expressive character moment in a drawn visual style.',
    title: 'A little animated story',
    format: 'landscape',
    brief: 'Goal and audience: [message] for [audience].\nCharacter: [original character, appearance and personality].\nSetting: [simple background].\nStory beat: [setup], [one action], [ending].\nStyle: 2D animation with [linework, palette and texture].\nMovement: [gesture, expression and pacing].\nTiming and sound: [duration], [dialogue, effects or silence].\nKeep consistent: [character proportions and colours]. Avoid: [unwanted elements].',
  },
  {
    id: 'animation-3d',
    label: '3D animation',
    description: 'Describe materials, lighting and movement for a dimensional scene.',
    title: 'An animated world in 3D',
    format: 'landscape',
    brief: 'Goal: [story or visual message] for [audience].\nSubject: [original character or object] in [environment].\nAction: [one clear action with a beginning and ending].\nStyle: 3D animation with [stylized or realistic shapes] and [materials].\nLighting and camera: [lighting mood], [shot size], [one movement].\nTiming and sound: [duration], [sound direction].\nKeep consistent: [design and environment]. Avoid: [unwanted details].',
  },
  {
    id: 'childrens-cartoon',
    label: 'Children’s cartoon',
    description: 'Plan a gentle, age-appropriate story using original characters.',
    title: 'A small adventure for young viewers',
    format: 'landscape',
    brief: 'Audience: Children aged [age range].\nLearning or story goal: [one simple idea].\nOriginal characters: [names, appearance and personality].\nSetting: [friendly, easy-to-read environment].\nStory: [setup], [gentle challenge], [kind or playful resolution].\nVisual direction: [2D or 3D], [palette], [clear expressions].\nTiming and sound: [duration], [simple dialogue or narration].\nKeep age-appropriate; avoid frightening imagery, unsafe actions and excessive flashing.',
  },
  {
    id: 'product-ad',
    label: 'Product advertisement',
    description: 'Turn a real product benefit into a focused commercial brief.',
    title: 'A product worth noticing',
    format: 'portrait',
    brief: 'Product and audience: [product] for [customer].\nGoal: [one action viewers should take].\nVerified benefit: [a truthful product claim].\nSequence: [opening hook], [product in use], [closing product shot].\nVisual direction: [background, lighting, palette and camera].\nTiming: [duration] for [channel].\nSound and text: [voiceover or ambience]; plan any final text or logo for editing.\nPreserve: [product shape, packaging and brand colours]. Avoid: [unsupported claims or unwanted elements].',
  },
  {
    id: 'music-video',
    label: 'Music & motion',
    description: 'Map a visual rhythm to audio you have permission to use.',
    title: 'A visual rhythm',
    format: 'landscape',
    brief: 'Goal: A visual sequence for [music or mood].\nAudio rights: [owned or licensed track]; no audio is uploaded with this brief.\nVisual subject: [performer, original character or abstract shapes].\nStyle: [palette, texture, lighting and setting].\nMovement: [repeating action or transformation] following [tempo or rhythm].\nCamera and cuts: [shot direction and intended edit points].\nTiming: [duration or section of track].\nKeep consistent: [visual motif]. Avoid: [flashing or unwanted elements].',
  },
  {
    id: 'social-short',
    label: 'Social short',
    description: 'Plan a vertical hook, one message and a clear ending.',
    title: 'One idea in a social short',
    format: 'portrait',
    brief: 'Audience and channel: [who and where].\nMessage: [one takeaway].\nOpening hook: [first visual moment].\nMain action: [one clear demonstration or story beat].\nEnding: [resolution or call to action].\nVisual direction: [subject, setting, light and mood]. Keep the key action centred in a vertical frame.\nTiming and sound: [duration], [voiceover, ambience or silence].\nPlan captions and readable text for editing. Avoid: [clutter or unwanted elements].',
  },
  {
    id: 'educational',
    label: 'Educational explainer',
    description: 'Make one concept understandable with accurate visual steps.',
    title: 'An idea made clear',
    format: 'landscape',
    brief: 'Audience and learning goal: [who] should understand [one concept].\nFacts to verify: [sources and claims].\nVisual sequence: [starting example], [one clear change or demonstration], [takeaway].\nStyle: [live-action, 2D, 3D or diagram direction].\nCamera and pacing: [clear framing and time to understand each step].\nTiming and sound: [duration], [narration or silence].\nPlan labels, captions and citations for editing. Avoid: [misleading imagery or unnecessary detail].',
  },
]

export function getBriefTemplate(id: string | null | undefined): BriefTemplate | undefined {
  return briefTemplates.find((template) => template.id === id)
}

const categoryTemplateIds: Record<InspirationCategory, string> = {
  Cinematic: 'cinematic',
  Animation: 'animation-3d',
  Marketing: 'product-ad',
  'Music & Motion': 'music-video',
  Nature: 'cinematic',
  Educational: 'educational',
  'Social Content': 'social-short',
}

export function getCategoryBriefTemplate(category: InspirationCategory): BriefTemplate {
  return briefTemplates.find((template) => template.id === categoryTemplateIds[category])!
}

export function createBriefPath(templateId?: string): string {
  const template = getBriefTemplate(templateId)
  return template ? `/app/projects/new?template=${encodeURIComponent(template.id)}` : '/app/projects/new'
}
