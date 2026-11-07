const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('header nav ul');

menuButton.addEventListener('click', () => {
    const opened = menu.classList.toggle('opened');
    menuButton.setAttribute('aria-expanded', opened);
});