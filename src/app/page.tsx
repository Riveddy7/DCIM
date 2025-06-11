// This page will typically be handled by middleware for redirection
// based on authentication state.
// If middleware is correctly set up, users might not see this page directly.
export default function HomePage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <p>Loading Visión Latina...</p>
    </div>
  );
}
