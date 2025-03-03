// Main JavaScript for FunList.ai

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    setupErrorHandling();
    setupEventHandlers();
    setupTippy();
    setupModals();
    setupFloatingButtons();
    setupCookieConsent();

    // Initialize any carousels or sliders
    initializeCarousels();
});

// Global error handling
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

// Setup event handlers for various elements
function setupEventHandlers() {
    // Setup any global event handlers here
    document.addEventListener('click', function(e) {
        // Optional: Global click handler for analytics or other purposes
    });
}

// Setup tooltips using Tippy.js if available
function setupTippy() {
    if (typeof tippy !== 'undefined') {
        tippy('[data-tippy-content]');
    }
}

// Setup modals and their forms
function setupModals() {
    // Setup feedback form
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        console.log("Found feedback form, setting up submit handler");
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
                    const modal = bootstrap.Modal.getInstance(document.getElementById('feedbackModal'));
                    if (modal) modal.hide();
                    else console.log("Couldn't find modal instance");
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

    // Setup subscription forms (both the floating one and any others on the page)
    const subscribeForms = document.querySelectorAll('#floatingSubscribeForm, #emailSignupForm');
    subscribeForms.forEach(form => {
        if (form) {
            console.log(`Found subscribe form: ${form.id}, setting up submit handler`);
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log(`Subscribe form submitted: ${form.id}`);

                // Find the email input within this specific form
                const email = form.querySelector('input[type="email"]').value;

                // Get checkbox values if they exist in this form
                const preferenceEvents = form.querySelector('#preferenceEvents')?.checked || false;
                const preferenceDeals = form.querySelector('#preferenceDeals')?.checked || false;

                // Submit subscription
                fetch('/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
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
                        // Determine which modal to close based on form ID
                        let modalId = 'subscribeModal';
                        if (form.id === 'emailSignupForm') {
                            modalId = 'emailSignupModal';
                        }

                        try {
                            const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
                            if (modal) modal.hide();
                            else console.log(`Couldn't find ${modalId} instance`);
                        } catch (error) {
                            console.error(`Error hiding ${modalId}:`, error);
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
        }
    });
}

// Setup floating buttons interaction
function setupFloatingButtons() {
    // Setup feedback button
    const feedbackBtn = document.getElementById('feedbackButton');
    if (feedbackBtn) {
        console.log("Found feedback button, setting up click handler");
        feedbackBtn.addEventListener('click', function(e) {
            console.log("Feedback button clicked");
            try {
                const feedbackModal = new bootstrap.Modal(document.getElementById('feedbackModal'));
                feedbackModal.show();
            } catch (error) {
                console.error("Error showing feedback modal:", error);
                alert("Sorry, there was an error opening the feedback form.");
            }
        });
    } else {
        console.log("Feedback button not found in DOM");
    }

    // Setup subscribe button
    const subscribeBtn = document.getElementById('subscribeButton');
    if (subscribeBtn) {
        console.log("Found subscribe button, setting up click handler");
        subscribeBtn.addEventListener('click', function(e) {
            console.log("Subscribe button clicked");
            try {
                const subscribeModal = new bootstrap.Modal(document.getElementById('subscribeModal'));
                subscribeModal.show();
            } catch (error) {
                console.error("Error showing subscribe modal:", error);
                alert("Sorry, there was an error opening the subscription form.");
            }
        });
    } else {
        console.log("Subscribe button not found in DOM");
    }
}

// Cookie consent handling
function setupCookieConsent() {
    // Check if cookie is already set
    const cookieConsent = getCookie('cookie_consent');

    if (!cookieConsent) {
        const cookieBanner = document.getElementById('cookieConsent');
        if (cookieBanner) {
            cookieBanner.classList.add('show');
            document.body.classList.add('cookie-consent-visible');

            // Setup cookie consent buttons
            const acceptAllBtn = document.getElementById('acceptAllCookies');
            const rejectNonEssentialBtn = document.getElementById('rejectNonEssentialCookies');
            const customizeBtn = document.getElementById('customizeCookies');

            if (acceptAllBtn) {
                acceptAllBtn.addEventListener('click', function() {
                    setCookie('cookie_consent', 'all', 365);
                    hideCookieConsent();
                });
            }

            if (rejectNonEssentialBtn) {
                rejectNonEssentialBtn.addEventListener('click', function() {
                    setCookie('cookie_consent', 'essential', 365);
                    hideCookieConsent();
                });
            }

            if (customizeBtn) {
                customizeBtn.addEventListener('click', function() {
                    // Show cookie preferences modal
                    const cookiePreferencesModal = new bootstrap.Modal(document.getElementById('cookiePreferencesModal'));
                    if (cookiePreferencesModal) cookiePreferencesModal.show();
                });
            }
        }
    }
}

// Hide cookie consent banner
function hideCookieConsent() {
    const cookieBanner = document.getElementById('cookieConsent');
    if (cookieBanner) {
        cookieBanner.classList.remove('show');
        document.body.classList.remove('cookie-consent-visible');
    }
}

// Set a cookie
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
}

// Get a cookie value
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Initialize carousels if they exist
function initializeCarousels() {
    // Sponsors carousel
    const sponsorsCarousel = document.querySelector('.sponsors-carousel');
    if (sponsorsCarousel) {
        console.log("Populating sponsors carousel");
        // Initialize carousel logic here if needed
    }
}

// Admin-specific functionality
if (document.getElementById('adminEventTable')) {
    console.log("Admin events script loaded");
    setupAdminEventHandlers();
}

// Setup admin event handlers
function setupAdminEventHandlers() {
    // Admin event approval/rejection buttons
    const adminActionButtons = document.querySelectorAll('.admin-event-action');
    adminActionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const eventId = this.dataset.eventId;
            const action = this.dataset.action;

            if (confirm(`Are you sure you want to ${action} this event?`)) {
                fetch(`/admin/event/${eventId}/${action}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert(data.message);
                        // Refresh page to show updated status
                        window.location.reload();
                    } else {
                        alert('Error: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred. Please try again.');
                });
            }
        });
    });
}

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

function populateSponsorsCarousel() {
    //Implementation for populating sponsors carousel.  This function was not defined in the original code.
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

//Added this function because it was missing from the original code
function getCsrfToken() {
    const tokenMeta = document.querySelector('meta[name="csrf-token"]');
    return tokenMeta ? tokenMeta.content : '';
}

function showNewUserWizard() {
    // Implementation for new user wizard/onboarding
    const wizardModal = new bootstrap.Modal(document.getElementById('onboardingWizardModal'));
    if (wizardModal) {
        wizardModal.show();
    }
}

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