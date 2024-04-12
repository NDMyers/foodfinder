
const API_KEY = process.env.NEXT_PUBLIC_MAPS_API_KEY

export async function GET(req: Request) {
    
    // const getLocation = () => {
    //     if (navigator.geolocation) {
    //       navigator.geolocation.getCurrentPosition(
    //         (position) => {
    //           const latitude = position.coords.latitude;
    //           const longitude = position.coords.longitude;
    //         },
    //         (error) => {
    //           if (error.code === error.PERMISSION_DENIED) {
    //             console.log('Please allow location access to use this feature.');
    //           } else {
    //             console.log('Error getting location. Please try again later.');
    //           }
    //         }
    //       );
    //     } else {
    //       console.log('Geolocation is not supported by this browser.');
    //     }
    //   };


}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const latitude = body.latitude
        const longitude = body.longitude
        const cuisinesQuery = body.cuisinesQuery
        const radius = body.radius

        const response = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}${cuisinesQuery}&type=restaurant&key=${API_KEY}&opennow=true`)
    
        if (!response.ok) {
            throw new Error('Failed to fetch nearby restaurants.')
        }

        const data = await response.json()
        console.log('Received location data:', { latitude, longitude, cuisinesQuery, radius });
        return new Response(JSON.stringify(data))
    
        // return new Response('Location data received successfully.');        
    } catch (error) {
        return new Response('Method Not Allowed:', { status: 405 })
    }
}
