let latitude = 0
let longitude = 0

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

      return Response.json({ latitude, longitude })

}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        latitude = body.latitude
        longitude = body.longitude
    
        console.log('Received location data:', { latitude, longitude });
    
        return new Response('Location data received successfully.');        
    } catch (error) {
        return new Response('Method Not Allowed:', { status: 405 })
    }
}
