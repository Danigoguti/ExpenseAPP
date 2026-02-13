interface HeaderProps {
  title: string;
  rightAction?: React.ReactNode;
}

export default function Header({ title, rightAction }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800"
      style={{ paddingTop: `calc(var(--sat) + 12px)` }}
    >
      <h1 className="text-lg font-semibold text-slate-100">{title}</h1>
      {rightAction && <div>{rightAction}</div>}
    </header>
  );
}
