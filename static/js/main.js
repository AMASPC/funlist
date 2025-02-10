
// Email signup popup functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user has seen the popup before
    if (!localStorage.getItem('popupShown')) {
        // Show popup after 7 seconds (best practice to not be too intrusive)
        setTimeout(function() {
            const emailSignupModal = new bootstrap.Modal(document.getElementById('emailSignupModal'));
            emailSignupModal.show();
            localStorage.setItem('popupShown', 'true');
        }, 7000);
    }

    // Handle form submission
    const emailSignupForm = document.getElementById('emailSignupForm');
    if (emailSignupForm) {
        emailSignupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value;
            
            // Here you would typically send this to your backend
            fetch('/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Thank you for subscribing!');
                    bootstrap.Modal.getInstance(document.getElementById('emailSignupModal')).hide();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('There was an error. Please try again.');
            });
        });
    }
});
