import Location from "@/components/Location";

const API_KEY = process.env.NEXT_PUBLIC_MAPS_API_KEY

export interface Restaurant {
  place_id: string,
  name: string;
  cuisine: string;
}


export default async function Home() {

  return (

    <main className="flex items-center justify-center">
      <Location />
    </main>

  );
}
