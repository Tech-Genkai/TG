// Viewport height fix for mobile browsers
(function() {
    // First we get the viewport height and we multiply it by 1% to get a value for a vh unit
    function setVhVariable() {
        let vh = window.innerHeight * 0.01;
        // Then we set the value in the --vh custom property to the root of the document
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Also set explicit heights on key elements
        updateElementHeights();
    }
    
    // Apply the calculated vh to specific elements
    function updateElementHeights() {
        // Get navbar height (might be different on different devices)
        const navbar = document.querySelector('.navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 50;
        
        // Fix heights for main containers
        const sidebar = document.querySelector('.sidebar');
        const feed = document.querySelector('.feed');
        const wrapper = document.querySelector('.wrapper');
        const chatContainer = document.getElementById('chat-container');
        
        if (sidebar) {
            sidebar.style.height = `calc(var(--vh, 1vh) * 100 - ${navbarHeight + 5}px)`;
            sidebar.style.top = `${navbarHeight}px`;
        }
        
        if (feed) {
            feed.style.height = `calc(var(--vh, 1vh) * 100 - ${navbarHeight}px)`;
            feed.style.top = `${navbarHeight}px`;
        }
        
        if (wrapper) {
            wrapper.style.height = `calc(var(--vh, 1vh) * 100 - ${navbarHeight}px)`;
            wrapper.style.top = `${navbarHeight}px`;
        }
        
        if (chatContainer) {
            // Make sure chat container takes full height of its parent
            chatContainer.style.height = '100%';
        }
        
        // Fix profile pictures
        fixProfilePictures();
    }
    
    // Fix profile pictures
    function fixProfilePictures() {
        // Get profile pictures
        const navProfilePic = document.getElementById('navProfilePic');
        const sidebarProfilePic = document.getElementById('sidebarProfilePic');
        const profilePic = document.getElementById('profilePic');
        
        // Load the user's profile pic from localStorage
        const profilePicUrl = localStorage.getItem('profilePic') || '/images/default-profile.png';
        
        // Set profile pics
        if (navProfilePic) navProfilePic.src = profilePicUrl;
        if (sidebarProfilePic) sidebarProfilePic.src = profilePicUrl;
        if (profilePic) profilePic.src = profilePicUrl;
    }
    
    // Set the height initially
    setVhVariable();
    
    // Reset on resize and orientation change
    window.addEventListener('resize', setVhVariable);
    window.addEventListener('orientationchange', setVhVariable);
    
    // Also update on page load
    window.addEventListener('load', function() {
        setVhVariable();
        // Fix profile pictures again after page has fully loaded
        fixProfilePictures();
    });
    
    // Update when mobile browser toolbar appears/disappears
    let lastScrollPosition = 0;
    window.addEventListener('scroll', function() {
        const currentScrollPosition = window.pageYOffset;
        
        // Only recalculate if scroll is significant (toolbar showing/hiding)
        if (Math.abs(currentScrollPosition - lastScrollPosition) > 50) {
            lastScrollPosition = currentScrollPosition;
            // Use a debounce to avoid excessive calculations
            clearTimeout(window.resizedFinished);
            window.resizedFinished = setTimeout(setVhVariable, 100);
        }
    });
})(); 