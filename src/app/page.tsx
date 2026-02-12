import DiscoveryShell from "@/components/revamp/DiscoveryShell";

export default function Home() {
  const mapApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY ??
    process.env.NEXT_PUBLIC_MAPS_API_KEY ??
    process.env.MAPS_API;

  return <DiscoveryShell mapApiKey={mapApiKey} />;
}
