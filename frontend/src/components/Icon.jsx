// A small hand-rolled icon set.
//
// Deliberately not a dependency: the project's package-lock.json has no
// icon library in it, and pulling one in for ~15 glyphs would add a
// install step and bundle weight for something a few paths cover. All
// icons share a 24px grid, 1.6 stroke, round caps — consistent weight
// matters more than variety here.
//
// Icons are decorative by default (aria-hidden): every one of them sits
// next to a real text label, so announcing them would just duplicate it.
// Pass a `title` when an icon ever has to stand alone.
const PATHS = {
  home: <path d="M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5" />,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c.7-3.8 3.8-6 7.5-6s6.8 2.2 7.5 6" /></>,
  document: <><path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 1.5-1.5V7.5z" /><path d="M14 3v4.5h4.5M9 12.5h6M9 16h4" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8.2 12.3 2.6 2.6 5-5.4" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>,
  compass: <><circle cx="12" cy="12" r="8.5" /><path d="m15 9-2 4.2-4 1.8 2-4.2z" /></>,
  columns: <><rect x="3.5" y="4.5" width="7" height="15" rx="1.2" /><rect x="13.5" y="4.5" width="7" height="15" rx="1.2" /></>,
  play: <><circle cx="12" cy="12" r="8.5" /><path d="M10.2 8.8 15.5 12l-5.3 3.2z" /></>,
  chart: <path d="M4 19.5V4m0 15.5h16M7.5 16v-4.5M12 16V8m4.5 8v-6.5" />,
  activity: <path d="M3.5 12.5h4l2.5-6 3.5 11 2.5-5h4.5" />,
  shield: <><path d="M12 3.2 19 6v5.6c0 4-2.9 7.5-7 9.2-4.1-1.7-7-5.2-7-9.2V6z" /><path d="m9 12 2.2 2.2L15.3 10" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6.5 6.5 11 11m0-11-11 11" />,
  upload: <path d="M12 16V4.5m0 0L8 8.5m4-4 4 4M4.5 15v3.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V15" />,
  arrow: <path d="M5 12h13m0 0-5-5m5 5-5 5" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  refresh: <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3m.2-3.2v3.6h-3.6" />,
  alert: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.8v4.7m0 3h.01" /></>,
  sparkle: <path d="M12 4.2 13.6 9 18.4 10.6 13.6 12.2 12 17l-1.6-4.8L5.6 10.6 10.4 9z" />,
};

export default function Icon({ name, className = '', size, title }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {path}
    </svg>
  );
}
