// Initialize a new Lenis instance for smooth scrolling
const lenis = new Lenis({
	autoRaf: true,
	// Ajuste global (suave):
	speed: 1,
	damping: 0.1,
	lerp: 0.1,
	anchors: true,
});

// SWIPERS
var swiperHeroThumbs = new Swiper(".swiper-hero_thumbs", {
	spaceBetween: 0,
	slidesPerView: 1,
	freeMode: true,
	watchSlidesProgress: true,
	navigation: {
		nextEl: ".hero-btn-next",
		prevEl: ".hero-btn-prev",
	},
});

var swiperHero = new Swiper(".hero-bg-slider", {
	slidesPerView: 1,
	loop: true,
	spaceBetween: 0,
	effect: "fade",
	autoplay: {
		delay: 6000,
		disableOnInteraction: false,
	},
	thumbs: {
		swiper: swiperHeroThumbs,
	},
});
