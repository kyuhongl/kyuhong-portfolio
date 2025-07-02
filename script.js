// Autonomous orb movement - no cursor following
document.addEventListener('DOMContentLoaded', () => {
    const orbs = document.querySelectorAll('.orb');
    
    // Add subtle random drift to orbs every few seconds
    function addRandomDrift() {
        orbs.forEach((orb, index) => {
            // Generate small random movement
            const driftX = (Math.random() - 0.5) * 30; // Random between -15 and 15
            const driftY = (Math.random() - 0.5) * 30;
            const driftRotation = (Math.random() - 0.5) * 10; // Small rotation drift
            
            // Apply the drift as an additional transform
            const currentTransform = orb.style.transform || '';
            orb.style.transform = `translate(${driftX}px, ${driftY}px) rotate(${driftRotation}deg)`;
            
            // Reset drift after some time to prevent orbs from moving too far
            setTimeout(() => {
                orb.style.transform = '';
            }, 8000 + Math.random() * 4000); // Reset after 8-12 seconds
        });
    }
    
    // Initial drift
    setTimeout(addRandomDrift, 2000);
    
    // Add new drift every 12-18 seconds
    setInterval(addRandomDrift, 12000 + Math.random() * 6000);
    
    console.log(`${orbs.length} orbs initialized with autonomous movement`);



    // Section toggle functionality
    const toggleOptions = document.querySelectorAll('.toggle-option');
    const slidingLine = document.querySelector('.sliding-line');
    const museumGrid = document.querySelector('.museum-grid');
    const experienceTimeline = document.querySelector('.experience-timeline');
    const filterContainer = document.querySelector('.filter-container');
    
    let currentSection = 'projects';

    // Function to update sliding line position
    function updateSlidingLine(activeOption) {
        const optionRect = activeOption.getBoundingClientRect();
        const containerRect = activeOption.parentElement.getBoundingClientRect();
        const relativeLeft = optionRect.left - containerRect.left;
        
        slidingLine.style.left = `${relativeLeft}px`;
        slidingLine.style.width = `${optionRect.width}px`;
    }

    toggleOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active class from all toggle options
            toggleOptions.forEach(o => o.classList.remove('active'));
            // Add active class to clicked option
            option.classList.add('active');
            
            // Update sliding line position
            updateSlidingLine(option);

            const section = option.getAttribute('data-section');
            currentSection = section;

            if (section === 'projects') {
                museumGrid.style.display = 'grid';
                experienceTimeline.style.display = 'none';
                filterContainer.style.display = 'flex';
            } else if (section === 'experience') {
                museumGrid.style.display = 'none';
                experienceTimeline.style.display = 'block';
                filterContainer.style.display = 'none';
            }
        });
    });

    // Initialize sliding line position
    const activeOption = document.querySelector('.toggle-option.active');
    if (activeOption) {
        setTimeout(() => updateSlidingLine(activeOption), 100);
    }

    // Card filtering functionality (works for both sections)
    const filterTags = document.querySelectorAll('.filter-tag');
    const museumCards = document.querySelectorAll('.museum-card');

    filterTags.forEach(tag => {
        tag.addEventListener('click', () => {
            // Remove active class from all tags
            filterTags.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tag
            tag.classList.add('active');

            const selectedTag = tag.getAttribute('data-tag');

            // Only filter projects section (experience doesn't use filters)
            if (currentSection === 'projects') {
                const projectCards = document.querySelectorAll('.museum-grid .museum-card');
                
                projectCards.forEach(card => {
                    if (selectedTag === 'all') {
                        card.classList.remove('hidden');
                    } else {
                        const cardTags = card.getAttribute('data-tags').split(',');
                        if (cardTags.includes(selectedTag)) {
                            card.classList.remove('hidden');
                        } else {
                            card.classList.add('hidden');
                        }
                    }
                });
            }
        });
    });

    console.log('Section toggle and project filtering initialized');

    // Card click functionality (projects and experience)
    const projectLinks = {
        // Project cards
        'card-1': 'https://kyuhongl.github.io/nlp-to-glsl/', // nlp-to-glsl
        'card-2': 'https://github.com/kyuhongl/height-fields-opengl', // height fields in openGL
        'card-3': 'https://github.com/kyuhongl/godot-firebase-multiplayer', // multiplayer x firebase
        'card-4': '#', // previous internship - add your link here
        'card-5': 'https://github.com/kyuhongl/fact-check-final', // factcheck!
        'card-6': 'https://kyuhongl.github.io/connections-korean/', // Korean Connections game
        
        // Experience cards
        'exp-card-1': '#', // software engineering intern - add your company/LinkedIn here
        'exp-card-2': '#', // research assistant - add your research page/lab here
        'exp-card-3': '#', // club leadership - add your organization page here
        'exp-card-4': '#'  // freelance projects - add your portfolio/website here
    };

    // Add click functionality to both project cards and timeline items
    const allClickableItems = document.querySelectorAll('.museum-card, .timeline-item');
    
    allClickableItems.forEach(item => {
        // Add click event listener
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the item class to determine which project/experience
            const itemClasses = item.classList;
            let itemKey = null;
            
            // Find the card-X or exp-card-X class
            for (let className of itemClasses) {
                if (className.startsWith('card-') || className.startsWith('exp-card-')) {
                    itemKey = className;
                    break;
                }
            }
            
            if (itemKey && projectLinks[itemKey]) {
                const url = projectLinks[itemKey];
                if (url !== '#') {
                    // Open in new tab
                    window.open(url, '_blank');
                } else {
                    console.log(`No URL set for ${itemKey}`);
                }
            }
        });
    });

    console.log('Card click functionality initialized for both projects and experience');

    // Video reverse-loop functionality
    const video = document.querySelector('.height-field-video');
    if (video) {
        let playingForward = true;
        let reverseInterval = null;

        // Function to play video in reverse
        function playReverse() {
            const fps = 24; // Adjust based on your video's frame rate
            const interval = 1000 / fps;
            
            reverseInterval = setInterval(() => {
                if (video.currentTime <= 0.1) { // Small buffer to avoid timing issues
                    clearInterval(reverseInterval);
                    reverseInterval = null;
                    playingForward = true;
                    video.currentTime = 0; // Ensure we're at the beginning
                    video.play(); // Start playing forward again
                } else {
                    video.currentTime -= interval / 1000;
                }
            }, interval);
        }

        // Listen for video ended event to start reverse playback
        video.addEventListener('ended', () => {
            if (playingForward) {
                playingForward = false;
                playReverse();
            }
        });

        console.log('Video reverse-loop initialized');
    }
}); 

