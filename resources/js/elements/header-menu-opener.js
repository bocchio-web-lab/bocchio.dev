window.addEventListener("load", () => {

    const hamburgerIcon = document.getElementById('hamburgerIcon');
    const hamburgerDropdownMenu = document.getElementById('hamburgerDropdownMenu');

    if (!(hamburgerIcon && hamburgerDropdownMenu)) {
        return false
    }

    hamburgerIcon.addEventListener('click', toggleHamburgerMenu);
    hamburgerIcon.addEventListener('keypress', toggleHamburgerMenu);
    window.addEventListener('scroll', closeHamburgerMenu);

    function toggleHamburgerMenu() {
        hamburgerDropdownMenu.classList.toggle('hidden');
    }

    function closeHamburgerMenu() {
        hamburgerDropdownMenu.classList.add('hidden');
    }

    return true

})
