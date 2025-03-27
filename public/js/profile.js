document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/login';
        return;
    }

    // Handle profile picture change
    document.querySelector('.edit-profile-pic').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                profileManager.updateProfilePicture(file)
                    .then(success => {
                        if (success) {
                            notifications.success("Success", "Profile picture updated successfully!");
                        } else {
                            notifications.error("Error", "Failed to update profile picture. Please try again.");
                        }
                    });
            }
        };
        input.click();
    });

    // Handle edit profile button
    document.querySelector('.edit-profile-btn').addEventListener('click', function() {
        const displayName = prompt('Enter your display name:', document.getElementById('displayName').textContent);
        if (displayName) {
            const gender = prompt('Enter your gender (Male/Female/Other):', document.getElementById('gender').textContent);
            
            // Get current date value and try to convert to YYYY-MM-DD format for the prompt
            let currentDateStr = document.getElementById('dob').textContent;
            if (currentDateStr !== 'Not specified') {
                try {
                    const date = new Date(currentDateStr);
                    if (!isNaN(date.getTime())) {
                        currentDateStr = date.toISOString().split('T')[0];
                    }
                } catch (e) {
                    console.error('Error parsing date:', e);
                }
            }
            
            const dob = prompt('Enter your date of birth (YYYY-MM-DD):', currentDateStr);
            
            if (gender && dob) {
                // Capitalize first letter of gender
                const formattedGender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
                
                profileManager.updateProfileDetails(displayName, formattedGender, dob)
                    .then(success => {
                        if (success) {
                            notifications.success("Success", "Profile updated successfully!");
                        } else {
                            notifications.error("Error", "Failed to update profile. Please try again.");
                        }
                    });
            }
        }
    });
}); 