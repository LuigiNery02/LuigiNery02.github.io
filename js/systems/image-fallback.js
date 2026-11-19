document.addEventListener(
    "error",
    event => {
        if (event.target instanceof HTMLImageElement) {
            event.target.classList.add("image-missing");
            console.warn(`Image not found: ${event.target.getAttribute("src")}`);
        }
    },
    true
);

document.addEventListener(
    "load",
    event => {
        if (event.target instanceof HTMLImageElement) {
            event.target.classList.remove("image-missing");
        }
    },
    true
);
