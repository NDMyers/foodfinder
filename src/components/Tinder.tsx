'use client'
import { FC, useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

interface TinderProps {
  nearbyRestaurants: any
}

const Tinder: FC<TinderProps> = ({ nearbyRestaurants }) => {

    const [i, setI] = useState<number>(1);

    // framer-motion animation section
    const x = useMotionValue(0);
    const xInput = [-100, 0, 100];
    const background = useTransform(x, xInput, [
        "linear-gradient(180deg, #ff008c 0%, rgb(211, 9, 225) 100%)",
        "linear-gradient(180deg, #7700ff 0%, rgb(68, 0, 255) 100%)",
        "linear-gradient(180deg, rgb(230, 255, 0) 0%, rgb(3, 209, 0) 100%)"
    ]);
    const color = useTransform(x, xInput, [
        "rgb(211, 9, 225)",
        "rgb(68, 0, 255)",
        "rgb(3, 209, 0)"
    ]);
    const tickPath = useTransform(x, [10, 100], [0, 1]);
    const crossPathA = useTransform(x, [-10, -55], [0, 1]);
    const crossPathB = useTransform(x, [-50, -100], [0, 1]);

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


    return (

        <div className='py-4 flex flex-col items-center justify-between w-[14rem] md:w-[24rem]'>

            <motion.div className="py-8 flex flex-col w-full justify-between items-center rounded-full p-2" style={{ background }}>

                {/* Render current restaurant data */}
                {nearbyRestaurants.length > 0 && (
                    <div className='text-white pb-8'>{nearbyRestaurants[nearbyRestaurants.length - i].name}</div>
                )}
                
                <motion.div
                    className="bg-white rounded-3xl w-[50px] h-[50px] flex items-center justify-center"
                    style={{ x }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={handleDragEnd}
                    >

                    <svg className="w-[80%] h-[80%]" viewBox="0 0 50 50">
                        {/* The checkmark */}
                        <motion.path
                        fill="none"
                        strokeWidth="2"
                        stroke={color}
                        d="M14,26 L 22,33 L 35,16"
                        strokeDasharray="0 1"
                        style={{ pathLength: tickPath }}
                        />

                        {/* The two lines for the X */}
                        <motion.path
                        fill="none"
                        strokeWidth="2"
                        stroke={color}
                        d="M17,17 L33,33"
                        strokeDasharray="0 1"
                        style={{ pathLength: crossPathA }}
                        />
                        <motion.path
                        fill="none"
                        strokeWidth="2"
                        stroke={color}
                        d="M33,17 L17,33"
                        strokeDasharray="0 1"
                        style={{ pathLength: crossPathB }}
                        />
                    </svg>
                    
                </motion.div>
            </motion.div>
        </div>
    )
}

export default Tinder