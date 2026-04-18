import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <header className="h-16 border-b border-border bg-background px-8 flex items-center justify-between sticky top-0 z-10">
    <div>
      <h1 className="text-lg font-semibold leading-tight">{title}</h1>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </header>
);

export default PageHeader;
