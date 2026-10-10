interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-page-title">{title}</h2>
        {description && <p className="text-meta mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
