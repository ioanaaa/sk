function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });
}

// Load all scripts with proper dependency order
async function loadAllScripts() {
  
  try {
    // Load jQuery and GSAP in parallel (independent)
    await Promise.all([
      loadScript("https://code.jquery.com/jquery-3.6.0.min.js"), // Required for jQuery UI
      loadScript("https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js")
    ]);
    console.log("jQuery and GSAP loaded");
    console.log("BUNDLE.JS UPDATED VERSION LOADED - DEBUG MODE");

    // Load dependent scripts in parallel where possible
    await Promise.all([
      loadScript("https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"),
      loadScript("https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"),
      loadScript("https://code.jquery.com/ui/1.12.1/jquery-ui.js"),
    ]);
    console.log("ScrollTrigger, SplitText, and jQuery UI loaded");

    // Load jQuery UI Touch Punch (depends on jQuery UI)
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js");
    console.log("jQuery UI Touch Punch loaded");

    // Run the main script after all dependencies are loaded
    runMainScript();
  } catch (error) {
    console.error("Error loading scripts:", error);
  }
}

function runMainScript() {
  console.log("All libraries loaded, checking DOM readiness...");

  // Preloader class definition (same as before)
  class SimplePreloader {
    constructor() {
      this.object = document.querySelector('.animated-preloader-object');
      this.preloaderSection = document.querySelector('div[id*="preloadercanvas"]');
      this.currentAnimation = null;
      this.isPageLoaded = false;
      this.startTime = Date.now();
      
      if (this.preloaderSection) {
        this.init();
      } 
    }

    init() {
      const activatePreloader = getComputedStyle(document.documentElement).getPropertyValue('--activate-preloader').trim();
      
      if (activatePreloader !== 'true') {
        this.preloaderSection.style.display = 'none';
        return;
      }
      
      this.preloaderSection.classList.add('preloader-active');
      this.preloaderSection.style.opacity = '1';
      
      const animationType = getComputedStyle(document.documentElement).getPropertyValue('--preloader-animation').trim();
      
      const minDisplayRaw = getComputedStyle(document.documentElement).getPropertyValue('--min-display-time').trim();
      let minDisplayTime = 3000;  // Default fallback (3s)
      if (minDisplayRaw) {
        const cleanMinDisplay = minDisplayRaw.replace(/[a-zA-Z%]+$/g, '');
        const numericMinDisplay = parseFloat(cleanMinDisplay);
        if (!isNaN(numericMinDisplay) && numericMinDisplay > 0) {
          minDisplayTime = numericMinDisplay * 1000;  // Convert s to ms
        }
      }
      
      const animationDurationRaw = getComputedStyle(document.documentElement).getPropertyValue('--animation-duration').trim();
      let animationDuration = 1.5;  // Default fallback (1.5s)
      if (animationDurationRaw) {
        const cleanAnimationDuration = animationDurationRaw.replace(/[a-zA-Z%]+$/g, '');
        const numericAnimationDuration = parseFloat(cleanAnimationDuration);
        if (!isNaN(numericAnimationDuration) && numericAnimationDuration > 0) {
          animationDuration = numericAnimationDuration;  
        }
      }
      
      const fadeDurationRaw = getComputedStyle(document.documentElement).getPropertyValue('--fade-duration').trim();
      let fadeDuration = 0.5;  // Default fallback (0.5s)
      if (fadeDurationRaw) {
        const cleanFadeDuration = fadeDurationRaw.replace(/[a-zA-Z%]+$/g, '');
        const numericFadeDuration = parseFloat(cleanFadeDuration);
        if (!isNaN(numericFadeDuration) && numericFadeDuration > 0) {
          fadeDuration = numericFadeDuration;  
        }
      }
      
      this.startAnimation(animationType, animationDuration);
      
      // Wait for full load 
      window.addEventListener('load', () => {
        this.preloadImagesAndGSAP(() => {
          this.isPageLoaded = true;
          this.checkHidePreloader(minDisplayTime);
        });
      });

      setTimeout(() => {
        this.checkHidePreloader(minDisplayTime);
      }, minDisplayTime);
    }

    preloadImagesAndGSAP(callback) {
      if (typeof gsap === 'undefined') {
        setTimeout(() => this.preloadImagesAndGSAP(callback), 500);
        return;
      }
      const images = document.querySelectorAll('img');
      let loaded = 0;
      const total = images.length;
      if (total === 0) {
        callback();
        return;
      }
      images.forEach(img => {
        if (img.complete) {
          loaded++;
        } else {
          img.onload = () => {
            loaded++;
            if (loaded === total) callback();
          };
          img.onerror = () => {
            loaded++;
            if (loaded === total) callback();
          };
        }
      });
      if (loaded === total) callback();
    }

    checkHidePreloader(minDisplayTime) {
      const elapsedTime = Date.now() - this.startTime;
      if (this.isPageLoaded && elapsedTime >= minDisplayTime) {
        this.hidePreloader();
      }
    }

    startAnimation(type, animationDuration) {
      this.clearAnimations();
      
      if (this.object) this.object.style.opacity = '1';
      
      switch(type) {
        case 'pulse':
          this.setupPulseAnimation(animationDuration);
          break;
        case 'rotate':
          this.setupRotateAnimation(animationDuration);
          break;
        case 'none':
          if (this.object) this.object.style.opacity = '1';
          break;
        default:
          if (this.object) this.object.style.opacity = '1';
      }
    }

    setupPulseAnimation(animationDuration) {
      if (!this.object || typeof gsap === 'undefined') return;
      this.currentAnimation = gsap.to(this.object, {
        scale: 1.05,
        duration: animationDuration,  // dynamic duration
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        transformOrigin: "center center"
      });
    }

    setupRotateAnimation(animationDuration) {
      if (!this.object || typeof gsap === 'undefined') return;
      this.currentAnimation = gsap.to(this.object, {
        rotation: 360,
        duration: animationDuration,  // dynamic duration
        ease: "none",
        repeat: -1,
        transformOrigin: "center center"
      });
    }

    clearAnimations() {
      if (this.currentAnimation) {
        this.currentAnimation.kill();
        this.currentAnimation = null;
      }
    }

    hidePreloader() {
      if (!this.preloaderSection) return;
      
      const fadeDurationRaw = getComputedStyle(document.documentElement).getPropertyValue('--fade-duration').trim();
      let fadeDuration = 0.5;  // default fallback (0.5s)
      if (fadeDurationRaw) {
        const cleanFadeDuration = fadeDurationRaw.replace(/[a-zA-Z%]+$/g, '');
        const numericFadeDuration = parseFloat(cleanFadeDuration);
        if (!isNaN(numericFadeDuration) && numericFadeDuration > 0) {
          fadeDuration = numericFadeDuration;
        }
      }
      
      if (typeof gsap !== 'undefined') {
        gsap.to(this.preloaderSection, {
          opacity: 0,
          duration: fadeDuration,  
          ease: "power2.out",
          onComplete: () => {
            this.clearAnimations();
            this.preloaderSection.style.display = 'none';
          }
        });
      } else {
        this.preloaderSection.style.display = 'none';
      }
    }
  }

  // Function to run the main effects code
  function runMainEffects() {
    console.log("Main script running..."); // Debug log

    let preloaderInstance = new SimplePreloader();
    
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && typeof SplitText !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger, SplitText);
      ScrollTrigger.config({
        ignoreMobileResize: true,  
        autoRefreshEvents: "visibilitychange,DOMContentLoaded,load" 
      });
      gsap.config({ autoSleep: 60, force3D: true });  
    } else {
      console.error("GSAP, ScrollTrigger, or SplitText not loaded");
      return;
    }

    // Inject extra CSS
    const style = document.createElement('style');
    style.textContent = `
      /* ---- Draggable -----*/
      .draggable:hover {
        cursor: move;
        cursor: -moz-move;
        cursor: -webkit-move;
        z-index: 1;
      }

      /* ---- Photo on Hover -----*/
      .hoverphoto {
        visibility: hidden;
        opacity: 0;
        pointer-events: none;
      }

      /* ---- Horizontal Scroll ------ */
      @media only screen and (min-width: 750px) {
        .fixed-container {
          position: relative;
        }
        .fixed {
          position: sticky;
          top: 0;
          width: 100%;
          height: 100vh;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .fixed::-webkit-scrollbar {
          display: none;
        }
        .sticky-fixed {
          position: fixed;
          top: 0;
          z-index: -1;
        }
        .horizontal {
          display: flex;
          height: 100vh;
          align-items: stretch;
          width: fit-content;
        }
        .horizontal > div {
          flex-shrink: 0;
          min-width: 100vw;
          width: 100vw;
          height: 100vh;
        }
      }

      @media only screen and (max-width: 749px) {
        .fixed-container {
          height: auto !important;
        }
        .fixed {
          position: static !important;
          height: auto !important;
          overflow: visible !important;
        }
        .horizontal {
          display: block !important;
        }
        .horizontal > div {
          min-width: auto !important;
          width: 100% !important;
        }
      }

      /* ---- Preloader Animation ------ */
      .preloader-active {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 9999 !important;
        transition: opacity 0.5s ease-out;
        display: block !important;
      }
    `;
    document.head.appendChild(style);

    // Draggable
    if (document.querySelector('.draggable') && typeof $.fn.draggable !== 'undefined') {
      $(function () {
        $(".draggable").draggable({
          containment: ".sb:has(.draggable)"
        });
      });
    }

    // Textfill
    const textContainers = document.querySelectorAll(".textfill");
    if (textContainers.length) {
      console.log('Textfill: Found', textContainers.length, '.textfill elements');
      textContainers.forEach((textContainer) => {
        const textElement = textContainer.querySelector("p, h1, h2, h3, h4, h5, h6, span");
        if (!textElement) {
          console.warn('Textfill: No text element found in', textContainer);
          return;
        }
        
        let split = new SplitText(textElement, { type: "chars" });
        if (!split.chars || split.chars.length === 0) {
          console.warn('Textfill: SplitText failed for', textElement);
          return;
        }
        
        gsap.set(split.chars, { opacity: 0.2 });    
        
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: textContainer,
            start: "top 80%",
            end: "top 10%",
            scrub: 1,  
            invalidateOnRefresh: true
          }
        });
        tl.to(split.chars, {  
          opacity: 1, 
          stagger: 0.3,  
          duration: 1      
        });
        
        tl.progress(0);  
      });
    }

    // Sliding Galleries
    (function() {
      if (!document.querySelector('.gallery1') || !document.querySelector('.gallery2')) return;
      
      let gallery1, gallery2, content1, content2;
      let currentOffset1 = 0;
      let currentOffset2 = 0;
      let targetOffset1 = 0;
      let targetOffset2 = 0;
      let isAnimating = false;
      const lerpFactor = 0.08;

      function init() {
        gallery1 = document.querySelector('.gallery1');
        gallery2 = document.querySelector('.gallery2');
        if (!gallery1 || !gallery2) return;
        content1 = gallery1.firstElementChild;
        content2 = gallery2.firstElementChild;
        if (!content1 || !content2) return;
        startSmoothAnimation();
      }

      function getTargetOffsets() {
        const scrollY = window.scrollY;
        const gallery1Rect = gallery1.getBoundingClientRect();
        const gallery1Top = gallery1Rect.top + scrollY;
        const effectStart = gallery1Top - window.innerHeight;
        const effectRange = window.innerHeight * 2.5;
        const effectEnd = effectStart + effectRange;

        if (scrollY >= effectStart && scrollY <= effectEnd) {
          const progress = (scrollY - effectStart) / effectRange;
          const maxMove = 400;
          targetOffset1 = (progress * maxMove * 2) - maxMove;
          targetOffset2 = -targetOffset1;
        }
      }

      function smoothUpdate() {
        getTargetOffsets();
        currentOffset1 += (targetOffset1 - currentOffset1) * lerpFactor;
        currentOffset2 += (targetOffset2 - currentOffset2) * lerpFactor;
        content1.style.marginLeft = `${currentOffset1}px`;
        content2.style.marginLeft = `${currentOffset2}px`;
        requestAnimationFrame(smoothUpdate);
      }

      function startSmoothAnimation() {
        if (!isAnimating) {
          isAnimating = true;
          requestAnimationFrame(smoothUpdate);
        }
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    })();

    // Images Appearing on Hover
    if (document.querySelector('.hovertitle') && document.querySelector('.hoverphoto')) {
      const hoverTitles = document.querySelectorAll('.hovertitle');
      const hoverPhotos = document.querySelectorAll('.hoverphoto');
      let activePhotoIndex = -1;

      gsap.set(hoverPhotos, {
        opacity: 0,
        scale: 0.6,
        visibility: "hidden",
        transformOrigin: "center center"
      });

      function hideAllPhotos() {
        hoverPhotos.forEach((photo, index) => {
          gsap.killTweensOf(photo);
          gsap.to(photo, {
            opacity: 0,
            scale: 0.7,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => {
              gsap.set(photo, { visibility: "hidden" });
            }
          });
        });
        activePhotoIndex = -1;
      }

      hoverTitles.forEach((title, index) => {
        const photo = hoverPhotos[index];
        if (photo) {
          title.addEventListener('mouseenter', () => {
            if (activePhotoIndex !== -1 && activePhotoIndex !== index) {
              const previousPhoto = hoverPhotos[activePhotoIndex];
              gsap.killTweensOf(previousPhoto);
              gsap.to(previousPhoto, {
                opacity: 0,
                scale: 0.7,
                duration: 0.2,
                ease: "power2.in",
                onComplete: () => {
                  gsap.set(previousPhoto, { visibility: "hidden" });
                }
              });
            }
            activePhotoIndex = index;
            gsap.killTweensOf(photo);
            gsap.to(photo, {
              opacity: 1,
              scale: 1,
              visibility: "visible",
              duration: 0.5,
              ease: "power3.out"
            });
          });

          title.addEventListener('mouseleave', () => {
            if (activePhotoIndex === index) {
              gsap.killTweensOf(photo);
              gsap.to(photo, {
                opacity: 0,
                scale: 0.7,
                duration: 0.4,
                ease: "power3.in",
                onComplete: () => {
                  gsap.set(photo, { visibility: "hidden" });
                  if (activePhotoIndex === index) {
                    activePhotoIndex = -1;
                  }
                }
              });
            }
          });
        }
      });

      const container = document.querySelector('.container');
      if (container) {
        container.addEventListener('mouseleave', hideAllPhotos);
      }

      window.addEventListener('blur', hideAllPhotos);

      let scrollTimeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(hideAllPhotos, 100);
      });
    }

    // Logo on Scroll
    if (document.querySelector('.animated-logo') && window.innerWidth > 768) {
      const root = document.documentElement;
      let triggerElement = document.querySelector('.sb:has(.animated-logo)');
      let targetElement = $(".animated-logo");
      let tl;

      function getViewportRelativeScale(element) {
        const rect = element.getBoundingClientRect();
        const elementWidth = rect.width;
        const elementHeight = rect.height;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const targetViewportRatio = parseFloat(getComputedStyle(root).getPropertyValue('--viewport-percentage')) || 1;
        const scaleX = (vw * targetViewportRatio) / elementWidth;
        const scaleY = (vh * targetViewportRatio) / elementHeight;
        const finalScale = Math.min(scaleX, scaleY);
        return Math.max(0.5, Math.min(finalScale, 4.0));
      }

      function createTimeline() {
        if (!triggerElement || !targetElement.length) return;
        const baseScale = getViewportRelativeScale(targetElement[0]);

        if (tl) tl.kill();
        gsap.set(targetElement, { opacity: 0 });

        gsap.fromTo(targetElement, 
          { opacity: 0 }, 
          { opacity: 1, duration: 1, ease: "power2.out" }
        );

        tl = gsap.timeline({
          scrollTrigger: {
            trigger: triggerElement,
            start: "top bottom",
            end: "top top",
            scrub: 1,
            ease: "slow(0.7,0.7,false)",
            transformOrigin: 'center center',
            invalidateOnRefresh: true
          }
        });

        tl.from(targetElement, {
          y: '-350%',
          scale: baseScale,
          xPercent: -50,
          left: '50%',
          duration: 2
        });
      }

      createTimeline();

      let resizeTimeout;
      window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) return;
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(createTimeline, 150);
      });
    }

    // Horizontal Scroll
    (function() {
      if (!document.querySelector('[id*="horizontalscroll"]')) return;
      let isInitialized = false;

      function initHorizontalScroll() {
        if (isInitialized) return;
        const targetElements = Array.from(document.querySelectorAll('[id*="horizontalscroll"]'));
        if (targetElements.length === 0) return;

        const stickyParentDiv = document.createElement("div");
        stickyParentDiv.className = "fixed-container";
        const stickyDiv = document.createElement("div");
        stickyDiv.className = "fixed";
        const horizontalDiv = document.createElement("div");
        horizontalDiv.className = "horizontal";

        targetElements[0].parentNode.insertBefore(stickyParentDiv, targetElements[0]);
        stickyParentDiv.appendChild(stickyDiv);
        stickyDiv.appendChild(horizontalDiv);

        targetElements.forEach(el => {
          horizontalDiv.appendChild(el);
          el.style.display = 'block';
          el.style.minWidth = '100vw';
          el.style.flexShrink = '0';
          el.style.zIndex = '-1';
        });

        stickyParentDiv.style.height = `${targetElements.length * 100}vh`;

        function horizontalScroll() {
          const sticky = document.querySelector('.fixed');
          const stickyParent = document.querySelector('.fixed-container');
          if (!sticky || !stickyParent) return;

          const stickyParentRect = stickyParent.getBoundingClientRect();
          if (stickyParentRect.top > 0) {
            sticky.classList.remove('sticky-fixed');
            sticky.scrollLeft = 0;
            return;
          }

          sticky.classList.add('sticky-fixed');
          const scrollProgress = Math.min(1, Math.max(0, -stickyParentRect.top / (stickyParentRect.height - window.innerHeight)));
          sticky.scrollLeft = scrollProgress * (sticky.scrollWidth - sticky.clientWidth);
        }

        document.addEventListener('scroll', horizontalScroll);
        horizontalScroll();
        isInitialized = true;
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHorizontalScroll);
      } else {
        initHorizontalScroll();
      }
    })();

    // Image grow on scroll
    if (document.querySelector('.grow-image')) {
      const containers = document.querySelectorAll(".grow-image");
      const root = document.documentElement;
      
      const scale = parseFloat(getComputedStyle(root).getPropertyValue('--initial-image-scale').trim()) || 1;
      const cropTop = getComputedStyle(root).getPropertyValue('--initial-crop-top').trim() || '0%';
      const cropRight = getComputedStyle(root).getPropertyValue('--initial-crop-right').trim() || '0%';
      const cropBottom = getComputedStyle(root).getPropertyValue('--initial-crop-bottom').trim() || '0%';
      const cropLeft = getComputedStyle(root).getPropertyValue('--initial-crop-left').trim() || '0%';

      containers.forEach((container, index) => {
        const imageDiv = container.querySelector("div[style*='background-image'], div[class*='image'], div");
        if (imageDiv) {
          imageDiv.classList.add("grow-image-inner");

          const sbSection = container.closest(".sb");
          if (sbSection) {
            const ssBgDiv = container.closest(".ss-bg");  
            if (ssBgDiv) {
              const mm = gsap.matchMedia();

              // Desktop: min-width 1025px
              mm.add("(min-width: 1025px)", () => {
                gsap.set(sbSection, { position: "relative", overflow: "hidden" });
                gsap.set(ssBgDiv, { 
                  position: "absolute", 
                  top: 0, 
                  left: 0, 
                  width: "100%", 
                  height: "100%" 
                });
                gsap.set(imageDiv, { 
                  position: "absolute", 
                  top: 0, 
                  left: 0, 
                  width: "100%", 
                  height: "100%", 
                  transformOrigin: "center center",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                });
          
                gsap.timeline({
                  scrollTrigger: {
                    trigger: sbSection,
                    start: "top top",
                    end: "+=150%",  
                    scrub: 1,
                    pin: sbSection,  
                    pinSpacing: true,  
                    refreshPriority: 1,  
                    invalidateOnRefresh: true  
                  }
                }).fromTo(imageDiv, 
                  {
                    scale: scale,
                    clipPath: `inset(${cropTop} ${cropRight} ${cropBottom} ${cropLeft})`
                  }, 
                  {
                    scale: 1,
                    clipPath: "inset(0% 0% 0% 0%)",
                    ease: "none"  // Linear scrub for smooth scroll tie-in
                  }
                );
              });
            }
          }
        }
      });
    }

    // Canvas Theme Switch on Scroll
    if (document.querySelector('.bgchange')) {
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --theme-bg: var(--end-color);
          --theme-text: var(--start-color);
          --theme-border: var(--start-color);
        }
        .sb:has(.bgchange) {
          background-color: var(--theme-bg) !important;
          color: var(--theme-text) !important;
        }
        .sb:has(.bgchange) h1, .sb:has(.bgchange) h2, .sb:has(.bgchange) h3,
        .sb:has(.bgchange) h4, .sb:has(.bgchange) h5, .sb:has(.bgchange) h6,
        .sb:has(.bgchange) p, .sb:has(.bgchange) span, .sb:has(.bgchange) div,
        .sb:has(.bgchange) li, .sb:has(.bgchange) a, .sb:has(.bgchange) .auto-color {
          color: var(--theme-text) !important;
        }
        .sb:has(.bgchange) svg {
          fill: var(--theme-text) !important;
          stroke: var(--theme-border) !important;
        }
        .sb:has(.bgchange) svg path, .sb:has(.bgchange) svg circle,
        .sb:has(.bgchange) svg rect, .sb:has(.bgchange) svg polygon {
          fill: var(--theme-text) !important;
          stroke: var(--theme-border) !important;
        }
        .sb:has(.bgchange) *[style*="border"], .sb:has(.bgchange) .border,
        .sb:has(.bgchange) .bordered {
          border-color: var(--theme-border) !important;
        }
        .sb:has(.bgchange) *:not(svg):not(path):not(circle):not(rect):not(polygon) {
          border-color: var(--theme-border) !important;
        }
        .sb:has(.bgchange) .border-top, .sb:has(.bgchange) *[class*="border-t"] {
          border-top-color: var(--theme-border) !important;
        }
        .sb:has(.bgchange) .border-bottom, .sb:has(.bgchange) *[class*="border-b"] {
          border-bottom-color: var(--theme-border) !important;
        }
        .sb:has(.bgchange) .border-left, .sb:has(.bgchange) *[class*="border-l"] {
          border-left-color: var(--theme-border) !important;
        }
        .sb:has(.bgchange) .border-right, .sb:has(.bgchange) *[class*="border-r"] {
          border-right-color: var(--theme-border) !important;
        }
        .sb:has(.bgchange) * {
          outline-color: var(--theme-border) !important;
        }
        .sb:has(.bgchange) *[style*="box-shadow"] {
          filter: hue-rotate(0deg) brightness(1) contrast(1) !important;
        }
        .sb:has(.bgchange) .border-primary, .sb:has(.bgchange) .border-secondary,
        .sb:has(.bgchange) .border-success, .sb:has(.bgchange) .border-info,
        .sb:has(.bgchange) .border-warning, .sb:has(.bgchange) .border-danger,
        .sb:has(.bgchange) .border-light, .sb:has(.bgchange) .border-dark {
          border-color: var(--theme-border) !important;
        }
        .sb:has(.bgchange) *[class*="border-gray"], .sb:has(.bgchange) *[class*="border-red"],
        .sb:has(.bgchange) *[class*="border-blue"], .sb:has(.bgchange) *[class*="border-green"],
        .sb:has(.bgchange) *[class*="border-yellow"], .sb:has(.bgchange) *[class*="border-purple"],
        .sb:has(.bgchange) *[class*="border-pink"], .sb:has(.bgchange) *[class*="border-indigo"],
        .sb:has(.bgchange) *[class*="border-black"], .sb:has(.bgchange) *[class*="border-white"] {
          border-color: var(--theme-border) !important;
        }
        .sb:has(.bgchange) button, .sb:has(.bgchange) .button, .sb:has(.bgchange) .btn {
          color: var(--theme-text) !important;
          border-color: var(--theme-border) !important;
        }
        .sb:has(.bgchange) input, .sb:has(.bgchange) textarea, .sb:has(.bgchange) select {
          color: var(--theme-text) !important;
          border-color: var(--theme-border) !important;
          background-color: var(--theme-bg) !important;
        }
        .sb:has(.bgchange) .same-as-content button, .sb:has(.bgchange) .same-as-content .button,
        .sb:has(.bgchange) .same-as-content .btn {
          border-color: var(--theme-border) !important;
          background-color: var(--theme-text) !important;
        }
        .sb:has(.bgchange) .same-as-content button span {
          color: var(--theme-bg) !important;
        }
        .sb:has(.bgchange) .same-as-bg button, .sb:has(.bgchange) .same-as-bg .button,
        .sb:has(.bgchange) .same-as-bg .btn {
          border-color: var(--theme-text) !important;
          background-color: var(--theme-bg) !important;
        }
        .sb:has(.bgchange) .same-as-bg button span {
          color: var(--theme-text) !important;
        }
        .sb:has(.bgchange) body {
          background-color: var(--theme-bg) !important;
          color: var(--theme-text) !important;
          transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out !important;
          margin: 0;
        }
        .sb:has(.bgchange) div:not(.sb):not(.sp):not(.ss-s):not(.ss-bg):not(.sc):not(.ss):not(.same-as-content):not(.same-as-bg) {
          color: var(--theme-text) !important;
          border-color: var(--theme-border) !important;
          transition: color 0.3s ease-in-out, border-color 0.3s ease-in-out !important;
        }
        .sb:has(.bgchange) svg:not(.theme-one-toggle):not(.theme-two-toggle) {
          fill: var(--theme-text) !important;
          transition: fill 0.2s ease-out !important;
          will-change: fill;
        }
        .sb:has(.bgchange) svg:not(.theme-one-toggle):not(.theme-two-toggle):not(.same-as-content svg):not(.same-as-bg svg) :where([stroke], [style*="stroke"]) {
          stroke: var(--theme-text) !important;
          transition: stroke 0.2s ease-out !important;
          will-change: stroke;
        }
        .sb:has(.bgchange) .navbar, .sb:has(.bgchange) .nav, .sb:has(.bgchange) .header, .sb:has(.bgchange) nav {
          color: var(--theme-text) !important;
          transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out !important;
        }
        .sb:has(.bgchange) .theme-one-toggle, .sb:has(.bgchange) .theme-two-toggle {
          transition: none !important;
          background-color: transparent !important;
        }
        .sb:has(.bgchange) .same-as-content div {
          color: var(--theme-text) !important;
          background-color: var(--theme-text) !important;
          border-color: var(--theme-text) !important;
          transition: color 0.3s ease-in-out, background-color 0.3s ease-in-out, border-color 0.3s ease-in-out !important;
        }
        .sb:has(.bgchange) .same-as-content h1, .sb:has(.bgchange) .same-as-content h2,
        .sb:has(.bgchange) .same-as-content h3, .sb:has(.bgchange) .same-as-content h4,
        .sb:has(.bgchange) .same-as-content h5, .sb:has(.bgchange) .same-as-content h6,
        .sb:has(.bgchange) .same-as-content p, .sb:has(.bgchange) .same-as-content span,
        .sb:has(.bgchange) .same-as-content a, .sb:has(.bgchange) .same-as-content .auto-color {
          color: var(--theme-text) !important;
          border-color: var(--theme-text) !important;
          transition: color 0.3s ease-in-out, border-color 0.3s ease-in-out !important;
        }
        .sb:has(.bgchange) .same-as-content [style*="background"], .sb:has(.bgchange) .same-as-content [style*="background-color"] {
          background-color: var(--theme-text) !important;
          transition: background-color 0.3s ease-in-out !important;
        }
        .sb:has(.bgchange) .same-as-content svg:not(.theme-one-toggle):not(.theme-two-toggle) {
          fill: var(--theme-text) !important;
          transition: fill 0.2s ease-out !important;
          will-change: fill;
        }
        .sb:has(.bgchange) .same-as-content svg:not(.theme-one-toggle):not(.theme-two-toggle) :where([stroke], [style*="stroke"]) {
          stroke: var(--theme-text) !important;
          transition: stroke 0.2s ease-out !important;
          will-change: stroke;
        }
        .sb:has(.bgchange) .same-as-bg div {
          color: var(--theme-bg) !important;
          background-color: var(--theme-bg) !important;
          border-color: var(--theme-bg) !important;
          transition: color 0.3s ease-in-out, background-color 0.3s ease-in-out, border-color 0.3s ease-in-out !important;
        }
        .sb:has(.bgchange) .same-as-bg h1, .sb:has(.bgchange) .same-as-bg h2,
        .sb:has(.bgchange) .same-as-bg h3, .sb:has(.bgchange) .same-as-bg h4,
        .sb:has(.bgchange) .same-as-bg h5, .sb:has(.bgchange) .same-as-bg h6,
        .sb:has(.bgchange) .same-as-bg p, .sb:has(.bgchange) .same-as-bg span,
        .sb:has(.bgchange) .same-as-bg a, .sb:has(.bgchange) .same-as-bg .auto-color {
          color: var(--theme-bg) !important;
          border-color: var(--theme-bg) !important;
          transition: color 0.3s ease-in-out, border-color 0.3s ease-in-out !important;
        }
        .sb:has(.bgchange) .same-as-bg [style*="background"], .sb:has(.bgchange) .same-as-bg [style*="background-color"] {
          background-color: var(--theme-bg) !important;
          transition: background-color 0.3s ease-in-out !important;
        }
        .sb:has(.bgchange) .same-as-bg svg:not(.theme-one-toggle):not(.theme-two-toggle) {
          fill: var(--theme-bg) !important;
          transition: fill 0.2s ease-out !important;
          will-change: fill;
        }
        .sb:has(.bgchange) .same-as-bg svg:not(.theme-one-toggle):not(.theme-two-toggle) :where([stroke], [style*="stroke"]) {
          stroke: var(--theme-bg) !important;
          transition: stroke 0.2s ease-out !important;
          will-change: stroke;
        }
      `;
      document.head.appendChild(style);

      const root = document.documentElement;
      let startColor = getComputedStyle(root).getPropertyValue('--start-color').trim() || '#000';
      let endColor = getComputedStyle(root).getPropertyValue('--end-color').trim() || '#fff';

      gsap.set(root, {
        "--theme-bg": startColor,
        "--theme-text": endColor,
        "--theme-border": endColor
      });

      document.querySelectorAll('.bgchange').forEach(bgchange => {
        const triggerElement = bgchange.querySelector('svg');  
        
        if (triggerElement) {
          ScrollTrigger.create({
            trigger: triggerElement,
            start: "top center",
            end: "bottom center",
            pinnedContainer: true,  
            invalidateOnRefresh: true,
            refreshPriority: -1,
            markers: false,
            onEnter: () => {
              gsap.to(root, {
                duration: 0.5,
                ease: "power2.inOut",
                "--theme-bg": endColor,
                "--theme-text": startColor,
                "--theme-border": startColor
              });
            },
            onLeaveBack: () => {
              gsap.to(root, {
                duration: 0.5,
                ease: "power2.inOut",
                "--theme-bg": startColor,
                "--theme-text": endColor,
                "--theme-border": endColor
              });
            }
          });
        }
      });

      // Global resize handler for all ScrollTriggers
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          ScrollTrigger.refresh();
        }, 250); 
      });
    }
  }

  // Check DOM readiness and run main effects
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runMainEffects);
  } else {
    runMainEffects();
  }

  // Instantiate preloader early (as in original)
  if (typeof SimplePreloader !== 'undefined') {
    new SimplePreloader();
  }
}

// Start loading scripts
loadAllScripts();