// Theme Toggle Functionality
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    // SVG paths for sun and moon icons
    const sunPath = 'M12 17.5C14.485 17.5 16.5 15.485 16.5 13C16.5 10.515 14.485 8.5 12 8.5C9.515 8.5 7.5 10.515 7.5 13C7.5 15.485 9.515 17.5 12 17.5ZM12 7C12.2761 7 12.5 6.77614 12.5 6.5V3.5C12.5 3.22386 12.2761 3 12 3C11.7239 3 11.5 3.22386 11.5 3.5V6.5C11.5 6.77614 11.7239 7 12 7ZM12 19C11.7239 19 11.5 19.2239 11.5 19.5V22.5C11.5 22.7761 11.7239 23 12 23C12.2761 23 12.5 22.7761 12.5 22.5V19.5C12.5 19.2239 12.2761 19 12 19ZM22.5 12.5H19.5C19.2239 12.5 19 12.2761 19 12C19 11.7239 19.2239 11.5 19.5 11.5H22.5C22.7761 11.5 23 11.7239 23 12C23 12.2761 22.7761 12.5 22.5 12.5ZM7 12C7 12.2761 6.77614 12.5 6.5 12.5H3.5C3.22386 12.5 3 12.2761 3 12C3 11.7239 3.22386 11.5 3.5 11.5H6.5C6.77614 11.5 7 11.7239 7 12ZM17.7 6.3C17.8944 6.10557 17.8944 5.78943 17.7 5.595C17.5056 5.40057 17.1894 5.40057 16.995 5.595L14.83 7.76C14.6356 7.95443 14.6356 8.27057 14.83 8.465C15.0244 8.65943 15.3406 8.65943 15.535 8.465L17.7 6.3ZM9.535 15.535C9.34057 15.3406 9.02443 15.3406 8.83 15.535L6.665 17.7C6.47057 17.8944 6.47057 18.2106 6.665 18.405C6.85943 18.5994 7.17557 18.5994 7.37 18.405L9.535 16.24C9.72943 16.0456 9.72943 15.7294 9.535 15.535ZM17.7 17.7C17.8944 17.8944 17.8944 18.2106 17.7 18.405C17.5056 18.5994 17.1894 18.5994 16.995 18.405L14.83 16.24C14.6356 16.0456 14.6356 15.7294 14.83 15.535C15.0244 15.3406 15.3406 15.3406 15.535 15.535L17.7 17.7ZM9.535 8.465C9.72943 8.65943 10.0456 8.65943 10.24 8.465C10.4344 8.27057 10.4344 7.95443 10.24 7.76L8.075 5.595C7.88057 5.40057 7.56443 5.40057 7.37 5.595C7.17557 5.78943 7.17557 6.10557 7.37 6.3L9.535 8.465Z';
    const moonPath = 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z';
    
    // Toggle between dark and light modes
    if (body.classList.contains('light-mode')) {
        // Switch to dark mode
        body.classList.remove('light-mode');
        themeIcon.querySelector('path').setAttribute('d', sunPath);
        localStorage.setItem('theme', 'dark');
    } else {
        // Switch to light mode
        body.classList.add('light-mode');
        themeIcon.querySelector('path').setAttribute('d', moonPath);
        localStorage.setItem('theme', 'light');
    }
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.getElementById('theme-icon');
    
    // SVG paths for sun and moon icons
    const sunPath = 'M12 17.5C14.485 17.5 16.5 15.485 16.5 13C16.5 10.515 14.485 8.5 12 8.5C9.515 8.5 7.5 10.515 7.5 13C7.5 15.485 9.515 17.5 12 17.5ZM12 7C12.2761 7 12.5 6.77614 12.5 6.5V3.5C12.5 3.22386 12.2761 3 12 3C11.7239 3 11.5 3.22386 11.5 3.5V6.5C11.5 6.77614 11.7239 7 12 7ZM12 19C11.7239 19 11.5 19.2239 11.5 19.5V22.5C11.5 22.7761 11.7239 23 12 23C12.2761 23 12.5 22.7761 12.5 22.5V19.5C12.5 19.2239 12.2761 19 12 19ZM22.5 12.5H19.5C19.2239 12.5 19 12.2761 19 12C19 11.7239 19.2239 11.5 19.5 11.5H22.5C22.7761 11.5 23 11.7239 23 12C23 12.2761 22.7761 12.5 22.5 12.5ZM7 12C7 12.2761 6.77614 12.5 6.5 12.5H3.5C3.22386 12.5 3 12.2761 3 12C3 11.7239 3.22386 11.5 3.5 11.5H6.5C6.77614 11.5 7 11.7239 7 12ZM17.7 6.3C17.8944 6.10557 17.8944 5.78943 17.7 5.595C17.5056 5.40057 17.1894 5.40057 16.995 5.595L14.83 7.76C14.6356 7.95443 14.6356 8.27057 14.83 8.465C15.0244 8.65943 15.3406 8.65943 15.535 8.465L17.7 6.3ZM9.535 15.535C9.34057 15.3406 9.02443 15.3406 8.83 15.535L6.665 17.7C6.47057 17.8944 6.47057 18.2106 6.665 18.405C6.85943 18.5994 7.17557 18.5994 7.37 18.405L9.535 16.24C9.72943 16.0456 9.72943 15.7294 9.535 15.535ZM17.7 17.7C17.8944 17.8944 17.8944 18.2106 17.7 18.405C17.5056 18.5994 17.1894 18.5994 16.995 18.405L14.83 16.24C14.6356 16.0456 14.6356 15.7294 14.83 15.535C15.0244 15.3406 15.3406 15.3406 15.535 15.535L17.7 17.7ZM9.535 8.465C9.72943 8.65943 10.0456 8.65943 10.24 8.465C10.4344 8.27057 10.4344 7.95443 10.24 7.76L8.075 5.595C7.88057 5.40057 7.56443 5.40057 7.37 5.595C7.17557 5.78943 7.17557 6.10557 7.37 6.3L9.535 8.465Z';
    const moonPath = 'M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z';
    
    // Default to dark mode if no saved preference
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeIcon.querySelector('path').setAttribute('d', moonPath);
    } else {
        // Ensure we're in dark mode (default)
        document.body.classList.remove('light-mode');
        themeIcon.querySelector('path').setAttribute('d', sunPath);
        localStorage.setItem('theme', 'dark');
    }
    
    console.log('Theme toggle initialized. Current theme:', savedTheme || 'dark');
}); 