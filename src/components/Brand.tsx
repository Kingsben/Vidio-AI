export function Brand({ markOnly = false }: { markOnly?: boolean }) {
  return (
    <span className="brand">
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="m3 7 10 19h6L9 7H3Z" fill="currentColor" />
        <path d="m18 7 5 10 6-10H18Z" className="brand-detail" />
      </svg>
      {!markOnly && <span>vidio<span className="brand-ai">AI</span></span>}
    </span>
  )
}

const paths = {
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  down: 'M12 5v14m-5-5 5 5 5-5',
  video: 'M4 5h16v14H4zM10 9l5 3-5 3z',
  image: 'M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 6M16 8h.01',
  edit: 'M5 3v18M19 3v18M2 8h6M16 16h6M12 3v18M9 12h6',
  voice: 'M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4',
  captions: 'M3 5h18v14H3zM10 10H7v4h3m7-4h-3v4h3',
  library: 'M3 7h7l2 2h9v11H3zM3 7V4h7l2 3h7',
  publish: 'M12 16V3m-5 5 5-5 5 5M4 13v7h16v-7',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M6 18 18 6',
} as const

export function Icon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
