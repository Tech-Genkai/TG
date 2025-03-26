document.addEventListener('DOMContentLoaded', () => {
    const profilePicture = document.getElementById('profile-picture');
    const profilePreview = document.getElementById('profile-preview');
    const uploadBtn = document.querySelector('.upload-btn');
    const registerForm = document.getElementById('register-form');
    const dateInput = document.getElementById('date-of-birth');
    const calendarIcon = document.querySelector('.calendar-icon');

    // Handle profile picture upload
    uploadBtn.addEventListener('click', () => {
        profilePicture.click();
    });

    profilePicture.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle calendar icon click
    calendarIcon.addEventListener('click', () => {
        dateInput.showPicker();
    });

    // Handle form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const displayName = document.getElementById('display-name').value;
        const gender = document.getElementById('gender').value;
        const dateOfBirth = document.getElementById('date-of-birth').value;
        const profilePic = profilePicture.files[0];
        const username = localStorage.getItem('username'); // Get the logged-in username

        // Create form data
        const formData = new FormData();
        formData.append('displayName', displayName);
        formData.append('gender', gender);
        formData.append('dateOfBirth', dateOfBirth);
        formData.append('username', username);
        if (profilePic) {
            formData.append('profilePic', profilePic);
        }

        try {
            const response = await fetch('/register', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            // Get the response text and execute the redirect script
            const result = await response.text();
            const scriptContent = result.match(/<script>([\s\S]*?)<\/script>/)[1];
            eval(scriptContent);
        } catch (error) {
            console.error('Error:', error);
            alert('Registration failed. Please try again.');
        }
    });
});
