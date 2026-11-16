const fittedElements = new Set();

const observer = new ResizeObserver(entries => {
    entries.forEach(entry => fit(entry.target));
});

function fit(element) {
    element.style.setProperty("--fit-scale", "1");

    const available = element.clientWidth;
    const needed = element.scrollWidth;

    if (available > 0 && needed > available) {
        element.style.setProperty("--fit-scale", String(available / needed));
    }
}

export function fitTextToWidth(...elements) {
    elements.forEach(element => {
        fittedElements.add(element);
        observer.observe(element);
    });
}

document.fonts.ready.then(() => {
    fittedElements.forEach(fit);
});
