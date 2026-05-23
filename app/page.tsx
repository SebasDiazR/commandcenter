import dynamic from "next/dynamic";

// BDCommandCenter reads from localStorage and calls toLocaleTimeString()
// during initialization — both are browser-only APIs. Disabling SSR prevents
// the server/client HTML mismatch that causes React hydration errors.
const BDCommandCenter = dynamic(
  () => import("@/components/BDCommandCenter"),
  { ssr: false }
);

export default function Page() {
  return <BDCommandCenter />;
}
