function setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', function(event) {
        console.log('JavaScript error caught:', event.error);
        console.log(event);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', function(event) {
        console.log('Unhandled Promise Rejection:', event.reason);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    setupErrorHandling();
    setupEventHandlers();
    setupTippy();
    setupModals();
    setupFloatingButtons();

    // Log when buttons are found in DOM
    const feedbackBtn = document.getElementById('feedbackButton');
    const subscribeBtn = document.getElementById('subscribeButton');
    console.log("Feedback button in DOM:", !!feedbackBtn);
    console.log("Subscribe button in DOM:", !!subscribeBtn);
});


function setupErrorHandling() {
    window.addEventListener('error', function(event) {
        console.log('JavaScript error caught:', event.error);
    });
}

function setupFloatingButtons() {
    console.log("Setting up floating buttons");
    
    // Setup feedback button
    const feedbackBtn = document.getElementById('feedbackButton');
    if (feedbackBtn) {
        console.log("Feedback button found");
        feedbackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            try {
                const feedbackModal = new bootstrap.Modal(document.getElementById('feedbackModal'));
                feedbackModal.show();
            } catch (error) {
                console.error("Error showing feedback modal:", error);
            }
        });
    } else {
        console.log("Feedback button not found");
    }

    // Setup subscribe button
    const subscribeBtn = document.getElementById('subscribeButton');
    if (subscribeBtn) {
        console.log("Subscribe button found");
        subscribeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            try {
                const subscribeModal = new bootstrap.Modal(document.getElementById('subscribeModal'));
                subscribeModal.show();
            } catch (error) {
                console.error("Error showing subscribe modal:", error);
            }
        });
    } else {
        console.log("Subscribe button not found");
    }
}

// Initialize sponsors carousel
function initializeSponsorsCarousel() {
    // Check if the element exists first
    const sponsorsContainer = document.querySelector('.sponsors-container');
    if (!sponsorsContainer) return;

    console.log('Populating sponsors carousel');

    // Add carousel functionality
    const sponsorCards = document.querySelectorAll('.sponsor-card');
    if (sponsorCards.length <= 1) return;

    // Simple auto-scrolling for sponsors if multiple sponsors exist
    let currentIndex = 0;
    setInterval(() => {
        currentIndex = (currentIndex + 1) % sponsorCards.length;
        sponsorsContainer.scrollTo({
            left: sponsorCards[currentIndex].offsetLeft,
            behavior: 'smooth'
        });
    }, 5000);
}

// Form validation setup
function setupFormValidation() {
    // Validate forms with class 'needs-validation'
    const forms = document.querySelectorAll('.needs-validation');

    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
}

// Location services setup
function setupLocationServices() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;

    // If browser supports geolocation, get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                // Store coordinates in data attributes for the map to use
                mapContainer.dataset.userLat = userLat;
                mapContainer.dataset.userLng = userLng;

                // Trigger custom event for map to initialize with these coordinates
                const event = new CustomEvent('user-location-ready', {
                    detail: { lat: userLat, lng: userLng }
                });
                mapContainer.dispatchEvent(event);

                // Fetch featured events based on location
                if (window.fetchFeaturedEvents) {
                    fetchFeaturedEvents(userLat, userLng);
                }
            },
            error => {
                console.warn('Error getting user location:', error.message);
                // Fallback to default location or prompt user
            }
        );
    }
}

// Setup filters
function setupFilters() {
    // Handle specific date selection visibility
    const dateRangeSelects = document.querySelectorAll('select[name="date_range"]');
    dateRangeSelects.forEach(select => {
        select.addEventListener('change', handleDateRangeChange);
    });
}

function handleDateRangeChange(event) {
    const value = event.target ? event.target.value : event.value;
    const isMobile = event.target ? event.target.id.includes('mobile') : event.id.includes('mobile');
    const specificDateId = isMobile ? 'specificDate-mobile' : 'specificDate';
    const specificDateField = document.getElementById(specificDateId);

    if (specificDateField) {
        specificDateField.style.display = value === 'specific' ? 'block' : 'none';
    }
}

