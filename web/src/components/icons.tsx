import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
});

export const IconPin = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const IconCamera = ({ size = 20, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h1.7l1.2-2h7.2l1.2 2h1.7A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z" />
    <circle cx="12" cy="13" r="3.4" />
  </svg>
);

export const IconSpark = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3.5 13.6 9 19 10.6 13.6 12.3 12 17.8 10.4 12.3 5 10.6 10.4 9Z" />
    <path d="M18.5 16.5 19.2 18.6 21.3 19.3 19.2 20 18.5 22.1 17.8 20 15.7 19.3 17.8 18.6Z" />
  </svg>
);

export const IconSearch = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const IconDoc = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M14 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V7.5Z" />
    <path d="M14 3.5V7a.5.5 0 0 0 .5.5H18" />
    <path d="M9 12.5h6M9 16h4" />
  </svg>
);

export const IconClipboard = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="8" y="4" width="8" height="4" rx="1.2" />
    <path d="M16 6h2A1.5 1.5 0 0 1 19.5 7.5v11A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5v-11A1.5 1.5 0 0 1 6 6h2" />
    <path d="M9 13.5h6M9 16.5h4" />
  </svg>
);

export const IconDownload = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 4v10" />
    <path d="m8 10.5 4 4 4-4" />
    <path d="M5 18.5h14" />
  </svg>
);

export const IconCheck = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const IconReset = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4" />
    <path d="M4.5 5v4h4" />
  </svg>
);

export const IconAlert = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 4.8 21 19.2H3Z" />
    <path d="M12 10v4" />
    <path d="M12 16.6h.01" />
  </svg>
);

export const IconInfo = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </svg>
);

export const IconHelp = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.6 9.6a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.3" />
    <path d="M12 16.7h.01" />
  </svg>
);

export const IconQuestion = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6.5 4.5h11A1.5 1.5 0 0 1 19 6v8.5a1.5 1.5 0 0 1-1.5 1.5h-4.2L10 19.5V16H6.5A1.5 1.5 0 0 1 5 14.5V6a1.5 1.5 0 0 1 1.5-1.5Z" />
    <path d="M10.3 8.4a1.8 1.8 0 1 1 2.4 1.7c-.5.2-.7.6-.7 1v.3" />
    <path d="M12 13.4h.01" />
  </svg>
);

export const IconList = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M9 6.5h10M9 12h10M9 17.5h6" />
    <path d="M5 6.5h.01M5 12h.01M5 17.5h.01" />
  </svg>
);

export const IconEye = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M2.8 12S6.5 5.8 12 5.8 21.2 12 21.2 12 17.5 18.2 12 18.2 2.8 12 2.8 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const IconUser = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="8.5" r="3.7" />
    <path d="M4.8 19.5a7.4 7.4 0 0 1 14.4 0" />
  </svg>
);

export const IconFlag = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M6 21V4.5" />
    <path d="M6 5.2h9.5l-1.6 3.2 1.6 3.2H6" />
  </svg>
);

export const IconPlay = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M8.5 5.8v12.4l10-6.2Z" />
  </svg>
);

export const IconArrowRight = ({ size = 16, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 12h13" />
    <path d="m13 6.5 5.5 5.5-5.5 5.5" />
  </svg>
);

export const IconWrench = ({ size = 22, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M15.5 4.5a4.8 4.8 0 0 0-5.9 6.4L4 16.5 7.5 20l5.6-5.6a4.8 4.8 0 0 0 6.4-5.9l-2.9 2.9-2.6-.6-.6-2.6Z" />
  </svg>
);
