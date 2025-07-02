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