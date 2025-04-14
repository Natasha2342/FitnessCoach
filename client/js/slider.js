document.addEventListener('DOMContentLoaded', function() {
    const sliderTrack = document.querySelector('.slider-track');
    const slides = document.querySelectorAll('.testimonial-card');
    
    if (!sliderTrack || slides.length === 0) return;
    
    let currentPosition = 0;
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID = 0;
    let autoplayInterval;
    let isPaused = false;
    
    // Clone slides for infinite scroll effect
    const firstSlideClone = slides[0].cloneNode(true);
    const lastSlideClone = slides[slides.length - 1].cloneNode(true);
    
    sliderTrack.appendChild(firstSlideClone);
    sliderTrack.insertBefore(lastSlideClone, slides[0]);
    
    // Set initial position
    updateSlidePosition();
    
    // Mouse events for dragging
    sliderTrack.addEventListener('mousedown', dragStart);
    sliderTrack.addEventListener('touchstart', dragStart);
    sliderTrack.addEventListener('mouseup', dragEnd);
    sliderTrack.addEventListener('touchend', dragEnd);
    sliderTrack.addEventListener('mouseleave', dragEnd);
    sliderTrack.addEventListener('mousemove', drag);
    sliderTrack.addEventListener('touchmove', drag);
    
    // Prevent text selection during drag
    sliderTrack.addEventListener('selectstart', e => e.preventDefault());
    
    // Pause on hover
    sliderTrack.addEventListener('mouseenter', () => {
        isPaused = true;
        stopAutoplay();
    });
    
    sliderTrack.addEventListener('mouseleave', () => {
        isPaused = false;
        startAutoplay();
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        updateSlidePosition();
    });
    
    function updateSlidePosition() {
        const slideWidth = slides[0].offsetWidth;
        const gap = 20; // Match the gap in CSS
        sliderTrack.style.transform = `translateX(-${currentPosition}px)`;
    }
    
    function moveSlider() {
        if (isPaused) return;
        
        const slideWidth = slides[0].offsetWidth;
        const gap = 20;
        const totalWidth = slideWidth + gap;
        
        currentPosition += 1; // Adjust speed by changing this value
        
        // Reset position when reaching the end
        if (currentPosition >= (slides.length + 2) * totalWidth) {
            currentPosition = totalWidth;
        }
        
        updateSlidePosition();
    }
    
    function dragStart(e) {
        isDragging = true;
        startPos = getPositionX(e);
        prevTranslate = currentTranslate;
        isPaused = true;
        stopAutoplay();
        
        // Add grabbing cursor
        sliderTrack.style.cursor = 'grabbing';
    }
    
    function dragEnd() {
        isDragging = false;
        cancelAnimationFrame(animationID);
        
        // Remove grabbing cursor
        sliderTrack.style.cursor = 'grab';
        
        const movedBy = currentTranslate - prevTranslate;
        
        // If moved enough, adjust position
        if (Math.abs(movedBy) > 100) {
            const slideWidth = slides[0].offsetWidth;
            const gap = 20;
            const totalWidth = slideWidth + gap;
            
            if (movedBy < 0) {
                currentPosition += totalWidth;
            } else {
                currentPosition -= totalWidth;
            }
            
            // Ensure position stays within bounds
            if (currentPosition < totalWidth) {
                currentPosition = totalWidth;
            } else if (currentPosition >= (slides.length + 2) * totalWidth) {
                currentPosition = totalWidth;
            }
        }
        
        updateSlidePosition();
        isPaused = false;
        startAutoplay();
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        const currentPosition = getPositionX(e);
        currentTranslate = prevTranslate + currentPosition - startPos;
        
        // Apply the drag
        sliderTrack.style.transform = `translateX(${currentTranslate}px)`;
    }
    
    function getPositionX(e) {
        return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }
    
    function startAutoplay() {
        stopAutoplay();
        autoplayInterval = setInterval(moveSlider, 30); // Adjust speed by changing interval
    }
    
    function stopAutoplay() {
        clearInterval(autoplayInterval);
    }
    
    // Start the continuous movement
    startAutoplay();
}); 