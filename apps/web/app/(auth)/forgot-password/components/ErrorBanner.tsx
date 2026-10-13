interface ErrorBannerProps {
  message: string;
  children?: React.ReactNode;
}

// Web error banner (DESIGN.md: error banners).
export default function ErrorBanner({ message, children }: ErrorBannerProps) {
  return (
    <div role="alert" className="mt-4 p-3 bg-red-200 border border-red-400 rounded-lg">
      <p className="text-sm text-red-600">{message}</p>
      {children}
    </div>
  );
}
