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
	// TIMELINE — Swiper + Webflow Interactions
	// ============================================================
	if (typeof Swiper !== "undefined") {
		const TIMELINE_EXIT_DURATION = 600;
		const TIMELINE_ENTER_DURATION = 800;
		let isTimelineTransitioning = false;
		let timelineYears, timelineEvents;
		const isMobile = window.innerWidth <= 767;

		function emitWfEvent(name, force = false) {
			if (!force && window.innerWidth <= 767) return;
			if (typeof Webflow !== "undefined" && Webflow.require) {
				Webflow.require("ix3").emit(name);
			}
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

			// Mobile: sem animações IX3, troca direta e imediata
			if (isMobile) {
				updateThumbActive(targetIndex);
				timelineEvents.slideTo(targetIndex);
				return;
			}

			// Desktop: transição com animações Webflow IX3
			if (isTimelineTransitioning) return;
			isTimelineTransitioning = true;
			updateThumbActive(targetIndex);
			emitWfEvent("timeline-item-inactive");

			setTimeout(() => {
				timelineEvents.slideTo(targetIndex);
				emitWfEvent("timeline-item-active");
				setTimeout(() => {
					isTimelineTransitioning = false;
				}, TIMELINE_ENTER_DURATION);
			}, TIMELINE_EXIT_DURATION);
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
				// Mobile: swipe nos anos sincroniza os eventos
				slideChangeTransitionEnd: (swiper) => {
					if (isMobile) changeTimelineSlide(swiper.activeIndex);
				},
			},
		});

		timelineEvents = new Swiper(".timeline-events", {
			slidesPerView: 1,
			spaceBetween: 10,
			speed: isMobile ? 300 : 0,
			allowTouchMove: isMobile, // Habilita arrasto apenas no mobile
			watchSlidesProgress: true,
			preventInteractionOnTransition: true,
			on: {
			init: () => {
				updateThumbActive(0);
				// force: true garante que o estado inicial "active" seja aplicado no mobile também,
				// já que o IX3 define os slides em estado oculto antes dessa emissão.
				window.addEventListener("load", () => emitWfEvent("timeline-item-active", true));
			},
				// Mobile: swipe nos eventos sincroniza os anos
				slideChange: (swiper) => {
					if (isMobile) updateThumbActive(swiper.activeIndex);
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
			gsap.set(slide, { yPercent: i === 0 ? 0 : 100, opacity: i === 0 ? 1 : 0, zIndex: i, force3D: false });
		});

		transformItems.forEach((item) => gsap.set(item, { opacity: 0.35 }));

		let currentIndex = 0;
		const onMobile = window.matchMedia("(max-width: 991px)").matches;
		let activeTl = null;

		function setActiveImage(nextIndex) {
			if (nextIndex === currentIndex) return;

			if (activeTl) activeTl.kill();

			const goingForward = nextIndex > currentIndex;
			const prev = transformSlides[currentIndex];
			const next = transformSlides[nextIndex];
			const dur = onMobile ? 0.45 : 0.9;

			activeTl = gsap.timeline({
				defaults: { ease: "power3.inOut", force3D: false },
				onComplete: () => {
					activeTl = null;
				},
			});

			if (goingForward) {
				gsap.set(next, { yPercent: 100, opacity: 0, zIndex: nextIndex, force3D: false });
				activeTl.to(next, { yPercent: 0, opacity: 1, duration: dur }, 0);
			} else {
				gsap.set(prev, { zIndex: currentIndex, force3D: false });
				activeTl.to(prev, { yPercent: 100, opacity: 0, duration: dur }, 0);
			}

			const prevItemIdx = currentIndex - 1;
			const nextItemIdx = nextIndex - 1;
			if (prevItemIdx >= 0 && transformItems[prevItemIdx]) {
				activeTl.to(transformItems[prevItemIdx], { opacity: 0.35, duration: dur * 0.55 }, 0);
			}
			if (nextItemIdx >= 0 && transformItems[nextItemIdx]) {
				activeTl.to(transformItems[nextItemIdx], { opacity: 1, duration: dur * 0.55 }, 0);
			}

			currentIndex = nextIndex;
		}

		if (onMobile) {
			function handleMobileScroll() {
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
				const targetSlideIndex = firstRect && firstRect.top > viewportMid ? 0 : closestItemIndex + 1;

				setActiveImage(targetSlideIndex);
			}

			window.addEventListener("scroll", handleMobileScroll, { passive: true });
			handleMobileScroll();
		} else {
			if (!lenis && typeof Lenis !== "undefined") {
				lenis = new Lenis({ autoRaf: true });
			}

			lenis?.on("scroll", () => {
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
				const targetSlideIndex = firstRect && firstRect.top > viewportMid ? 0 : closestItemIndex + 1;

				setActiveImage(targetSlideIndex);
			});
		}
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
});
