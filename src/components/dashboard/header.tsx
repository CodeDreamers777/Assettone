interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({
  heading,
  text,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 py-6 border-b border-muted/20">
      <div className="w-full text-center">
        <h1 className="font-heading text-3xl md:text-4xl text-[#38b000] inline-block">
          {heading}
        </h1>
        {text && <p className="text-lg text-muted-foreground mt-2">{text}</p>}
      </div>
      <div className="absolute right-4">{children}</div>
    </div>
  );
}
