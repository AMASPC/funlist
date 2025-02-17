// Core functionality for location handling
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                localStorage.setItem('userLocation', JSON.stringify(location));
                updateFeaturedEvents(location);
            },
            (error) => {
                console.error('Geolocation error:', error);
                const defaultLocation = { lat: 47.0379, lng: -122.9007 };
                localStorage.setItem('userLocation', JSON.stringify(defaultLocation));
                updateFeaturedEvents(defaultLocation);
            }
        );
    }
}

// Update featured events based on location
function updateFeaturedEvents(location) {
    fetch(`/api/featured-events?lat=${location.lat}&lng=${location.lng}`)
        .then(response => response.json())
        .then(events => {
            const featuredSection = document.querySelector('#featured-events');
            if (featuredSection && events.length > 0) {
                const eventsHtml = events.map(event => `
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <h5 class="card-title">${event.title}</h5>
                                <p class="card-text">${event.description}</p>
                                <p class="text-muted">Date: ${event.date}</p>
                                <div class="fun-rating">Fun Rating: ${'⭐'.repeat(event.fun_meter)}</div>
                            </div>
                        </div>
                    </div>
                `).join('');
                featuredSection.innerHTML = eventsHtml;
            }
        })
        .catch(error => console.error('Error fetching featured events:', error));
}


// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Featured Events
    getFeaturedEvents();

    // Email signup form handling
    const emailSignupForm = document.getElementById('emailSignupForm');
    if (emailSignupForm) {
        emailSignupForm.addEventListener('submit', handleEmailSignup);
    }

    // Location handling
    const locationModal = document.getElementById('locationModal');
    if (locationModal) {
        const allowLocationBtn = document.getElementById('allowLocation');
        const denyLocationBtn = document.getElementById('denyLocation');

        if (allowLocationBtn) {
            allowLocationBtn.addEventListener('click', handleLocationPermission);
        }
        if (denyLocationBtn) {
            denyLocationBtn.addEventListener('click', () => {
                locationModal.style.display = 'none';
            });
        }
    }

    // Date range handling
    const dateRangeSelect = document.getElementById('date_range');
    if (dateRangeSelect) {
        dateRangeSelect.addEventListener('change', handleDateRangeChange);
    }
});

// Featured Events
function getFeaturedEvents() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                fetchFeaturedEvents(lat, lng);
            },
            error => {
                console.log("Error getting location:", error);
                // Default coordinates as fallback
                fetchFeaturedEvents(47.0379, -122.9007);
            }
        );
    }
}

function fetchFeaturedEvents(lat, lng) {
    fetch(`https://${window.location.hostname}/api/featured-events?lat=${lat}&lng=${lng}`)
        .then(response => response.json())
        .then(events => {
            const container = document.getElementById('featured-events');
            if (container) {
                displayFeaturedEvents(container, events);
            }
        })
        .catch(error => {
            console.error("Error fetching featured events:", error);
        });
}

