export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4">{children}</div>
    </div>
  );
}
