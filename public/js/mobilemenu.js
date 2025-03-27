// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get mobile menu toggle element
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    
    // Create backdrop overlay for better UX
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
    
    // Function to toggle sidebar state
    function toggleSidebar(show) {
        if (show) {
            sidebar.classList.add('show');
            backdrop.classList.add('active');
            mobileMenuToggle.innerHTML = '<i class="bi bi-x-lg"></i>';
            document.body.style.overflow = 'hidden'; // Prevent scrolling when sidebar is open
        } else {
            sidebar.classList.remove('show');
            backdrop.classList.remove('active');
            mobileMenuToggle.innerHTML = '<i class="bi bi-list"></i>';
            document.body.style.overflow = ''; // Restore scrolling
        }
    }
    
    // Add event listener to toggle sidebar
    if (mobileMenuToggle && sidebar) {
        // Use both click and touchstart for better responsiveness
        ['click', 'touchstart'].forEach(eventType => {
            mobileMenuToggle.addEventListener(eventType, function(e) {
                // Prevent default behavior for touchstart
                if (e.type === 'touchstart') {
                    e.preventDefault();
                }
                
                const isShowing = !sidebar.classList.contains('show');
                toggleSidebar(isShowing);
                
                // Stop propagation to prevent document click from immediately closing it
                e.stopPropagation();
            }, { passive: false });
        });
        
        // Close sidebar when clicking on links (for mobile)
        const sidebarLinks = sidebar.querySelectorAll('a');
        sidebarLinks.forEach(link => {
            ['click', 'touchstart'].forEach(eventType => {
                link.addEventListener(eventType, function(e) {
                    if (window.innerWidth <= 600) {
                        if (e.type === 'touchstart') {
                            e.preventDefault();
                            // Trigger the link after closing sidebar
                            setTimeout(() => {
                                window.location.href = this.getAttribute('href');
                            }, 50);
                        }
                        toggleSidebar(false);
                    }
                }, { passive: false });
            });
        });
        
        // Close sidebar when clicking on backdrop
        backdrop.addEventListener('click', function() {
            toggleSidebar(false);
        });
        
        backdrop.addEventListener('touchstart', function(e) {
            e.preventDefault();
            toggleSidebar(false);
        }, { passive: false });
    }
    
    // Close sidebar when clicking outside (for mobile)
    ['click', 'touchstart'].forEach(eventType => {
        document.addEventListener(eventType, function(e) {
            if (window.innerWidth <= 600 && 
                sidebar && 
                sidebar.classList.contains('show') && 
                !sidebar.contains(e.target) && 
                !mobileMenuToggle.contains(e.target)) {
                toggleSidebar(false);
            }
        }, { passive: true });
    });
    
    // Support for closing with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('show')) {
            toggleSidebar(false);
        }
    });
}); 