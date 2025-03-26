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

    // Add form validation for signup
    const signupForm = document.querySelector('form[action="/signup"]');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            // Validate username length
            if (username.length > 15) {
                notifications.error(
                    'Invalid Username',
                    'Username must be 15 characters or less'
                );
                return;
            }
            
            // Validate password length
            if (password.length < 8) {
                notifications.error(
                    'Invalid Password',
                    'Password must be at least 8 characters long'
                );
                return;
            }
            
            // Check if username is already taken
            try {
                const response = await fetch('/check-username', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username })
                });
                
                const data = await response.json();
                
                if (data.exists) {
                    notifications.error(
                        'Username Taken',
                        'This username is already taken. Please choose another one.'
                    );
                    return;
                }
                
                // If validation passes, submit the form
                this.submit();
            } catch (error) {
                console.error('Error checking username:', error);
                notifications.error(
                    'Error',
                    'An error occurred. Please try again.'
                );
            }
        });
    }
}); 