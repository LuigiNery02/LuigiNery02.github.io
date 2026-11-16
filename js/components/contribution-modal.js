import { renderRichContent } from "../systems/rich-text.js";
import { createAreaTag } from "./area-tag.js";

const TABS = [
    { key: "aboutTheWork", label: "About the Work" },
    { key: "myRole", label: "My Role" },
    { key: "whatILearned", label: "What I Learned" }
];

export function getContributionTabs(contribution) {
    const details = contribution.details;

    if (!details) {
        return [];
    }

    return TABS
        .filter(tab => {
            const section = details[tab.key];
            return section && ((section.content?.length ?? 0) > 0 || (section.media?.length ?? 0) > 0);
        })
        .map(tab => ({ ...tab, ...details[tab.key] }));
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function createIconButton(className, label, icon) {
    const button = createElement("button", className);
    button.type = "button";
    button.setAttribute("aria-label", label);

    const iconElement = createElement("i", `fa-solid ${icon}`);
    iconElement.setAttribute("aria-hidden", "true");
    button.appendChild(iconElement);

    return button;
}

function createMedia(item) {
    const figure = createElement("figure", "contribution-media-item");

    if (item.type === "video") {
        const video = createElement("video");
        video.src = item.src;
        video.controls = true;
        video.preload = "metadata";
        video.playsInline = true;

        if (item.poster) {
            video.poster = item.poster;
        }

        figure.appendChild(video);
    } else {
        const image = createElement("img");
        image.src = item.src;
        image.alt = item.caption ?? "";
        image.loading = "lazy";
        figure.appendChild(image);
    }

    if (item.caption) {
        figure.appendChild(createElement("figcaption", "secondary-texts", item.caption));
    }

    return figure;
}

export function createContributionModal(areas) {
    let tabs = [];
    let currentIndex = 0;

    const dialog = createElement("dialog", "contribution-modal");
    const panel = createElement("div", "contribution-modal-panel");

    const header = createElement("div", "contribution-modal-header");
    const headerText = createElement("div", "contribution-modal-heading");
    const tags = createElement("div", "contribution-modal-tags");
    const title = createElement("h2", "contribution-modal-title title-texts");
    const closeButton = createIconButton("contribution-modal-close", "Close", "fa-xmark");

    headerText.append(tags, title);
    header.append(headerText, closeButton);

    const body = createElement("div", "contribution-modal-body");
    const textColumn = createElement("div", "contribution-modal-text secondary-texts");
    const tabTitle = createElement("h3", "contribution-modal-tab-title code-texts");
    const textContent = createElement("div", "contribution-modal-content");
    textColumn.append(tabTitle, textContent);

    const mediaColumn = createElement("div", "contribution-modal-media");
    body.append(textColumn, mediaColumn);

    const footer = createElement("div", "contribution-modal-footer");
    const previousButton = createIconButton("contribution-modal-nav", "Previous tab", "fa-chevron-left");
    const nextButton = createIconButton("contribution-modal-nav", "Next tab", "fa-chevron-right");
    const dots = createElement("div", "contribution-modal-dots");
    footer.append(previousButton, dots, nextButton);

    panel.append(header, body, footer);
    dialog.appendChild(panel);

    function showTab(index) {
        if (index < 0 || index >= tabs.length) {
            return;
        }

        currentIndex = index;
        const tab = tabs[currentIndex];

        tabTitle.textContent = `// ${tab.label}`;
        textContent.replaceChildren(renderRichContent(tab.content ?? []));
        textColumn.scrollTop = 0;
        body.scrollTop = 0;

        const media = tab.media ?? [];
        mediaColumn.replaceChildren(...media.map(createMedia));
        mediaColumn.hidden = media.length === 0;
        body.classList.toggle("contribution-modal-body-text-only", media.length === 0);

        previousButton.disabled = currentIndex === 0;
        nextButton.disabled = currentIndex === tabs.length - 1;

        [...dots.children].forEach((dot, dotIndex) => {
            dot.setAttribute("aria-current", String(dotIndex === currentIndex));
        });
    }

    function open(contribution) {
        tabs = getContributionTabs(contribution);

        if (tabs.length === 0) {
            return;
        }

        title.textContent = contribution.title;

        tags.replaceChildren();
        const primaryArea = areas.find(area => area.id === contribution.primaryArea);

        if (primaryArea) {
            tags.appendChild(createAreaTag(primaryArea, "primary"));
        }

        (contribution.relatedAreas ?? []).forEach(id => {
            const area = areas.find(item => item.id === id);

            if (area) {
                tags.appendChild(createAreaTag(area, "related"));
            }
        });

        dots.replaceChildren(...tabs.map((tab, index) => {
            const dot = createElement("button", "contribution-modal-dot");
            dot.type = "button";
            dot.setAttribute("aria-label", tab.label);
            dot.addEventListener("click", () => showTab(index));
            return dot;
        }));

        footer.hidden = tabs.length < 2;

        showTab(0);
        dialog.showModal();
    }

    previousButton.addEventListener("click", () => showTab(currentIndex - 1));
    nextButton.addEventListener("click", () => showTab(currentIndex + 1));
    closeButton.addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", event => {
        if (event.target === dialog) {
            dialog.close();
        }
    });

    dialog.addEventListener("keydown", event => {
        if (event.target.tagName === "VIDEO") {
            return;
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            showTab(currentIndex - 1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            showTab(currentIndex + 1);
        }
    });

    dialog.addEventListener("close", () => {
        mediaColumn.replaceChildren();
    });

    return { element: dialog, open };
}
