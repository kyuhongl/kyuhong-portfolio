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
}); 