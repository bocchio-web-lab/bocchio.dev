window.addEventListener("load", () => {

    const hamburgerIcon = document.getElementById('hamburgerIcon');
    const hamburgerClosedSvg = document.getElementById('hamburgerClosedSvg');
    const hamburgerOpenSvg = document.getElementById('hamburgerOpenSvg');
    const hamburgerDropdownMenu = document.getElementById('hamburgerDropdownMenu');

    if (!hamburgerIcon || !hamburgerClosedSvg || !hamburgerOpenSvg || !hamburgerDropdownMenu) {
        console.error("Nav menu not fully loaded.");
        return;
    }

    const toggleHamburgerMenu = () => {
        hamburgerDropdownMenu.classList.toggle('hidden');
        hamburgerClosedSvg.classList.toggle('hidden');
        hamburgerOpenSvg.classList.toggle('hidden');
    };

    const closeHamburgerMenu = () => {
        hamburgerDropdownMenu.classList.add('hidden');
        hamburgerClosedSvg.classList.remove('hidden');
        hamburgerOpenSvg.classList.add('hidden');
    };

    hamburgerIcon.addEventListener('click', toggleHamburgerMenu);
    hamburgerIcon.addEventListener('keydown', (event) => {
        if (event.defaultPrevented) {
            return;
        }
        if (event.key === 'Enter') {
            toggleHamburgerMenu();
            event.preventDefault();
        }
    });

    window.addEventListener('scroll', closeHamburgerMenu);

})
