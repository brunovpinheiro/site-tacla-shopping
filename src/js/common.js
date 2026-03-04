window.addEventListener("DOMContentLoaded", function () {
	// IMAGES HERO
	const heroSection = document.querySelector(".section-hero");
	const heroCards = document.querySelectorAll(".hero_image-list .hero_image-wrapper");

	// LENIS
	if (typeof Lenis !== "undefined") {
		const lenis = new Lenis({
			lerp: 0.05,
			anchors: true,
		});

		if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
			lenis.on("scroll", ScrollTrigger.update);
			gsap.ticker.add(function (time) {
				lenis.raf(time * 1000);
			});
			gsap.ticker.lagSmoothing(0);

			window.addEventListener("load", function () {
				ScrollTrigger.refresh();
				lenis.resize();
			});
		} else {
			function raf(time) {
				lenis.raf(time);
				requestAnimationFrame(raf);
			}
			requestAnimationFrame(raf);
		}

		if (heroSection) {
			lenis.on("scroll", function () {
				const rect = heroSection.getBoundingClientRect();
				const isInHero = rect.top < window.innerHeight && rect.bottom > 0;
				lenis.options.lerp = isInHero ? 0.03 : 0.05;
			});
		}
	}

	// TIMELINE HOME
	if (typeof Swiper !== "undefined") {
		var TIMELINE_EXIT_DURATION = 600;
		var TIMELINE_ENTER_DURATION = 800;
		var isTimelineTransitioning = false;

		function emitWfEvent(name) {
			if (typeof Webflow !== "undefined" && Webflow.require) {
				Webflow.require("ix3").emit(name);
			}
		}

		var timelineYears;
		var timelineEvents;

		function updateThumbActive(index) {
			if (!timelineYears || !timelineYears.slides) return;

			timelineYears.slides.forEach(function (slide, i) {
				slide.classList.toggle("swiper-slide-thumb-active", i === index);
			});

			timelineYears.slideTo(index);
		}

		function changeTimelineSlide(targetIndex) {
			if (isTimelineTransitioning || !timelineEvents || !timelineEvents.slides || targetIndex < 0 || targetIndex >= timelineEvents.slides.length || targetIndex === timelineEvents.activeIndex) {
				return;
			}

			isTimelineTransitioning = true;

			// 1. Atualiza anos imediatamente + animação de saída
			updateThumbActive(targetIndex);
			emitWfEvent("timeline-item-inactive");

			setTimeout(function () {
				// 2. Troca slide
				timelineEvents.slideTo(targetIndex);

				// 3. Animação de entrada
				emitWfEvent("timeline-item-active");

				// 4. Libera nova transição
				setTimeout(function () {
					isTimelineTransitioning = false;
				}, TIMELINE_ENTER_DURATION);
			}, TIMELINE_EXIT_DURATION);
		}

		// Swiper dos anos
		timelineYears = new Swiper(".timeline-years", {
			slidesPerView: "auto",
			spaceBetween: 0,
			centeredSlides: true,
			watchSlidesProgress: true,
			on: {
				click: function (swiper) {
					changeTimelineSlide(swiper.clickedIndex);
				},
			},
		});

		// Swiper dos eventos
		timelineEvents = new Swiper(".timeline-events", {
			slidesPerView: 1,
			spaceBetween: 10,
			speed: 0,
			allowTouchMove: false,
			watchSlidesProgress: true,
			preventInteractionOnTransition: true,
			on: {
				init: function () {
					updateThumbActive(0);
					window.addEventListener("load", function () {
						emitWfEvent("timeline-item-active");
					});
				},
			},
		});

		var nextBtn = document.querySelector(".timeline-nav_button.is-next");
		var prevBtn = document.querySelector(".timeline-nav_button.is-prev");

		if (nextBtn) {
			nextBtn.addEventListener("click", function () {
				changeTimelineSlide(timelineEvents.activeIndex + 1);
			});
		}

		if (prevBtn) {
			prevBtn.addEventListener("click", function () {
				changeTimelineSlide(timelineEvents.activeIndex - 1);
			});
		}
	}

	// IMAGES HERO — parallax on mousemove
	if (typeof gsap !== "undefined" && heroSection && heroCards.length) {
		const depths = [0.012, 0.02, 0.03, 0.018, 0.025, 0.015];

		heroSection.addEventListener("mousemove", function (e) {
			const rect = heroSection.getBoundingClientRect();
			const cx = rect.left + rect.width / 2;
			const cy = rect.top + rect.height / 2;
			const dx = e.clientX - cx;
			const dy = e.clientY - cy;

			heroCards.forEach(function (card, i) {
				const depth = depths[i % depths.length];

				gsap.to(card, {
					x: dx * depth,
					y: dy * depth,
					duration: 0.6,
					ease: "power2.out",
				});
			});
		});

		heroSection.addEventListener("mouseleave", function () {
			gsap.to(heroCards, {
				x: 0,
				y: 0,
				duration: 0.8,
				ease: "power3.out",
			});
		});
	}
});
