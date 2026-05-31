/**
 * HeroSlider — lazy-loaded Swiper wrapper for the Home hero section.
 *
 * Importing Swiper here (not in Home.js) keeps the ~60 KB Swiper bundle out of
 * the main chunk. React.lazy + Suspense in Home.js defers this import until the
 * browser is idle, improving Time-to-Interactive for first-time visitors.
 */
import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCards } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';

/**
 * @param {object}  props
 * @param {boolean} props.prefersReducedMotion  - honour OS-level motion preference
 * @param {number}  props.autoplayDelay         - ms between slides (default 2500)
 * @param {React.ReactNode} props.children      - <SwiperSlide> elements
 */
const HeroSlider = ({ prefersReducedMotion, autoplayDelay = 2500, children }) => (
    <Swiper
        effect="cards"
        grabCursor={true}
        modules={[Autoplay, EffectCards]}
        autoplay={
            prefersReducedMotion
                ? false
                : { delay: autoplayDelay, disableOnInteraction: false }
        }
        className="hero-swiper"
    >
        {children}
    </Swiper>
);

// Re-export SwiperSlide so callers don't need a second swiper import
export { SwiperSlide };
export default HeroSlider;
