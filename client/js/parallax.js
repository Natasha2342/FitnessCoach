document.addEventListener('DOMContentLoaded', () => {
    const parallaxSections = document.querySelectorAll('.parallax-section');
    let ticking = false;
    
    // Function to handle parallax effect
    const handleParallax = () => {
        const scrolled = window.pageYOffset;
        
        parallaxSections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const rate = scrolled * 0.5;
            
            // Only apply parallax when section is in view
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                // Apply parallax effect to the background
                const background = section.querySelector('::before');
                if (background) {
                    background.style.transform = `translateY(${rate}px)`;
                }
                
                // Apply subtle parallax to content
                const content = section.querySelector('.parallax-content');
                if (content) {
                    content.style.transform = `translateY(${rate * 0.2}px)`;
                }
            }
        });
    };
    
    // Add scroll event listener with requestAnimationFrame for smooth performance
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleParallax();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // Initial call to set initial positions
    handleParallax();
    
    // Handle resize events
    window.addEventListener('resize', () => {
        handleParallax();
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        // Wait for orientation change to complete
        setTimeout(() => {
            handleParallax();
        }, 100);
    });
}); 