import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <span className="font-cinzel text-xl font-bold tracking-widest text-text-primary group-hover:text-accent transition-colors">
            GNOSIS
          </span>
        </Link>
      </header>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="px-6 py-4 text-center">
        <p className="font-mono text-xs text-text-muted">
          © {new Date().getFullYear()} GNOSIS — AI-Powered Learning
        </p>
      </footer>
    </div>
  );
}
