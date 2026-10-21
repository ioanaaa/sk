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

async function loadAllScripts() {
  try {
   
    await Promise.all([
       loadScript("https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js")
    ]);
    

      await Promise.all([
      loadScript("https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"),
      loadScript("https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"),
      loadScript("https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Draggable.min.js"),
    ]);
    

   runMainScript();
  } catch (error) {
    console.error("Error loading scripts:", error);
  }
}

function runMainScript() {
   


  function runMainEffects() {   
     
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && typeof SplitText !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger, SplitText);
      if (typeof Draggable !== 'undefined') gsap.registerPlugin(Draggable);
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
      .draggable {
        cursor: move;
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
          min-width: var(--hs-vw, 100vw);
          width: var(--hs-vw, 100vw);
          height: 100vh;
        }
        .horizontal > div > .shwt-canvas {
          height: 100%;
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

         `;
    document.head.appendChild(style);

    // Draggable
    if (document.querySelector('.draggable') && typeof Draggable !== 'undefined') {
     
      const draggableWrappers = Array.from(document.querySelectorAll('.draggable'))
        .map(el => el.closest('.shwt-element') || el);

      draggableWrappers.forEach(wrapper => {
        Draggable.create(wrapper, {
          type: "x,y",
        
          bounds: (() => {
            const canvas = wrapper.closest('.shwt-canvas');
            return (canvas && canvas.querySelector(':scope > .shwt-bg')) || canvas || undefined;
          })(),
          zIndexBoost: true,                                     
          cursor: "move",
          activeCursor: "move"
        });
      });
    }

    // Textfill    
    const textContainers = document.querySelectorAll(".textfill");
    if (textContainers.length) {
      
      textContainers.forEach((textContainer) => {
       const textTags = "p, h1, h2, h3, h4, h5, h6, span";
        const textElement = textContainer.matches(textTags)
          ? textContainer
          : (textContainer.querySelector(textTags) || textContainer);
        if (!textElement || !textElement.textContent.trim()) {         
          return;
        }
        
        let split = new SplitText(textElement, { type: "words, chars" });
        if (!split.chars || split.chars.length === 0) {
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
      let hasStarted = false;
      let lastX1 = null;
      let lastX2 = null;

  
      let viewportHeight = window.innerHeight;
      let lastViewportWidth = window.innerWidth;
      window.addEventListener('resize', () => {
        if (window.innerWidth !== lastViewportWidth) {
          lastViewportWidth = window.innerWidth;
          viewportHeight = window.innerHeight;
        }
      });

      function init() {
        gallery1 = document.querySelector('.gallery1');
        gallery2 = document.querySelector('.gallery2');
        if (!gallery1 || !gallery2) return;
      
        startSmoothAnimation();
      }

      function resolveContents() {
        if (!content1) content1 = gallery1.querySelector('.embla') || gallery1.firstElementChild;
        if (!content2) content2 = gallery2.querySelector('.embla') || gallery2.firstElementChild;
        return !!(content1 && content2);
      }

      function getTargetOffsets() {
        const scrollY = window.scrollY;
        const gallery1Rect = gallery1.getBoundingClientRect();
        const gallery1Top = gallery1Rect.top + scrollY;
        const effectStart = gallery1Top - viewportHeight;
        const effectRange = viewportHeight * 2.5;

        const progress = Math.min(1, Math.max(0, (scrollY - effectStart) / effectRange));
        const maxMove = 400;
        targetOffset1 = (progress * maxMove * 2) - maxMove;
        targetOffset2 = -targetOffset1;

        if (!hasStarted) {
          currentOffset1 = targetOffset1;
          currentOffset2 = targetOffset2;
          hasStarted = true;
        }
      }

      function smoothUpdate() {
        if (!resolveContents()) {
          requestAnimationFrame(smoothUpdate);
          return;
        }
        getTargetOffsets();
        currentOffset1 += (targetOffset1 - currentOffset1) * lerpFactor;
        currentOffset2 += (targetOffset2 - currentOffset2) * lerpFactor;
       
        const x1 = Math.round(currentOffset1 * 100) / 100;
        const x2 = Math.round(currentOffset2 * 100) / 100;
        if (x1 !== lastX1) {
          content1.style.marginLeft = '';
          content1.style.transform = `translate3d(${x1}px, 0, 0)`;
          lastX1 = x1;
        }
        if (x2 !== lastX2) {
          content2.style.marginLeft = '';
          content2.style.transform = `translate3d(${x2}px, 0, 0)`;
          lastX2 = x2;
        }
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
      let triggerElement = document.querySelector('.shwt-canvas:has(.animated-logo)');
    
      const logoEl = document.querySelector('.animated-logo');
      let targetElement = logoEl.closest('.shwt-element') || logoEl;
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
        if (!triggerElement || !targetElement) return;
        const baseScale = getViewportRelativeScale(targetElement);

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
      // Canvases are identified by a custom class added in the Design App: horizontal-scroll
      const HS_SELECTOR = '.shwt-canvas.horizontal-scroll';
      if (!document.querySelector(HS_SELECTOR)) return;
      let isInitialized = false;

      function initHorizontalScroll() {
        if (isInitialized) return;
        const targetElements = Array.from(document.querySelectorAll(HS_SELECTOR));
        if (targetElements.length === 0) return;

     
        const setHsWidth = () => document.documentElement.style.setProperty('--hs-vw', document.documentElement.clientWidth + 'px');
        setHsWidth();
        window.addEventListener('resize', setHsWidth);

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
          const panel = document.createElement("div");
          panel.className = "horizontal-panel";
          horizontalDiv.appendChild(panel);
          panel.appendChild(el);
          panel.style.display = 'block';
          panel.style.minWidth = 'var(--hs-vw, 100vw)';
          panel.style.flexShrink = '0';
          panel.style.zIndex = '-1';
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

      
        if (typeof ScrollTrigger !== 'undefined') requestAnimationFrame(() => ScrollTrigger.refresh());
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
       
        const imageEl = container.matches('img') ? container : container.querySelector('img');
        if (imageEl) {
          imageEl.classList.add("grow-image-inner");

          const sbSection = container.closest(".shwt-canvas");
          const wrapper = container.closest(".shwt-element");
          if (sbSection && wrapper) {
            const mm = gsap.matchMedia();

            // Desktop: min-width 1025px
            mm.add("(min-width: 1025px)", () => {
            
              gsap.set(wrapper, { transformOrigin: "center center" });

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
              }).fromTo(wrapper,
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
        .shwt-canvas:has(.bgchange) {
          background-color: var(--theme-bg) !important;
          color: var(--theme-text) !important;
        }
        /* In the new publish engine the canvas is only design-width wide; the full-width
           background is its own layer, so the color has to go there too */
        .shwt-canvas:has(.bgchange) > .shwt-bg {
          background-color: var(--theme-bg) !important;
        }
        .shwt-canvas:has(.bgchange) h1:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) h2:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) h3:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) h4:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) h5:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) h6:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) p:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) span:not(.bgchange-keep-text *):not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) div:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) li:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) a:not(.bgchange-keep-text *):not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .auto-color:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          color: var(--theme-text) !important;
        }
        .shwt-canvas:has(.bgchange) svg:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          fill: var(--theme-text) !important;
          stroke: var(--theme-border) !important;
        }
        .shwt-canvas:has(.bgchange) svg path:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) svg circle:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) svg rect:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) svg polygon:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          fill: var(--theme-text) !important;
          stroke: var(--theme-border) !important;
        }
        .shwt-canvas:has(.bgchange) *[style*="border"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .border:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) .bordered:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          border-color: var(--theme-border) !important;
        }
        .shwt-canvas:has(.bgchange) *:not(svg):not(path):not(circle):not(rect):not(polygon):not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          border-color: var(--theme-border) !important;
        }
        .shwt-canvas:has(.bgchange) .border-top:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) *[class*="border-t"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          border-top-color: var(--theme-border) !important;
        }
        .shwt-canvas:has(.bgchange) .border-bottom:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) *[class*="border-b"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          border-bottom-color: var(--theme-border) !important;
        }
        .shwt-canvas:has(.bgchange) .border-left:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) *[class*="border-l"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          border-left-color: var(--theme-border) !important;
        }
        .shwt-canvas:has(.bgchange) .border-right:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) *[class*="border-r"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          border-right-color: var(--theme-border) !important;
        }
        .shwt-canvas:has(.bgchange) *:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          outline-color: var(--theme-border) !important;
        }
        .shwt-canvas:has(.bgchange) *[style*="box-shadow"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          filter: hue-rotate(0deg) brightness(1) contrast(1) !important;
        }
        .shwt-canvas:has(.bgchange) .border-primary:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .border-secondary:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) .border-success:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .border-info:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) .border-warning:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .border-danger:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) .border-light:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .border-dark:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          border-color: var(--theme-border) !important;
        }
        .shwt-canvas:has(.bgchange) *[class*="border-gray"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) *[class*="border-red"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) *[class*="border-blue"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) *[class*="border-green"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) *[class*="border-yellow"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) *[class*="border-purple"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) *[class*="border-pink"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) *[class*="border-indigo"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) *[class*="border-black"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) *[class*="border-white"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          border-color: var(--theme-border) !important;
        }
        .shwt-canvas:has(.bgchange) button:not(.bgchange-keep-text *):not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .button:not(.bgchange-keep-text *):not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .btn:not(.bgchange-keep-text *):not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          color: var(--theme-text) !important;
        }
        .shwt-canvas:has(.bgchange) button:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .button:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .btn:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          border-color: var(--theme-border) !important;
        }
        .shwt-canvas:has(.bgchange) input:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) textarea:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) select:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          color: var(--theme-text) !important;
          border-color: var(--theme-border) !important;
          background-color: var(--theme-bg) !important;
        }
        .shwt-canvas:has(.bgchange) .same-as-content button:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .same-as-content .button:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) .same-as-content .btn:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          border-color: var(--theme-border) !important;
          background-color: var(--theme-text) !important;
        }
        .shwt-canvas:has(.bgchange) .same-as-content button span:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          color: var(--theme-bg) !important;
        }
        .shwt-canvas:has(.bgchange) .same-as-bg button:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .same-as-bg .button:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) .same-as-bg .btn:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          border-color: var(--theme-text) !important;
          background-color: var(--theme-bg) !important;
        }
        .shwt-canvas:has(.bgchange) .same-as-bg button span:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          color: var(--theme-text) !important;
        }
        .shwt-canvas:has(.bgchange) body:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          background-color: var(--theme-bg) !important;
          color: var(--theme-text) !important;
          transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out !important;
          margin: 0;
        }
        .shwt-canvas:has(.bgchange) div:not(.shwt-canvas):not(.shwt-page):not(.shwt-bg):not(.shwt-canvas-view-collection):not(.shwt-canvas-view):not(.same-as-content):not(.same-as-bg):not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          color: var(--theme-text) !important;
          border-color: var(--theme-border) !important;
          transition: color 0.3s ease-in-out, border-color 0.3s ease-in-out !important;
        }
        .shwt-canvas:has(.bgchange) svg:not(.theme-one-toggle):not(.theme-two-toggle):not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          fill: var(--theme-text) !important;
          transition: fill 0.2s ease-out !important;
          will-change: fill;
        }
        .shwt-canvas:has(.bgchange) svg:not(.theme-one-toggle):not(.theme-two-toggle):not(.same-as-content svg):not(.same-as-bg svg) :where([stroke], [style*="stroke"]):not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          stroke: var(--theme-text) !important;
          transition: stroke 0.2s ease-out !important;
          will-change: stroke;
        }
        .shwt-canvas:has(.bgchange) .navbar:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .nav:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .header:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) nav:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          color: var(--theme-text) !important;
          transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out !important;
        }
        .shwt-canvas:has(.bgchange) .theme-one-toggle:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .theme-two-toggle:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          transition: none !important;
          background-color: transparent !important;
        }
        .shwt-canvas:has(.bgchange) .same-as-content div:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          color: var(--theme-text) !important;
          background-color: var(--theme-text) !important;
          border-color: var(--theme-text) !important;
          transition: color 0.3s ease-in-out, background-color 0.3s ease-in-out, border-color 0.3s ease-in-out !important;
        }
        .shwt-canvas:has(.bgchange) .same-as-content h1:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .same-as-content h2:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) .same-as-content h3:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .same-as-content h4:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) .same-as-content h5:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .same-as-content h6:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) .same-as-content p:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .same-as-content span:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) .same-as-content a:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .same-as-content .auto-color:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          color: var(--theme-text) !important;
          border-color: var(--theme-text) !important;
          transition: color 0.3s ease-in-out, border-color 0.3s ease-in-out !important;
        }
        .shwt-canvas:has(.bgchange) .same-as-content [style*="background"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .same-as-content [style*="background-color"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          background-color: var(--theme-text) !important;
          transition: background-color 0.3s ease-in-out !important;
        }
        .shwt-canvas:has(.bgchange) .same-as-content svg:not(.theme-one-toggle):not(.theme-two-toggle):not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          fill: var(--theme-text) !important;
          transition: fill 0.2s ease-out !important;
          will-change: fill;
        }
        .shwt-canvas:has(.bgchange) .same-as-content svg:not(.theme-one-toggle):not(.theme-two-toggle) :where([stroke], [style*="stroke"]):not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          stroke: var(--theme-text) !important;
          transition: stroke 0.2s ease-out !important;
          will-change: stroke;
        }
        .shwt-canvas:has(.bgchange) .same-as-bg div:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          color: var(--theme-bg) !important;
          background-color: var(--theme-bg) !important;
          border-color: var(--theme-bg) !important;
          transition: color 0.3s ease-in-out, background-color 0.3s ease-in-out, border-color 0.3s ease-in-out !important;
        }
        .shwt-canvas:has(.bgchange) .same-as-bg h1:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .same-as-bg h2:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) .same-as-bg h3:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .same-as-bg h4:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) .same-as-bg h5:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .same-as-bg h6:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) .same-as-bg p:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .same-as-bg span:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)),
        .shwt-canvas:has(.bgchange) .same-as-bg a:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .same-as-bg .auto-color:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          color: var(--theme-bg) !important;
          border-color: var(--theme-bg) !important;
          transition: color 0.3s ease-in-out, border-color 0.3s ease-in-out !important;
        }
        .shwt-canvas:has(.bgchange) .same-as-bg [style*="background"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)), .shwt-canvas:has(.bgchange) .same-as-bg [style*="background-color"]:not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          background-color: var(--theme-bg) !important;
          transition: background-color 0.3s ease-in-out !important;
        }
        .shwt-canvas:has(.bgchange) .same-as-bg svg:not(.theme-one-toggle):not(.theme-two-toggle):not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          fill: var(--theme-bg) !important;
          transition: fill 0.2s ease-out !important;
          will-change: fill;
        }
        .shwt-canvas:has(.bgchange) .same-as-bg svg:not(.theme-one-toggle):not(.theme-two-toggle) :where([stroke], [style*="stroke"]):not(.keep-as-is):not(.keep-as-is *):not(:has(> .keep-as-is)){
          stroke: var(--theme-bg) !important;
          transition: stroke 0.2s ease-out !important;
          will-change: stroke;
        }
      `;
      document.head.appendChild(style);

   
      const colorAlpha = (c) => {
        const m = c.match(/^rgba?\((.+)\)$/);
        if (!m) return c === 'transparent' ? 0 : 1;
        const parts = m[1].split(/[\s,\/]+/).filter(Boolean);
        return parts.length >= 4 ? parseFloat(parts[3]) : 1;
      };
      document.querySelectorAll('.shwt-canvas:has(.bgchange) .shwt-button').forEach(btn => {
        if (btn.matches('.same-as-content, .same-as-bg') || btn.querySelector('.same-as-content, .same-as-bg')) return;
        const content = btn.querySelector('.shwt-element-content') || btn;
        const cs = getComputedStyle(content);
        if (colorAlpha(cs.backgroundColor) > 0.05 || cs.backgroundImage !== 'none') {
          btn.classList.add('bgchange-keep-text');
        }
      });

      const root = document.documentElement;
      let startColor = getComputedStyle(root).getPropertyValue('--start-color').trim() || '#000';
      let endColor = getComputedStyle(root).getPropertyValue('--end-color').trim() || '#fff';

      gsap.set(root, {
        "--theme-bg": startColor,
        "--theme-text": endColor,
        "--theme-border": endColor
      });

      document.querySelectorAll('.bgchange').forEach(bgchange => {
        
        const triggerElement = bgchange.matches('svg') ? bgchange : (bgchange.querySelector('svg') || bgchange);
        
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

  // Instantiate preloader early 
  if (typeof SimplePreloader !== 'undefined') {
    new SimplePreloader();
  }
}

// Start loading scripts
loadAllScripts();


