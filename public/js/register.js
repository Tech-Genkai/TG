document.addEventListener('DOMContentLoaded', () => {
    const profilePicture = document.getElementById('profile-picture');
    const profilePreview = document.getElementById('profile-preview');
    const uploadBtn = document.querySelector('.upload-btn');
    const registerForm = document.getElementById('register-form');

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

    // Handle form submission
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const displayName = document.getElementById('display-name').value;
        const dateOfBirth = document.getElementById('date-of-birth').value;
        const profilePic = profilePicture.files[0];

        // Here you would typically send this data to your server
        console.log({
            displayName,
            dateOfBirth,
            profilePic
        });

        // You can add your API call here to send the data to your backend
    });
});
