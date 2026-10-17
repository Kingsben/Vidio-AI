function StorybookArt() {
  return (
    <svg
      className="storybook-art"
      viewBox="0 0 900 650"
      role="img"
      aria-labelledby="storybook-art-title storybook-art-description"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="storybook-art-title">Mira the fox and the moonseed</title>
      <desc id="storybook-art-description">Original storybook illustration of a young fox discovering a glowing seed in a quiet moonlit forest.</desc>
      <defs>
        <linearGradient id="storybook-sky" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#19232c" />
          <stop offset="1" stopColor="#34434a" />
        </linearGradient>
        <linearGradient id="storybook-hill" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#758674" />
          <stop offset="1" stopColor="#3f574f" />
        </linearGradient>
        <radialGradient id="storybook-glow">
          <stop stopColor="#f4d893" stopOpacity=".52" />
          <stop offset="1" stopColor="#f4d893" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path fill="url(#storybook-sky)" d="M0 0h900v650H0z" />
      <circle cx="701" cy="157" r="82" fill="#d8d0b7" opacity=".95" />
      <circle cx="735" cy="132" r="82" fill="#202c34" />
      <g className="storybook-stars" fill="#e9d9ad">
        <path d="m174 104 5 12 12 5-12 5-5 12-5-12-12-5 12-5z" />
        <path d="m412 81 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <circle cx="290" cy="173" r="3" />
        <circle cx="571" cy="106" r="3" />
        <circle cx="783" cy="267" r="2.5" />
        <circle cx="103" cy="225" r="2.5" />
      </g>
      <path fill="#34444a" d="M0 362c109-90 206-110 310-55 102-92 204-100 310-26 100-55 192-46 280 5v364H0z" />
      <path fill="#526a5b" d="M0 431c129-86 241-77 338 27 117-91 228-84 331 20 73-47 150-55 231-23v195H0z" />
      <path fill="url(#storybook-hill)" d="M0 515c152-84 289-75 411 28 139-103 302-111 489-24v131H0z" />
      <path fill="#283d38" d="M0 583c135-59 244-54 328 13 165-76 355-74 572 5v49H0z" />
      <g fill="#263a37">
        <path d="m82 411 39-136 39 136h-24l31 42H72l31-42z" />
        <path d="m161 433 26-93 27 93h-17l23 30h-67l23-30z" />
        <path d="m773 416 39-139 40 139h-25l31 43h-91l31-43z" />
        <path d="m706 453 29-102 29 102h-18l24 33h-70l24-33z" />
      </g>
      <g className="storybook-fireflies" fill="#f2d894">
        <circle cx="175" cy="509" r="3" />
        <circle cx="742" cy="503" r="2.5" />
        <circle cx="670" cy="554" r="3" />
        <circle cx="253" cy="559" r="2.5" />
      </g>
      <ellipse cx="491" cy="516" rx="143" ry="77" fill="url(#storybook-glow)" />
      <g className="storybook-seed">
        <path fill="#f1d897" d="m492 420 9 22 22 9-22 9-9 22-9-22-22-9 22-9z" />
        <circle cx="492" cy="451" r="34" fill="#f1d897" opacity=".12" />
      </g>
      <g className="storybook-fox">
        <path fill="#c87953" d="M552 479c51 0 82 28 77 62-4 28-41 42-82 23-28-13-55-8-75 2l-5-25c24-37 48-62 85-62z" />
        <path fill="#edaa72" d="M599 518c27 1 43 16 38 29-4 13-22 17-42 8-12-6-24-6-36-1 7-21 19-37 40-36z" />
        <path fill="#c87953" d="M446 391c-25-23-33-53-22-82 30 9 50 27 60 52 19-36 45-54 78-55 0 31-10 57-31 76 28 20 41 50 36 88-6 44-40 74-91 74-51 0-85-30-91-74-5-33 7-59 34-79z" />
        <path fill="#f0c18e" d="M426 321c8 10 17 24 21 41l-28-15c1-9 3-18 7-26zm116-5c6 8 9 17 10 27l-28 14c4-16 10-30 18-41z" />
        <path fill="#f5e5ce" d="M463 426c11-12 23-18 35-18 13 0 25 6 36 18-1 28-16 47-36 47-19 0-34-19-35-47z" />
        <ellipse cx="459" cy="406" rx="5" ry="7" fill="#2d2927" />
        <ellipse cx="535" cy="406" rx="5" ry="7" fill="#2d2927" />
        <path fill="#3d302a" d="M490 430h14l-7 7z" />
        <path d="M497 437c-4 8-10 9-15 7m15-7c4 8 10 9 15 7" fill="none" stroke="#60463c" strokeLinecap="round" strokeWidth="3" />
      </g>
      <g className="storybook-book">
        <path fill="#b97656" d="m369 500 51-12 35 16v68l-36-17-50 13z" />
        <path fill="#ecdcbf" d="m420 488 35 16v68l-36-17z" />
        <path d="m379 507 32-8m-32 18 32-8m-31 37 31-8" fill="none" stroke="#f2e5d1" strokeLinecap="round" strokeWidth="3" opacity=".7" />
      </g>
      <path fill="none" stroke="#d5c7a8" strokeOpacity=".55" d="M1 1h898v648H1z" />
    </svg>
  )
}

export default StorybookArt
