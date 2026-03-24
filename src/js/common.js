window.addEventListener("DOMContentLoaded", function () {
	// ============================================================
	// LENIS — Smooth Scroll
	// ============================================================
	let lenis;

	if (typeof Lenis !== "undefined") {
		const heroSection = document.querySelector(".section-hero");

		lenis = new Lenis({
			lerp: 0.05,
			anchors: true,
		});

		if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
			lenis.on("scroll", ScrollTrigger.update);
			gsap.ticker.add((time) => lenis.raf(time * 1000));
			gsap.ticker.lagSmoothing(0);

			window.addEventListener("load", () => {
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
			lenis.on("scroll", () => {
				const rect = heroSection.getBoundingClientRect();
				const isInHero = rect.top < window.innerHeight && rect.bottom > 0;
				lenis.options.lerp = isInHero ? 0.03 : 0.05;
			});
		}
	}

	// ============================================================
	// FANCYBOX — Integração com Lenis e suporte a HLS
	// ============================================================
	function initHlsVideo(slide) {
		if (slide.type !== "html") return;

		const videoEl = slide.el?.querySelector("video");
		const src = slide.src;

		if (!videoEl || !src?.endsWith(".m3u8")) return;

		if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
			videoEl.src = src;
		} else if (window.Hls?.isSupported()) {
			const hls = new Hls();
			hls.loadSource(src);
			hls.attachMedia(videoEl);
			slide.hls = hls;
		}
	}

	Fancybox.bind("[data-fancybox]", {
		on: {
			init: () => lenis?.stop(),
			destroy: () => lenis?.start(),
			"Carousel.createSlide": (fancybox, carousel, slide) => initHlsVideo(slide),
			"Carousel.removeSlide": (fancybox, carousel, slide) => {
				slide.hls?.destroy();
				slide.hls = null;
			},
		},
	});

	// ============================================================
	// HERO — Parallax no mouse
	// ============================================================
	const heroSection = document.querySelector(".section-hero");
	const heroCards = document.querySelectorAll(".hero_image-list .hero_image-wrapper");

	if (typeof gsap !== "undefined" && heroSection && heroCards.length) {
		if (typeof CSSPlugin !== "undefined") {
			gsap.registerPlugin(CSSPlugin);
		}

		const depths = [0.012, 0.02, 0.03, 0.018, 0.025, 0.015];

		heroSection.addEventListener("mousemove", (e) => {
			const rect = heroSection.getBoundingClientRect();
			const dx = e.clientX - (rect.left + rect.width / 2);
			const dy = e.clientY - (rect.top + rect.height / 2);

			heroCards.forEach((card, i) => {
				const depth = depths[i % depths.length];
				gsap.to(card, { x: dx * depth, y: dy * depth, duration: 0.6, ease: "power2.out", force3D: false });
			});
		});

		heroSection.addEventListener("mouseleave", () => {
			gsap.to(heroCards, { x: 0, y: 0, duration: 0.8, ease: "power3.out", force3D: false });
		});
	}

	// ============================================================
	// TIMELINE — Swiper
	// ============================================================
	if (typeof Swiper !== "undefined") {
		let timelineYears, timelineEvents;
		const isMobile = window.innerWidth <= 767;
		let timelineAnimating = false;

		const FADE_DURATION = 0.3;
		const FADE_EASE = "power2.inOut";

		function getSlideTargets(slide) {
			return [...slide.querySelectorAll(".timeline-content_midia"), ...slide.querySelectorAll(".timeline-content_texts")];
		}

		function fadeInSlide(slide) {
			const targets = getSlideTargets(slide);
			if (!targets.length) return;
			gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: FADE_DURATION, ease: FADE_EASE, stagger: 0.06 });
		}

		function fadeOutSlide(slide, onComplete) {
			const targets = getSlideTargets(slide);
			if (!targets.length) {
				onComplete?.();
				return;
			}
			gsap.to(targets, {
				opacity: 0,
				duration: FADE_DURATION,
				ease: FADE_EASE,
				onComplete,
			});
		}

		function updateThumbActive(index) {
			if (!timelineYears?.slides) return;
			timelineYears.slides.forEach((slide, i) => {
				slide.classList.toggle("swiper-slide-thumb-active", i === index);
			});
			timelineYears.slideTo(index);
		}

		function changeTimelineSlide(targetIndex) {
			if (!timelineEvents?.slides) return;
			if (targetIndex < 0 || targetIndex >= timelineEvents.slides.length) return;
			if (targetIndex === timelineEvents.activeIndex) return;
			if (timelineAnimating) return;

			timelineAnimating = true;
			const currentSlide = timelineEvents.slides[timelineEvents.activeIndex];

			fadeOutSlide(currentSlide, () => {
				updateThumbActive(targetIndex);
				timelineEvents.slideTo(targetIndex);
			});
		}

		timelineYears = new Swiper(".timeline-years", {
			slidesPerView: "auto",
			spaceBetween: 0,
			centeredSlides: true,
			watchSlidesProgress: true,
			on: {
				click: (swiper) => {
					if (swiper.clickedIndex != null && swiper.clickedIndex >= 0) {
						changeTimelineSlide(swiper.clickedIndex);
					}
				},
				slideChangeTransitionEnd: (swiper) => {
					if (isMobile) changeTimelineSlide(swiper.activeIndex);
				},
			},
		});

		timelineEvents = new Swiper(".timeline-events", {
			slidesPerView: 1,
			spaceBetween: 10,
			speed: 300,
			allowTouchMove: isMobile,
			watchSlidesProgress: true,
			on: {
				init: (swiper) => {
					updateThumbActive(0);
					swiper.slides.forEach((slide, i) => {
						gsap.set(getSlideTargets(slide), { opacity: 0 });
					});
					const firstSlide = swiper.slides[0];
					if (firstSlide) fadeInSlide(firstSlide);
				},
				slideChangeTransitionStart: (swiper) => {
					if (isMobile) updateThumbActive(swiper.activeIndex);
				},
				slideChangeTransitionEnd: (swiper) => {
					const activeSlide = swiper.slides[swiper.activeIndex];
					if (activeSlide) {
						gsap.set(getSlideTargets(activeSlide), { opacity: 0 });
						fadeInSlide(activeSlide);
					}
					timelineAnimating = false;
				},
			},
		});

		const nextBtn = document.querySelector(".timeline-nav_button.is-next");
		const prevBtn = document.querySelector(".timeline-nav_button.is-prev");

		nextBtn?.addEventListener("click", () => changeTimelineSlide(timelineEvents.activeIndex + 1));
		prevBtn?.addEventListener("click", () => changeTimelineSlide(timelineEvents.activeIndex - 1));
	}

	// ============================================================
	// TRANSFORM SECTION — Troca de imagem por scroll
	// ============================================================
	const transformItems = Array.from(document.querySelectorAll(".transform-list_item"));
	const transformSlides = Array.from(document.querySelectorAll(".transform-media-slide"));

	if (transformItems.length && transformSlides.length && typeof gsap !== "undefined") {
		transformSlides.forEach((slide, i) => {
			gsap.set(slide, { yPercent: i === 0 ? 0 : 100, opacity: i === 0 ? 1 : 0, zIndex: i });
		});

		transformItems.forEach((item) => gsap.set(item, { opacity: 0.35 }));

		let currentIndex = 0;
		let targetIndex = 0;
		let isAnimating = false;
		const onMobile = window.matchMedia("(max-width: 991px)").matches;

		function getTargetSlideIndex() {
			const viewportMid = window.innerHeight / 2;
			let closestItemIndex = 0;
			let closestDist = Infinity;

			transformItems.forEach((item, i) => {
				const rect = item.getBoundingClientRect();
				const dist = Math.abs(rect.top + rect.height / 2 - viewportMid);
				if (dist < closestDist) {
					closestDist = dist;
					closestItemIndex = i;
				}
			});

			const firstRect = transformItems[0]?.getBoundingClientRect();
			return firstRect && firstRect.top > viewportMid ? 0 : closestItemIndex + 1;
		}

		function animateStep() {
			if (currentIndex === targetIndex) {
				isAnimating = false;
				return;
			}

			isAnimating = true;

			const nextIndex = currentIndex < targetIndex ? currentIndex + 1 : currentIndex - 1;
			const goingForward = nextIndex > currentIndex;

			// Passos intermediários ainda na fila: usa duração reduzida para não atrasar demais
			const stepsLeft = Math.abs(targetIndex - nextIndex);
			const dur = stepsLeft > 0 ? (onMobile ? 0.25 : 0.4) : onMobile ? 0.45 : 0.75;

			const tl = gsap.timeline({
				defaults: { ease: "power3.inOut" },
				onComplete: () => {
					currentIndex = nextIndex;
					animateStep();
				},
			});

			if (goingForward) {
				gsap.set(transformSlides[nextIndex], { yPercent: 100, opacity: 0, zIndex: nextIndex });
				tl.to(transformSlides[nextIndex], { yPercent: 0, opacity: 1, duration: dur });
			} else {
				gsap.set(transformSlides[nextIndex], { yPercent: 0, opacity: 1, zIndex: nextIndex });
				tl.to(transformSlides[currentIndex], { yPercent: 100, opacity: 0, duration: dur });
			}

			transformItems.forEach((item, i) => {
				tl.to(item, { opacity: i === nextIndex - 1 ? 1 : 0.35, duration: dur * 0.55 }, 0);
			});
		}

		function handleScroll() {
			const newTarget = getTargetSlideIndex();
			if (newTarget !== targetIndex) {
				targetIndex = newTarget;
				if (!isAnimating) {
					animateStep();
				}
			}
		}

		if (onMobile) {
			window.addEventListener("scroll", handleScroll, { passive: true });
		} else {
			lenis?.on("scroll", handleScroll);
		}

		handleScroll();
	}

	// ============================================================
	// PILARS — Hover nos cards #pilar-one até #pilar-four
	// ============================================================
	const pilarMap = [
		{ card: "#pilar-one", symbol: ".symbol-one" },
		{ card: "#pilar-two", symbol: ".symbol-two" },
		{ card: "#pilar-three", symbol: ".symbol-three" },
		{ card: "#pilar-four", symbol: ".symbol-four" },
	];

	const svgWrapper = document.querySelector(".pilars-brand_svg");
	const allSymbols = svgWrapper ? Array.from(svgWrapper.querySelectorAll(".symbol-one, .symbol-two, .symbol-three, .symbol-four")) : [];

	if (allSymbols.length && typeof gsap !== "undefined") {
		pilarMap.forEach(({ card, symbol }) => {
			const cardEl = document.querySelector(card);
			if (!cardEl) return;

			const cardText = cardEl.querySelector(".card-pilar_text");
			const activeSymbol = svgWrapper.querySelector(symbol);
			const otherSymbols = allSymbols.filter((el) => el !== activeSymbol);

			cardEl.addEventListener("mouseenter", () => {
				if (cardText) gsap.to(cardText, { height: "auto", opacity: 1, duration: 0.6, ease: "power2.out" });
				if (activeSymbol) gsap.to(activeSymbol, { opacity: 1, duration: 0.6, ease: "power2.out" });
				if (otherSymbols.length) gsap.to(otherSymbols, { opacity: 0.3, duration: 0.6, ease: "power2.out" });
			});

			cardEl.addEventListener("mouseleave", () => {
				if (cardText) gsap.to(cardText, { height: 0, opacity: 0.3, duration: 0.6, ease: "power2.in" });
				if (allSymbols.length) gsap.to(allSymbols, { opacity: 1, duration: 0.6, ease: "power2.in" });
			});
		});
	}

	// ============================================================
	// NAVBAR — Cor de fundo ao rolar
	// ============================================================
	const navbar = document.querySelector(".navbar");
	const heroForNavbar = document.querySelector(".section-hero");
	if (navbar) {
		function updateNavbar() {
			const heroVisible = heroForNavbar && heroForNavbar.getBoundingClientRect().bottom > 0;
			navbar.classList.toggle("is-scrolled", !heroVisible);
		}

		if (lenis) {
			lenis.on("scroll", updateNavbar);
		} else {
			window.addEventListener("scroll", updateNavbar, { passive: true });
		}

		updateNavbar();
	}
});
