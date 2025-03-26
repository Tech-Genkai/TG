// Password toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const togglePass = document.querySelector('.toggle-pass');
    const passwordInput = document.getElementById('password');
    
    if (togglePass && passwordInput) {
        // Only the eye icon should toggle the password visibility
        togglePass.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            
            // Change password input type
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle the icon
            this.classList.toggle('bi-eye');
            this.classList.toggle('bi-eye-slash');
        });
    }
    
    // Make labels work properly with empty placeholders
    const inputs = document.querySelectorAll('.inp');
    inputs.forEach(input => {
        // Set initial label position based on value
        const label = input.nextElementSibling;
        if (input.value) {
            label.classList.add('active');
        }
        
        // Handle focus events
        input.addEventListener('focus', function() {
            const label = this.nextElementSibling;
            label.classList.add('active');
        });
        
        // Handle blur events
        input.addEventListener('blur', function() {
            const label = this.nextElementSibling;
            if (!this.value) {
                label.classList.remove('active');
            }
        });
    });
}); 