function displayFeaturedEvents(container, events) {
    if (!events.length) {
        container.innerHTML = '<p class="text-center">No featured events found in your area.</p>';
        return;
    }

    const eventsHTML = events.map(event => `
        <div class="col-md-4 mb-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${event.title}</h5>
                    <p class="card-text">${event.description}</p>
                    <p class="text-muted">${event.date}</p>
                    <div class="fun-rating">
                        ${'★'.repeat(event.fun_meter)}${'☆'.repeat(5-event.fun_meter)}
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = eventsHTML;
}

// Email Signup
function handleEmailSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;

    fetch('/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Thank you for subscribing!');
            const modal = bootstrap.Modal.getInstance(document.getElementById('emailSignupModal'));
            if (modal) modal.hide();
        } else {
            alert(data.message || 'Subscription failed. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred. Please try again later.');
    });
}

// Location Handling
function handleLocationPermission() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('locationModal'));
                if (modal) modal.hide();
                // Update featured events with user's location
                getFeaturedEvents();
            },
            error => {
                console.error("Error getting location:", error);
                alert('Unable to get your location. Please try again.');
            }
        );
    }
}

// Date Range Handling
function handleDateRangeChange(e) {
    const specificDateInput = document.getElementById('specific_date');
    if (specificDateInput) {
        specificDateInput.style.display = e.target.value === 'specific' ? 'block' : 'none';
    }
}

// Initialize floating CTA
function initFloatingCTA() {
    const floatingCTA = document.querySelector('.floating-cta');
    if (floatingCTA) {
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop) {
                floatingCTA.classList.add('hide');
            } else {
                floatingCTA.classList.remove('hide');
            }
            lastScrollTop = scrollTop;
        });
    }
}

// Handle form field visibility
function initEventForm() {
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('eventForm');
        if (!form) return;

        const allDayCheckbox = form.querySelector('#all_day');
        const timeFields = form.querySelector('.time-fields');
        const recurringCheckbox = form.querySelector('#recurring');
        const recurrenceFields = form.querySelector('.recurrence-fields');

        if (allDayCheckbox && timeFields) {
            allDayCheckbox.addEventListener('change', function() {
                timeFields.style.display = this.checked ? 'none' : 'block';
            });
            // Initialize state
            timeFields.style.display = allDayCheckbox.checked ? 'none' : 'block';
        }

        if (recurringCheckbox && recurrenceFields) {
            recurringCheckbox.addEventListener('change', function() {
                recurrenceFields.style.display = this.checked ? 'block' : 'none';
            });
            // Initialize state
            recurrenceFields.style.display = recurringCheckbox.checked ? 'block' : 'none';
        }
    });
}

// Form character count
function initCharCount() {
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');

    if (titleInput) {
        titleInput.addEventListener('input', function() {
            const titleCount = document.getElementById('titleCount');
            if (titleCount) titleCount.textContent = this.value.length;
        });
    }

    if (descriptionInput) {
        descriptionInput.addEventListener('input', function() {
            const descriptionCount = document.getElementById('descriptionCount');
            if (descriptionCount) descriptionCount.textContent = this.value.length;
        });
    }
}

// Event list filtering
function filterEventsList() {
    const category = document.getElementById('categoryFilter')?.value || '';
    const dateRange = document.getElementById('dateRange')?.value || '';
    const location = document.getElementById('locationFilter')?.value.toLowerCase();

    document.querySelectorAll('.event-card').forEach(card => {
        const cardCategory = card.dataset.category?.toLowerCase();
        const cardDate = card.dataset.date;
        const cardLocation = card.dataset.location?.toLowerCase();

        let showCard = true;

        if (category && cardCategory !== category.toLowerCase()) showCard = false;
        if (dateRange) {
            const eventDate = new Date(cardDate);
            const today = new Date();

            switch(dateRange) {
                case 'specific':
                    const specificDate = document.getElementById('specificDate')?.value; 
                    if (specificDate) {
                        const selectedDate = new Date(specificDate);
                        if (eventDate.toDateString() !== selectedDate.toDateString()) showCard = false;
                    }
                    break;
                case 'today':
                    if (eventDate.toDateString() !== today.toDateString()) showCard = false;
                    break;
                case 'weekend':
                    // Add weekend logic
                    break;
                // Add other date range cases
            }
        }
        if (location && !cardLocation?.includes(location)) showCard = false;

        card.style.display = showCard ? 'block' : 'none';
    });
}

// Handle date range changes
function handleDateRangeChange(select) {
    const specificDateInput = document.getElementById('specificDate');
    if (specificDateInput) {
        specificDateInput.style.display = select.value === 'specific' ? 'block' : 'none';
        if (select.value === 'specific') {
            specificDateInput.focus();
        } else if (select.form) {
            select.form.submit();
        }
    }
}


// Initialize everything when DOM is loaded
// Create a single event handler to avoid duplicates
let eventListeners = new Map();

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.floating-cta')) {
        initFloatingCTA();
    }
    
    if (document.querySelector('form#eventForm')) {
        initEventForm();
        const form = document.querySelector('form#eventForm');
        form.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(form);
    fetch(form.action, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.redirected) {
            window.location.href = response.url;
        } else {
            return response.text();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error submitting form. Please try again.');
    });
});
    }
    
    if (document.getElementById('title') || document.getElementById('description')) {
        initCharCount();
    }

    // Clean up any existing listeners
    cleanupEventListeners();

    // Set up event listeners for filters with cleanup
    const filters = ['categoryFilter', 'dateRange', 'locationFilter', 'specificDate', 'specificDate-mobile'];
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            const handler = () => filterEventsList();
            element.addEventListener('change', handler);
            eventListeners.set(`${filterId}_change`, { element, type: 'change', handler });

            if (element.tagName === 'INPUT') {
                const inputHandler = () => filterEventsList();
                element.addEventListener('input', inputHandler);
                eventListeners.set(`${filterId}_input`, { element, type: 'input', handler: inputHandler });
            }
        }
    });

    // Location handling (moved to the top-level DOMContentLoaded)

});

function cleanupEventListeners() {
    // Remove all tracked event listeners
    eventListeners.forEach(({ element, type, handler }) => {
        if (element && element.removeEventListener) {
            element.removeEventListener(type, handler);
        }
    });
    eventListeners.clear();
}


// Clean up listeners when page unloads
window.addEventListener('unload', cleanupEventListeners);