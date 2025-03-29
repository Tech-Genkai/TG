document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/login';
        return;
    }

    if (sessionStorage.getItem('justLoggedIn') === 'true') {
        // Show welcome notification
        notifications.success("Welcome Back!", "Welcome back to your account.");
        // Clear the flag
        sessionStorage.removeItem('justLoggedIn');
    }

    // Initialize emoji picker
    if (typeof initializeEmojiPicker === 'function') {
        const emojiBtn = document.getElementById('emoji-button');
        if (emojiBtn) {
            emojiBtn.addEventListener('click', function() {
                const emojiPicker = document.getElementById('emoji-picker');
                if (emojiPicker) {
                    // Toggle emoji picker
                    if (emojiPicker.style.display === 'block') {
                        emojiPicker.style.display = 'none';
                    } else {
                        // Initialize and position the emoji picker
                        const messageInput = document.getElementById('message-input');
                        const inputRect = messageInput.getBoundingClientRect();
                        emojiPicker.style.bottom = (window.innerHeight - inputRect.top + 10) + 'px';
                        emojiPicker.style.left = (inputRect.left + inputRect.width / 2 - 200) + 'px';
                        emojiPicker.style.display = 'block';
                    }
                }
            });
        }
    }
}); 