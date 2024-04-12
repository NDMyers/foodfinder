'use client'
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform, Spring } from 'framer-motion';
import { Check, Circle, Loader2 } from 'lucide-react';
import PageTransition from './PageTransition';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Tinder from './Tinder';
import RouletteWheel from './RouletteWheel';
import Confetti from 'react-confetti';

const Location: React.FC = () => {
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<any[]>([]);
  const [radius, setRadius] = useState<string>('3000'); // Default radius value
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [showCuisineMenu, setShowCuisineMenu] = useState<boolean>(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState<boolean>(false);
  const [locateSuccess, setLocateSuccess] = useState<boolean>(false);
  const [loadingRestaurants, setIsLoadingRestaurants] = useState<boolean>(false);
  // const [game, setGame] = useState<string>('');
  // const [currentRestaurantTinder, setCurrentRestaurantTinder] = useState(0);
  // const [tinderLoss, setTinderLoss] = useState<boolean>(false);
  // const [tinderWin, setTinderWin] = useState<boolean>(false);
  // const [loserRestaurants, addLoserRestaurant] = useState<any[]>([]);
  // const [winnerRestaurants, addWinnerRestaurant] = useState<any[]>([]);
  const [highlightedRestaurant, setHighlightedRestaurant] = useState<any>('');
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [finalWinner, setFinalWinner] = useState<string | null>(null);
  const [confettiTime, setConfettiTime] = useState<boolean>(false);
  const [i, setI] = useState<number>(1);

  const router = useRouter()

  const getUserLocation = () => {
    setIsFetchingLocation(true); // Start fetching location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoordinates({ latitude, longitude });
          // Call the function to fetch nearby restaurants
          // await fetchNearbyRestaurants(latitude, longitude);
          setIsFetchingLocation(false); // Stop fetching location
          setLocateSuccess(true); // We have successfully got the user's location to show 'Get Restaurants' button
        },
        (error) => {
          console.error('Error getting user location:', error);
          setIsFetchingLocation(false); // Stop fetching location
          setLocateSuccess(false); // Failed to get user location
        }
      );
    } else {
      console.error('Geolocation is not supported by your browser');
      setIsFetchingLocation(false); // Stop fetching location
      setLocateSuccess(false); // Failed to get user location
    }
  };

  const fetchNearbyRestaurants = async () => {
    try {
      setConfettiTime(false);
      setIsLoadingRestaurants(true) // Start fetching restaurants
      const latitude = userCoordinates?.latitude
      const longitude = userCoordinates?.longitude
      const cuisinesQuery = selectedCuisines.length > 0 ? `&keyword=${selectedCuisines.join('|')}` : '&keyword=restaurant';

      const response = await fetch('/api/location', {
        method: 'POST',
        body: JSON.stringify({ latitude: latitude, longitude: longitude, cuisinesQuery: cuisinesQuery, radius: radius })
      })

      // Make a request to Google Places API
      // const response = await fetch(
      //   `/api/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}${cuisinesQuery}&type=restaurant&key=${API_KEY}&opennow=true`
      // );

      if (!response.ok) {
        setIsLoadingRestaurants(false); // Stop fetching restaurants
        throw new Error('Failed to fetch nearby restaurants');
      }

      // Parse the response JSON
      const data = await response.json();

      // Remove duplicates
      const uniqueData = removeDuplicates(data.results, 'name')

      // Update state with restaurant data
      setNearbyRestaurants(uniqueData);

      // Stop loading restaurants anim.
      setIsLoadingRestaurants(false); 

    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
      setIsLoadingRestaurants(false); // Stop fetching restuarants
    }
  };

  const handleRadiusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRadius = event.target.value;
    setRadius(selectedRadius);
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (selectedCuisines.includes(value)) {
      setSelectedCuisines(selectedCuisines.filter((cuisine) => cuisine !== value));
    } else {
      setSelectedCuisines([...selectedCuisines, value]);
    }
  };

  const toggleCuisineMenu = () => {
    setShowCuisineMenu(!showCuisineMenu);
  };

  const startSelection = () => {
    setConfettiTime(false);
    setIsSelecting(true);
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * nearbyRestaurants.length);
      setHighlightedRestaurant(nearbyRestaurants[randomIndex]);
    }, 70); // Adjust the interval as needed

    setTimeout(() => {
      clearInterval(interval);
      setIsSelecting(false);
      setFinalWinner(highlightedRestaurant);
      setConfettiTime(true);
    }, 3000); // Adjust the duration of the selection process
  }

  // Function to remove duplicates based on a property
  const removeDuplicates = (array: any[], property: string) => {
    return array.filter((item, index, self) => {
      return self.findIndex((t) => t[property] === item[property]) === index;
    });
  };

  // const handleTinderSelect = () => {
  //   setGame('tinder');
  // }
  

  const handleDragEnd = (restaurant: any, info: any) => {
      console.log('placeholder')
    // const swipeDistance = Math.abs(info.offset.x - info.point.x);
    // if (swipeDistance > 50) { // Adjust this threshold as needed
    //   const direction = info.offset.x > info.point.x ? "left" : "right";
    //   if (direction === "left") {
        // User swiped left (fail)
        // const passedRestaurant = restaurants[currentRestaurantIndex];
      //   addLoserRestaurant([...loserRestaurants, restaurant]);
      // }
      // Update current restaurant index for rendering the next restaurant
      // setCurrentRestaurantIndex(currentRestaurantIndex + 1);
    // }
  };

  // {nearbyRestaurants.map((restaurant: any, index: number) => (
  //   <li key={index}>
  //     <strong>{restaurant.name}</strong>
  //   </li>
  // ))}

  // const test = () => {
  //   console.log(nearbyRestaurants[0].name)
  // }


  const transitionSpringPhysics: Spring = {
    type: "spring",
    mass: 0.2,
    stiffness: 80,
    damping: 10,
  };

  const transitionColor = "deepskyblue";

  return (
    <div className=' w-full min-h-screen flex flex-col items-center justify-normal p-4 shadow-2xl rounded-3xl md:max-w-[100rem] md:justify-center md:p-8'>
      <button onClick={getUserLocation} disabled={isFetchingLocation} >
        {isFetchingLocation ? (
          <motion.div className="animate-spin">
            <Loader2 />
            {/* Loading spinner animation */}
          </motion.div>
        ) : (
          userCoordinates ? (
            <motion.div className="flex items-center text-emerald-400">
              <a className='text-2xl font-bold md:text-5xl'>Location acquired </a>
              <Check className='w-12 h-12 md:w-[70px] md:h-[70px]'/>
              {/* Checkmark icon animation */}
            </motion.div>
          ) : <div className='flex items-center justify-center text-2xl p-6 text-white font-bold md:text-5xl border-4 rounded-2xl hover:border-emerald-400'>Get Current Location</div>
        )} 
      </button>

      {locateSuccess ? (
        <div className='flex flex-col items-center justify-center'>
          <div className='flex flex-col items-center md:flex-row'>
            <label htmlFor="radius" className='text-white text-2xl font-bold pb-1 md:p-4'>Search Radius: </label>
            <motion.select id="radius" value={radius} onChange={handleRadiusChange} className='w-24 h-10 text-center' whileTap={{ scale: 0.95 }}>
              <option value="1500">Small</option>
              <option value="3000">Medium</option>
              <option value="4500">Large</option>
              <option value="6000">X-Large</option>
            </motion.select>
          </div>

          <div className='flex flex-col justify-center items-center'>
            <motion.h2 
              onClick={toggleCuisineMenu} 
              style={{ cursor: 'pointer' }} 
              className='text-white p-1 md:p-4 text-2xl'
              whileTap={{ scale: 0.9 }}
            >
              Filter Cuisines <span className='text-base pl-2'>{showCuisineMenu ? ' ▲' : ' ▼'}</span>
            </motion.h2>
            {showCuisineMenu && (
              <div className='flex flex-col pb-2 text-white'>
                <label>
                  <input type="checkbox" value="American" onChange={handleCheckboxChange} checked={selectedCuisines.includes('American')} />
                  <a> American</a>
                </label>

                <label>
                  <input type="checkbox" value="Chinese" onChange={handleCheckboxChange} checked={selectedCuisines.includes('Chinese')} />
                  <a> Chinese</a>
                </label>

                <label>
                  <input type="checkbox" value="French" onChange={handleCheckboxChange} checked={selectedCuisines.includes('French')} />
                  <a> French</a>
                </label>

                <label>
                  <input type="checkbox" value="Indian" onChange={handleCheckboxChange} checked={selectedCuisines.includes('Indian')} />
                  <a> Indian</a>
                </label>

                <label>
                  <input type="checkbox" value="Italian" onChange={handleCheckboxChange} checked={selectedCuisines.includes('Italian')} />
                  <a> Italian</a>
                </label>

                <label>
                  <input type="checkbox" value="Japanese" onChange={handleCheckboxChange} checked={selectedCuisines.includes('Japanese')} />
                  <a> Japanese</a>
                </label>

                <label>
                  <input type="checkbox" value="Mexican" onChange={handleCheckboxChange} checked={selectedCuisines.includes('Mexican')} />
                  <a> Mexican</a>
                </label>

                <label>
                  <input type="checkbox" value="Thai" onChange={handleCheckboxChange} checked={selectedCuisines.includes('Thai')} />
                  <a> Thai</a>
                </label>
                {/* Add more cuisine checkboxes as needed */}
              </div>
            )}
          </div>

          <motion.button onClick={fetchNearbyRestaurants} 
                         className='border-2 rounded-lg p-1 w-full bg-slate-200 tracking-tighter hover:border-black max-w-48 mt-1 font-semibold text-md md:text-xl'
                         whileTap={{ scale: 0.9 }}>
            Find Restaurants
          </motion.button>

          {userCoordinates && (

            <div className='flex flex-row w-full justify-center items-center'>

              {/* <p>Latitude: {userCoordinates.latitude}</p>
              <p>Longitude: {userCoordinates.longitude}</p> */}
              {/* <h2>Nearby Restaurants:</h2> */}

              {loadingRestaurants ? (
                <motion.div className='animate-spin p-2 text-white'>
                  <Loader2 />
                  {/* Loading spinner animation */}
                </motion.div>
              ) : (
                <div>
                {nearbyRestaurants.length > 1 ? (
                  <div className='flex flex-col items-center justify-between p-7'>          
                    <ul>
                      {nearbyRestaurants.map((restaurant: any, index: number) => (
                        <li key={index} className='tracking-tight text-base md:text-lg text-black' style={{ color: highlightedRestaurant.name === restaurant.name ? '#75F970' : 'white' }}>
                          <strong>{restaurant.name}</strong>
                        </li>
                      ))}
                    </ul>
                    {confettiTime && (
                      <div>
                        <Confetti
                          width={window.innerWidth}
                          height={window.innerHeight}
                          recycle={false}
                          numberOfPieces={200}
                          gravity={0.2}
                        />

                        <div className='flex flex-col text-white text-xl pt-4 items-center justify-center text-center '>
                          <a className='text-yellow-400 border-b-2 border-yellow-400 w-full'>WINNER</a>
                          <motion.a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${highlightedRestaurant.geometry.location.lat},${highlightedRestaurant.geometry.location.lng}`} 
                            className='pt-1'
                            target="_blank" 
                            rel="noopener noreferrer" 
                            animate={{ scale: [1, 0.9, 1], color: [ '#FFFFFF', '#32FF00', '#FFFFFF' ] }} 
                            transition={{ repeat: Infinity, ease:"easeInOut", duration: 1.4 }}>
                              {highlightedRestaurant.name}<br></br>{highlightedRestaurant.vicinity}
                          </motion.a>
                        </div>

                      </div>
                    )}
                    
                    <motion.button 
                      onClick={startSelection} 
                      disabled={isSelecting} 
                      className='rounded-xl bg-slate-200 border-2 hover:border-black border-slate-500 tracking-tighter w-full py-2 mt-4 md:mt-12 text-black text-xl'
                      whileTap={{ scale: 0.9 }}
                    >
                      Start
                    </motion.button> 

                  </div>

                ) : (
                  <></>
                )}
                </div>

                // <div>
              
                /* {
                {nearbyRestaurants.length > 1 && 
                  <div className='w-full flex flex-col items-center'>
                    <a>Restaurants acquired. Which game?</a>
                    <motion.button onClick={handleTinderSelect} className='border-2 bg-slate-100 shadow-lg rounded-xl hover:border-black hover:bg-slate-200 max-w-48 w-full'>Tinder</motion.button>
                    {game === 'tinder' && (
                      <PageTransition>
                        <Tinder nearbyRestaurants={nearbyRestaurants} />
                      </PageTransition>
                    )}
                  </div>
                  } */

                // </div>

              )}
            </div>

          )}

        </div>
      ) : (
        <></>
      )}

    </div>
  );
};

export default Location;
