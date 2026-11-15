const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const icon = (paths) =>
  function Icon({ className = 'h-5 w-5' }) {
    return (
      <svg {...base} className={className}>
        {paths}
      </svg>
    );
  };

export const SearchIcon = icon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
);
export const PlusIcon = icon(<path d="M12 5v14M5 12h14" />);
export const ChevronDownIcon = icon(<path d="m6 9 6 6 6-6" />);
export const ChevronLeftIcon = icon(<path d="m15 6-6 6 6 6" />);
export const ChevronRightIcon = icon(<path d="m9 6 6 6-6 6" />);
export const ArrowLeftIcon = icon(<path d="M20 12H4m6-6-6 6 6 6" />);
export const CloseIcon = icon(<path d="M18 6 6 18M6 6l12 12" />);
export const CheckIcon = icon(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const ClockIcon = icon(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>,
);
export const TrashIcon = icon(
  <path d="M4.5 6.5h15M10 10.5v6m4-6v6M6.5 6.5l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12M9.5 6.5V4h5v2.5" />,
);
export const EditIcon = icon(
  <>
    <path d="M11 4.5H6a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h11.5a2 2 0 0 0 2-2v-5" />
    <path d="M17.6 3.4a2 2 0 0 1 2.9 2.9l-8 8-3.7.8.8-3.7z" />
  </>,
);
export const CalendarIcon = icon(
  <>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3v4m8-4v4M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
  </>,
);
/** Checkbox glyph used on the "Task Complete" card. */
export const CheckSquareIcon = icon(
  <>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="m8 12.5 3 3 5-6" />
  </>,
);
/** Crossed box used on the "Task Pending" card. */
export const XSquareIcon = icon(
  <>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="m9 9 6 6m0-6-6 6" />
  </>,
);
