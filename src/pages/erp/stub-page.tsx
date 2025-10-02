// Stub page component for modules under development
interface StubPageProps {
  title: string;
  description?: string;
}

export default function StubPage({ title, description }: StubPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">{title}</h1>
        {description && (
          <p className="text-xl text-muted-foreground">{description}</p>
        )}
        <p className="text-muted-foreground">Esta página será implementada em breve.</p>
      </div>
    </div>
  );
}
