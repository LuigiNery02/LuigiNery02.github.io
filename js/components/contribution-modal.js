import { renderRichContent } from "../systems/rich-text.js";
import { createAreaTag } from "./area-tag.js";
import { createStepNavigation } from "./step-navigation.js";
import { createYouTubeEmbed } from "../systems/youtube.js";

export function getContributionTabs(contribution) {
    return (contribution.tabs ?? [])
        .filter(tab => (tab.content?.length ?? 0) > 0 || (tab.media?.length ?? 0) > 0)
        .map((tab, index) => ({ ...tab, label: tab.title || `Part ${index + 1}` }));
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

    if (item.type === "youtube") {
        const embed = createYouTubeEmbed(item);

        if (embed) {
            figure.appendChild(embed);
        }
    } else if (item.type === "video") {
        const video = createElement("video");
        video.src = item.src;
        video.playsInline = true;

        if (item.autoplay) {
            video.muted = true;
            video.loop = true;
            video.autoplay = true;
            video.preload = "auto";
        } else {
            video.controls = true;
            video.preload = "metadata";
        }

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

    const navigation = createStepNavigation(showTab, {
        previousLabel: "Previous tab",
        nextLabel: "Next tab"
    });

    const footer = createElement("div", "contribution-modal-footer");
    footer.appendChild(navigation.element);

    panel.append(header, body, footer);
    dialog.appendChild(panel);

    function showTab(index) {
        const tab = tabs[index];

        tabTitle.textContent = `// ${tab.label}`;
        textContent.replaceChildren(renderRichContent(tab.content ?? []));
        textColumn.scrollTop = 0;
        body.scrollTop = 0;

        const media = tab.media ?? [];
        mediaColumn.replaceChildren(...media.map(createMedia));
        mediaColumn.hidden = media.length === 0;
        body.classList.toggle("contribution-modal-body-text-only", media.length === 0);

        navigation.setIndex(index);
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

        navigation.setSteps(tabs.map(tab => tab.label));
        footer.hidden = tabs.length < 2;

        showTab(0);
        dialog.showModal();
    }

    closeButton.addEventListener("click", () => dialog.close());

    dialog.addEventListener("click", event => {
        if (event.target === dialog) {
            dialog.close();
        }
    });

    dialog.addEventListener("keydown", navigation.handleKey);

    dialog.addEventListener("close", () => {
        mediaColumn.replaceChildren();
    });

    return { element: dialog, open };
}
