function toggleMenu() {
    const hamburger = document.querySelector('.hamburger');
    const sideMenu = document.querySelector('.side-menu');
    hamburger.classList.toggle('active');
    sideMenu.classList.toggle('active');
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const hamburger = document.querySelector('.hamburger');
    const sideMenu = document.querySelector('.side-menu');
    if (!event.target.closest('.hamburger') && 
        !event.target.closest('.side-menu') && 
        sideMenu.classList.contains('active')) {
        hamburger.classList.remove('active');
        sideMenu.classList.remove('active');
    }
});