// Setup modals
function setupModals() {
    console.log("Setting up modals");
    
    // Setup feedback form
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        console.log("Feedback form found");
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Feedback form submitted");
            
            const feedbackType = document.getElementById('feedbackType').value;
            const message = document.getElementById('feedbackMessage').value;
            const email = document.getElementById('feedbackEmail').value;

            // Submit feedback
            fetch('/submit-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    type: feedbackType,
                    message: message,
                    email: email
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Thank you for your feedback!');
                    // Close modal
                    try {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('feedbackModal'));
                        if (modal) modal.hide();
                    } catch (error) {
                        console.error("Error hiding feedback modal:", error);
                    }
                } else {
                    alert('Error: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error submitting feedback:', error);
                alert('An error occurred. Please try again.');
            });
        });
    } else {
        console.log("Feedback form not found");
    }
    
    // Setup subscription forms
    const floatingSubscribeForm = document.getElementById('floatingSubscribeForm');
    if (floatingSubscribeForm) {
        console.log("Floating subscribe form found");
        floatingSubscribeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Floating subscribe form submitted");
            
            const email = document.getElementById('subscribeEmail').value;
            const preferenceEvents = document.getElementById('preferenceEvents')?.checked || false;
            const preferenceDeals = document.getElementById('preferenceDeals')?.checked || false;

            // Submit subscription
            fetch('/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    preferences: {
                        events: preferenceEvents,
                        deals: preferenceDeals
                    }
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Thank you for subscribing!');
                    // Close modal
                    try {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('subscribeModal'));
                        if (modal) modal.hide();
                    } catch (error) {
                        console.error("Error hiding subscribe modal:", error);
                    }
                } else {
                    alert('Error: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error subscribing:', error);
                alert('An error occurred. Please try again.');
            });
        });
    } else {
        console.log("Floating subscribe form not found");
    }
    
    // Setup other subscription forms (like in footer, etc.)
    const emailSignupForm = document.getElementById('emailSignupForm');
    if (emailSignupForm) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const email = form.querySelector('input[type="email"]').value;

                // Collect preferences if they exist
                let preferences = {};
                const preferenceCheckboxes = form.querySelectorAll('input[type="checkbox"]:checked');
                preferenceCheckboxes.forEach(checkbox => {
                    preferences[checkbox.id] = true;
                });

                // Submit subscription
                fetch('/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: email,
                        preferences: preferences
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Thank you for subscribing!');
                        // Close modal if it exists
                        const modal = bootstrap.Modal.getInstance(document.querySelector('.modal.show'));
                        if (modal) modal.hide();
                    } else {
                        alert('Error: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred. Please try again.');
                });
            });
        }
    });
}

// Setup subscription form
function setupSubscriptionForm() {
    const subscribeForm = document.getElementById('floatingSubscribeForm');
    if (!subscribeForm) return;

    subscribeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('subscribeEmail').value;

        // Collect preferences
        const preferences = {
            events: document.getElementById('preferenceEvents')?.checked || false,
            deals: document.getElementById('preferenceDeals')?.checked || false
        };

        // Submit subscription
        fetch('/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                preferences: preferences
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Thank you for subscribing!');
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.querySelector('#subscribeModal'));
                if (modal) modal.hide();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    });
}

// Setup feedback form
function setupFeedbackForm() {
    const feedbackForm = document.getElementById('feedbackForm');
    if (!feedbackForm) return;

    feedbackForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const feedbackType = document.getElementById('feedbackType').value;
        const message = document.getElementById('feedbackMessage').value;
        const email = document.getElementById('feedbackEmail').value;

        fetch('/submit-feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: feedbackType,
                message: message,
                email: email
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Thank you for your feedback!');
                feedbackForm.reset();

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.querySelector('#feedbackModal'));
                if (modal) modal.hide();
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    });
}

// Show new user wizard
function showNewUserWizard() {
    // Implementation for new user wizard/onboarding
    const wizardModal = new bootstrap.Modal(document.getElementById('onboardingWizardModal'));
    if (wizardModal) {
        wizardModal.show();
    }
}

// Save user preferences from wizard
function saveUserPreferences(data) {
    fetch('/save-preferences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken() // Function to get CSRF token
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // Close wizard and show success message
            const wizardModal = bootstrap.Modal.getInstance(document.getElementById('onboardingWizardModal'));
            if (wizardModal) wizardModal.hide();

            alert('Your preferences have been saved!');
            // Optional: reload the page to show personalized content
            // window.location.reload();
        } else {
            alert('Error: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Error saving preferences:', error);
        alert('An error occurred while saving your preferences. Please try again.');
    });
}

// Helper function to get CSRF token
function getCsrfToken() {
    const tokenMeta = document.querySelector('meta[name="csrf-token"]');
    return tokenMeta ? tokenMeta.content : '';
}

function populateSponsorsCarousel() {
    //Implementation for populating sponsors carousel.  This function was not defined in the original code.
}

function setupCookieConsent() {
    // This function is now handled directly in the cookie_consent.html partial
    console.log("Cookie consent setup handled in template");
}

function saveCookiePreferences(preferences) {
    try {
        // Save to localStorage
        localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
        console.log('Cookie preferences saved:', preferences);

        // Apply cookie settings based on preferences
        if (preferences.analytics) {
            console.log("Analytics tracking enabled");
            // Enable analytics code here
        }

        if (preferences.advertising) {
            console.log("Advertising cookies enabled");
            // Enable advertising code here
        }
    } catch (error) {
        console.error("Error saving cookie preferences:", error);
    }
}


function checkCookieConsentExpiration() {
    try {
        const consentData = localStorage.getItem('cookieConsent');
        if (!consentData) return false;

        const consent = JSON.parse(consentData);
        if (consent && consent.expires) {
            if (new Date().getTime() > consent.expires) {
                // Consent has expired, remove it
                localStorage.removeItem('cookieConsent');
                return false;
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error checking cookie consent expiration:", error);
        return false;
    }
}

// Cookie functions are handled in the cookie_consent.html partial

function setupEventHandlers() {
    // Placeholder for event handler setup (needs to be implemented)
}

function setupTippy() {
    // Placeholder for Tippy setup (needs to be implemented)
}