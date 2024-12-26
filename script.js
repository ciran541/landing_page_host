// Update date automatically
function updateDate() {
    const date = new Date();
    const options = {year: 'numeric', month: 'short', day: 'numeric' };
    document.getElementById('updateDate').textContent = 
        `Latest rate As Of ${date.toLocaleDateString('en-US', options)}`;
}
updateDate();

// Notification system
class NotificationSystem {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
        this.notifications = new Set();
    }
    
    show(message, type = 'success', duration = 5000) {
        // Limit to 3 notifications at a time
        if (this.notifications.size >= 3) {
            const oldestNotification = this.notifications.values().next().value;
            if (oldestNotification) this.hide(oldestNotification);
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const messageText = document.createElement('span');
        messageText.textContent = message;
        notification.appendChild(messageText);
        
        if (type !== 'loading') {
            const closeButton = document.createElement('button');
            closeButton.className = 'notification-close';
            closeButton.setAttribute('aria-label', 'Close');
            closeButton.innerHTML = '×';
            closeButton.onclick = () => this.hide(notification);
            notification.appendChild(closeButton);
        }
        
        this.container.appendChild(notification);
        this.notifications.add(notification);
        
        notification.offsetHeight; // Force reflow
        notification.classList.add('show');
        
        if (duration && type !== 'loading') {
            setTimeout(() => this.hide(notification), duration);
        }
        
        return notification;
    }
    
    hide(notification) {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => {
            notification.remove();
            this.notifications.delete(notification);
        }, 200);
    }
}

// Form validation functions
function showError(field, message) {
    removeError(field);
    field.classList.add('error-field');
    notifications.show(message, 'error');
}

function removeError(field) {
    field.classList.remove('error-field');
}

function validateField(field) {
    // Check radio groups
    if (field.type === 'radio') {
        const radioGroup = field.closest('.tlc-radio-group');
        const checkedRadio = radioGroup.querySelector('input[type="radio"]:checked');
        if (!checkedRadio) {
            const fieldName = radioGroup.previousElementSibling.textContent;
            showError(field, `Please select an option for ${fieldName}`);
            return false;
        }
        return true;
    }

    const value = field.value.trim();
    if (!value) {
        const fieldName = field.previousElementSibling.textContent;
        showError(field, `Please fill out ${fieldName}`);
        return false;
    }
    
    // Field-specific validation
    switch (field.type) {
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                showError(field, 'Please enter a valid email address');
                return false;
            }
            break;
            
        case 'tel':
            const phoneRegex = /^\+?[0-9]{8,}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                showError(field, 'Please enter a valid contact number');
                return false;
            }
            break;
            
        case 'number':
            if (field.name === 'loan_amount') {
                if (parseFloat(value) <= 0) {
                    showError(field, 'Please enter a valid loan amount');
                    return false;
                }
            }
            break;
    }
    
    removeError(field);
    return true;
}

// Page navigation
function nextPage() {
    const formWrapper = document.querySelector('.tlc-form-wrapper');
    const formRect = formWrapper.getBoundingClientRect();
    const scrollTarget = window.pageYOffset + formRect.top - 80;
    
    // Validate current page
    const page1 = document.getElementById('page1');
    const requiredFields = page1.querySelectorAll('input[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    if (isValid) {
        window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
        });

        setTimeout(() => {
            page1.classList.remove('active');
            document.getElementById('page2').classList.add('active');
            document.querySelector('.tlc-form-header-overlap h2').textContent = 'Final Step!';
        }, 300);
    }
}

function previousPage() {
    const formWrapper = document.querySelector('.tlc-form-wrapper');
    const formRect = formWrapper.getBoundingClientRect();
    const scrollTarget = window.pageYOffset + formRect.top - 80;
    
    window.scrollTo({
        top: scrollTarget,
        behavior: 'smooth'
    });

    setTimeout(() => {
        document.getElementById('page2').classList.remove('active');
        document.getElementById('page1').classList.add('active');
        document.querySelector('.tlc-form-header-overlap h2').textContent = 'What are you looking for?';
    }, 300);
}

// Initialize notification system
const notifications = new NotificationSystem();

// Form submission handler
// Form submission handler
document.getElementById('loanForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validate all required fields
    const currentPage = document.querySelector('.tlc-form-page.active');
    const requiredFields = currentPage.querySelectorAll('input[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    if (!isValid) return;

    const loadingNotification = notifications.show('Processing your loan request...', 'loading');
    
    // Get form data
    const formData = new FormData(this);
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Only log in development environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Development mode: Sending form data:', data);
    }
    
    // Send to backend
    fetch('handler.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        // Only log in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Development mode: Server response:', result);
        }
        
        if (result.success) {
            this.reset();
            notifications.hide(loadingNotification);
            notifications.show("Your loan request has been submitted successfully! We'll contact you soon with the best rates.", 'success');
            
            // Reset to first page
            const page2 = document.getElementById('page2');
            const page1 = document.getElementById('page1');
            if (page2.classList.contains('active')) {
                page2.classList.remove('active');
                page1.classList.add('active');
            }
        } else {
            throw new Error(result.error || 'Submission failed');
        }
    })
    .catch(error => {
        // Only log error details in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.error('Development mode: Submission error:', error);
        }
        notifications.hide(loadingNotification);
        notifications.show('There was an error submitting your form. Please try again.', 'error');
    });
});

// Carousel implementation
class AutoScrollCarousel {
    constructor() {
        this.track = document.querySelector('.tlc-partners-track');
        this.slides = [...document.querySelectorAll('.tlc-partners-slide')];
        this.slideWidth = this.slides[0].getBoundingClientRect().width;
        this.currentPosition = 0;
        this.scrollSpeed = 1;
        this.isHovered = false;
        this.initializeCarousel();
    }

    initializeCarousel() {
        this.track.addEventListener('mouseenter', () => this.isHovered = true);
        this.track.addEventListener('mouseleave', () => this.isHovered = false);
        this.animate();
        
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.slideWidth = this.slides[0].getBoundingClientRect().width;
            }, 250);
        });
    }

    animate() {
        const animate = () => {
            if (!this.isHovered) {
                this.currentPosition -= this.scrollSpeed;
                const resetPosition = -(this.slideWidth + 20) * 9;
                
                if (this.currentPosition <= resetPosition) {
                    this.currentPosition = 0;
                }
                
                this.track.style.transform = `translateX(${this.currentPosition}px)`;
            }
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
}

// FAQ handling
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        question.classList.toggle('active');
        const answer = question.nextElementSibling;
        answer.classList.toggle('active');
        
        document.querySelectorAll('.faq-answer').forEach(otherAnswer => {
            if (otherAnswer !== answer) {
                otherAnswer.classList.remove('active');
                otherAnswer.previousElementSibling.classList.remove('active');
            }
        });
    });
});

// CTA button scroll
document.querySelector('.cta-button').addEventListener('click', function() {
    const formSection = document.getElementById('form-section');
    if (formSection) {
        formSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
});

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
    new AutoScrollCarousel();
});