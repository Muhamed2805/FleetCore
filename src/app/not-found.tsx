import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ fontWeight: 600 }}>FleetCore</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
            Page not found
          </h1>
          <p style={{ maxWidth: "24rem", color: "#71717a" }}>
            The page you&apos;re looking for doesn&apos;t exist or may have
            been moved.
          </p>
          <Link href="/" style={{ color: "#2563eb" }}>
            Go home
          </Link>
        </div>
      </body>
    </html>
  );
}
