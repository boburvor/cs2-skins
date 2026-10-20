const base = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "square", strokeLinejoin: "miter", "aria-hidden": true };

export const Logo = (p) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" {...p}>
    <rect width="32" height="32" fill="currentColor" />
    <path d="M6 21h14l3-5h3v-3H11l-2 3H6z" fill="#0f1216" />
  </svg>
);
export const IconCase = (p) => (
  <svg {...base} {...p}><path d="M3 8l9-4 9 4v9l-9 4-9-4z" /><path d="M3 8l9 4 9-4M12 12v9" /></svg>
);
export const IconStore = (p) => (
  <svg {...base} {...p}><path d="M4 9h16l-1-5H5zM5 9v11h14V9M10 20v-6h4v6" /></svg>
);
export const IconBag = (p) => (
  <svg {...base} {...p}><path d="M5 7h14l1 14H4zM9 7V5a3 3 0 016 0v2" /></svg>
);
export const IconShield = (p) => (
  <svg {...base} {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></svg>
);
export const IconUser = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 4-7 8-7s7 2 8 7" /></svg>
);
export const IconPlus = (p) => (<svg {...base} {...p}><path d="M12 4v16M4 12h16" /></svg>);
export const IconX = (p) => (<svg {...base} {...p}><path d="M5 5l14 14M19 5L5 19" /></svg>);
