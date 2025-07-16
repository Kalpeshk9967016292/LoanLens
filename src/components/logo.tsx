export function Logo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary"
    >
      <path
        d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"
        stroke="currentColor"
        strokeWidth="2"
        fill="hsl(var(--primary) / 0.1)"
      />
      <path
        d="M21 21l-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 11.5L8.5 10L10 11.5L11.5 10L13 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
