import slide3Image from 'images/slides/slide3.jpg';
import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';

// Define type for slider items
interface SliderItem {
    id: number;
    image: string;
}

// Slider items
export const sliders: SliderItem[] = [
    {
        id: 1,
        image: '/images/insurepal-mockup.png',
    },

    {
        id: 2,
        image: slide3Image,
    },
];

// Carousel Component
export const AuthSlider: React.FC = () => {
    const settings = {
        dots: false,
        infinite: true,
        autoplay: true,
        fade: true,
        autoplaySpeed: 2000,
        pauseOnHover: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1,
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                },
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                },
            },
        ],
    };

    return (
        <div className="relative z-[40] h-screen max-w-full overflow-hidden">
            <Slider {...settings} className="">
                {sliders?.map((slide) => (
                    <div key={slide.id} className="relative text-center text-white">
                        <img
                            src={slide.image}
                            width={1920}
                            height={1080}
                            className="h-[100vh] w-[100vw] overflow-hidden object-cover"
                            alt="Auth Sliders"
                        />
                    </div>
                ))}
            </Slider>
        </div>
    );
};
