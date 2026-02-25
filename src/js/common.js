// Initialize a new Lenis instance for smooth scrolling
const lenis = new Lenis({
	autoRaf: true,
	// Ajuste global (suave):
	speed: 1,
	damping: 0.1,
	lerp: 0.1,
	anchors: true,
});

// ACCORDIONS
document.querySelectorAll(".accordion_toggle_heading").forEach((heading) => {
	heading.addEventListener("click", () => {
		const content = heading.nextElementSibling;
		if (!content || !content.classList.contains("accordion_content_wrap")) return;

		const icon = heading.querySelector(".accordion_toggle_icon");

		// Fecha todos os outros
		document.querySelectorAll(".accordion_content_wrap.open").forEach((openItem) => {
			if (openItem !== content) {
				openItem.classList.remove("open");

				const otherHeading = openItem.previousElementSibling;
				const otherIcon = otherHeading?.querySelector(".accordion_toggle_icon");
				if (otherIcon) otherIcon.classList.remove("rotated");
			}
		});

		const isOpen = content.classList.contains("open");

		// Alterna o atual
		content.classList.toggle("open");

		if (icon) {
			icon.classList.toggle("rotated", !isOpen);
		}
	});
});

// SWIPERS
var swiperHeroThumbs = new Swiper(".swiper-hero_thumbs", {
	spaceBetween: 0,
	slidesPerView: 1,
	freeMode: true,
	watchSlidesProgress: true,
	navigation: {
		nextEl: ".hero-btn-next",
		// prevEl: ".hero-btn-prev",
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

var swiper = new Swiper(".swiper_products-featured", {
	slidesPerView: "auto",
	spaceBetween: 0,
	loop: true,
	createElements: true,
	pagination: true,
	autoplay: false,
	pagination: {
		el: ".swiper-pagination",
		type: "progressbar",
	},
	navigation: {
		nextEl: ".slide-button-next",
		prevEl: ".slide-button-prev",
	},
});

var swiperGallery = new Swiper(".product-gallery", {
	slidesPerView: 1,
	spaceBetween: 16,
	loop: false,
	createElements: true,
	watchSlidesProgress: true,
	navigation: {
		nextEl: ".btn-gallery_left",
		prevEl: ".btn-gallery_right",
	},
	breakpoints: {
		768: {
			slidesPerView: "auto",
			spaceBetween: 0,
		},
	},
});

swiperGallery.on("progress", () => {
	swiperGallery.slides.forEach((slide) => {
		// Progress:
		//  0   = ativo
		// < 0  = já passou
		// > 0  = próximo
		if (slide.progress < 0) {
			slide.classList.add("is-past");
		} else {
			slide.classList.remove("is-past");
		}
	});
});

// DOMECTIC SLIDER
var swiper = new Swiper(".swiper_dometic", {
	slidesPerView: "auto",
	spaceBetween: 0,
	loop: false,
	createElements: false,
	pagination: false,
	autoplay: false,
	navigation: {
		nextEl: ".dometic-slider_nav-btn_next",
		prevEl: ".dometic-slider_nav-btn_prev",
	},
});
