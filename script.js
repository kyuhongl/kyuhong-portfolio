// Cursor following orbs
let mouseX = 0;
let mouseY = 0;
let orbPositions = [];

// Initialize orb positions
const orbs = document.querySelectorAll('.orb');
orbs.forEach((orb, index) => {
    const rect = orb.getBoundingClientRect();
    orbPositions[index] = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        targetX: rect.left + rect.width / 2,
        targetY: rect.top + rect.height / 2
    };
});

// Track mouse movement
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Update orb positions to subtly follow cursor
function updateOrbs() {
    orbs.forEach((orb, index) => {
        const pos = orbPositions[index];
        
        // Calculate attraction to mouse (very subtle)
        const attraction = 0.002; // Very small attraction force
        const maxDistance = 200; // Maximum distance for attraction
        
        const dx = mouseX - pos.x;
        const dy = mouseY - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only apply attraction if mouse is within max distance
        if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            pos.targetX += dx * attraction * force;
            pos.targetY += dy * attraction * force;
        }
        
        // Smooth interpolation towards target
        const ease = 0.02;
        pos.x += (pos.targetX - pos.x) * ease;
        pos.y += (pos.targetY - pos.y) * ease;
        
        // Apply gentle drift back towards original position
        const rect = orb.getBoundingClientRect();
        const originalX = parseFloat(orb.dataset.originalX) || rect.left + rect.width / 2;
        const originalY = parseFloat(orb.dataset.originalY) || rect.top + rect.height / 2;
        
        // Store original positions if not set
        if (!orb.dataset.originalX) {
            orb.dataset.originalX = originalX;
            orb.dataset.originalY = originalY;
        }
        
        // Gentle drift back to original position
        const drift = 0.001;
        pos.targetX += (originalX - pos.targetX) * drift;
        pos.targetY += (originalY - pos.targetY) * drift;
        
        // Apply transform with subtle cursor following
        const translateX = pos.x - originalX;
        const translateY = pos.y - originalY;
        
        orb.style.transform = `translate(${translateX}px, ${translateY}px)`;
    });
    
    requestAnimationFrame(updateOrbs);
}

// Start the animation loop
updateOrbs();

// Add some random gentle movement
setInterval(() => {
    orbs.forEach((orb, index) => {
        const pos = orbPositions[index];
        
        // Add small random movements
        pos.targetX += (Math.random() - 0.5) * 10;
        pos.targetY += (Math.random() - 0.5) * 10;
    });
}, 3000); // Every 3 seconds 