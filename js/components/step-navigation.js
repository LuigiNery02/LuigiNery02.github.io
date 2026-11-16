function createIconButton(label, icon) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "step-nav-button";
    button.setAttribute("aria-label", label);

    const iconElement = document.createElement("i");
    iconElement.className = `fa-solid ${icon}`;
    iconElement.setAttribute("aria-hidden", "true");
    button.appendChild(iconElement);

    return button;
}

export function createStepNavigation(onSelect, { previousLabel = "Previous", nextLabel = "Next" } = {}) {
    let count = 0;
    let currentIndex = 0;

    const element = document.createElement("div");
    element.className = "step-nav";

    const previousButton = createIconButton(previousLabel, "fa-chevron-left");
    const nextButton = createIconButton(nextLabel, "fa-chevron-right");

    const dots = document.createElement("div");
    dots.className = "step-nav-dots";

    element.append(previousButton, dots, nextButton);

    function select(index) {
        if (index >= 0 && index < count && index !== currentIndex) {
            onSelect(index);
        }
    }

    function setSteps(labels) {
        count = labels.length;
        currentIndex = 0;

        dots.replaceChildren(...labels.map((label, index) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "step-nav-dot";
            dot.setAttribute("aria-label", label);
            dot.addEventListener("click", () => select(index));
            return dot;
        }));

        element.hidden = count < 2;
    }

    function setIndex(index) {
        currentIndex = index;
        previousButton.disabled = index === 0;
        nextButton.disabled = index === count - 1;

        [...dots.children].forEach((dot, dotIndex) => {
            dot.setAttribute("aria-current", String(dotIndex === index));
        });
    }

    function handleKey(event) {
        const tag = event.target.tagName;

        if (tag === "VIDEO" || tag === "INPUT" || tag === "TEXTAREA") {
            return;
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            select(currentIndex - 1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            select(currentIndex + 1);
        }
    }

    previousButton.addEventListener("click", () => select(currentIndex - 1));
    nextButton.addEventListener("click", () => select(currentIndex + 1));

    return { element, setSteps, setIndex, handleKey };
}
