export default function DetailBackNavigation({ children, onBack, label = '상세 탐색' }) {
  return (
    <nav
      className="flex flex-none flex-wrap items-center gap-x-3 gap-y-2 px-[18px] pt-2.5"
      aria-label={label}
    >
      <button
        type="button"
        className="border-0 bg-transparent p-0 text-xs/[1.5]! text-[#91aac4]! hover:bg-transparent! hover:text-dashboard-text! hover:underline hover:underline-offset-[3px]"
        onClick={onBack}
      >
        {children}
      </button>
    </nav>
  );
}
