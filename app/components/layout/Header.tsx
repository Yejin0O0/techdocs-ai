import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">TechDocs AI</span>
      <ThemeToggle />
    </header>
  );
}
