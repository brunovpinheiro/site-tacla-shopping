window.addEventListener("DOMContentLoaded", function () {
	// LENIS
	if (typeof Lenis !== "undefined") {
		const lenis = new Lenis({
			lerp: 0.07,
			anchors: true,
		});

		if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
			lenis.on("scroll", ScrollTrigger.update);
			gsap.ticker.add(function (time) {
				lenis.raf(time * 1000);
			});
			gsap.ticker.lagSmoothing(0);
		} else {
			function raf(time) {
				lenis.raf(time);
				requestAnimationFrame(raf);
			}
			requestAnimationFrame(raf);
		}

		const heroSection = document.querySelector(".section-hero");
		if (heroSection) {
			lenis.on("scroll", function () {
				const rect = heroSection.getBoundingClientRect();
				const isInHero = rect.top < window.innerHeight && rect.bottom > 0;
				lenis.options.lerp = isInHero ? 0.03 : 0.07;
			});
		}
	}
	// TIMELINE HOME
	if (typeof Swiper !== "undefined") {
		var timelineYears = new Swiper(".timeline-years", {
			direction: "vertical",
			slidesPerView: 6,
			spaceBetween: 0,
			freeMode: true,
			watchSlidesProgress: true,
			navigation: {
				nextEl: ".hero-btn-next",
				prevEl: ".hero-btn-prev",
			},
		});
		new Swiper(".timeline-events", {
			slidesPerView: 1,
			loop: true,
			spaceBetween: 0,
			speed: 0,
			thumbs: {
				swiper: timelineYears,
			},
			on: {
				init: function () {
					setTimeout(function () {
						if (typeof Webflow !== "undefined") {
							const wfIx = Webflow.require("ix3");
							wfIx.emit("timeline-active");
						}
					}, 100);
				},
				slideChange: function () {
					if (typeof Webflow !== "undefined") {
						const wfIx = Webflow.require("ix3");
						wfIx.emit("timeline-inactive");
						setTimeout(function () {
							wfIx.emit("timeline-active");
						}, 850);
					}
				},
			},
		});
	}

	// IMAGES HERO
	const heroSection = document.querySelector(".section-hero");
	const heroCards = document.querySelectorAll(".hero_image-list .hero_image-wrapper");

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
