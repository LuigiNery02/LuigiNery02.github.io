import { createYouTubeEmbed } from "../systems/youtube.js";

const VIDEO_TYPES = ["video", "youtube"];

function createElement(tag, className) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
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

function createVideo(item) {
    const figure = createElement("figure", "gallery-video");

    if (item.type === "youtube") {
        const embed = createYouTubeEmbed(item);

        if (!embed) {
            return null;
        }

        figure.appendChild(embed);

        if (item.caption) {
            const caption = createElement("figcaption", "gallery-caption secondary-texts");
            caption.textContent = item.caption;
            figure.appendChild(caption);
        }

        return figure;
    }

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

    if (item.caption) {
        const caption = createElement("figcaption", "gallery-caption secondary-texts");
        caption.textContent = item.caption;
        figure.appendChild(caption);
    }

    return figure;
}

function createCarousel(images) {
    let currentIndex = 0;
    const hasMultiple = images.length > 1;

    const carousel = createElement("div", "gallery-carousel");
    carousel.setAttribute("role", "region");
    carousel.setAttribute("aria-roledescription", "carousel");
    carousel.setAttribute("aria-label", "Project images");

    const stage = createElement("div", "gallery-stage");

    const openButton = createElement("button", "gallery-open");
    openButton.type = "button";
    openButton.setAttribute("aria-label", "Expand image");

    const image = createElement("img", "gallery-image");
    openButton.appendChild(image);

    const previousButton = createIconButton("gallery-nav gallery-previous", "Previous image", "fa-chevron-left");
    const nextButton = createIconButton("gallery-nav gallery-next", "Next image", "fa-chevron-right");

    const counter = createElement("span", "gallery-counter code-texts");
    counter.setAttribute("aria-live", "polite");

    stage.append(openButton, previousButton, nextButton, counter);

    const caption = createElement("p", "gallery-caption secondary-texts");

    const thumbnails = createElement("div", "gallery-thumbnails");

    const thumbnailButtons = images.map((item, index) => {
        const button = createElement("button", "gallery-thumbnail");
        button.type = "button";
        button.setAttribute("aria-label", `Show image ${index + 1}`);

        const thumbnail = createElement("img");
        thumbnail.src = item.src;
        thumbnail.alt = "";
        thumbnail.loading = "lazy";

        button.appendChild(thumbnail);
        button.addEventListener("click", () => show(index));
        thumbnails.appendChild(button);

        return button;
    });

    const lightbox = createElement("dialog", "gallery-lightbox");
    lightbox.setAttribute("aria-label", "Expanded image");

    const closeButton = createIconButton("gallery-close", "Close", "fa-xmark");
    const lightboxImage = createElement("img", "gallery-lightbox-image");
    const lightboxCaption = createElement("p", "gallery-caption secondary-texts");
    const lightboxPrevious = createIconButton("gallery-nav gallery-previous", "Previous image", "fa-chevron-left");
    const lightboxNext = createIconButton("gallery-nav gallery-next", "Next image", "fa-chevron-right");

    lightbox.append(closeButton, lightboxImage, lightboxCaption, lightboxPrevious, lightboxNext);

    function show(index) {
        currentIndex = (index + images.length) % images.length;
        const item = images[currentIndex];
        const alt = item.caption ?? `Project image ${currentIndex + 1}`;

        image.src = item.src;
        image.alt = alt;
        lightboxImage.src = item.src;
        lightboxImage.alt = alt;

        caption.textContent = item.caption ?? "";
        caption.hidden = !item.caption;
        lightboxCaption.textContent = item.caption ?? "";
        lightboxCaption.hidden = !item.caption;

        counter.textContent = `${currentIndex + 1} / ${images.length}`;

        thumbnailButtons.forEach((button, buttonIndex) => {
            button.setAttribute("aria-current", String(buttonIndex === currentIndex));
        });
    }

    function handleArrowKeys(event) {
        if (!hasMultiple) {
            return;
        }

        if (event.key === "ArrowLeft") {
            event.preventDefault();
            show(currentIndex - 1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            show(currentIndex + 1);
        }
    }

    previousButton.addEventListener("click", () => show(currentIndex - 1));
    nextButton.addEventListener("click", () => show(currentIndex + 1));
    lightboxPrevious.addEventListener("click", () => show(currentIndex - 1));
    lightboxNext.addEventListener("click", () => show(currentIndex + 1));

    openButton.addEventListener("click", () => lightbox.showModal());
    closeButton.addEventListener("click", () => lightbox.close());

    lightbox.addEventListener("click", event => {
        if (event.target === lightbox) {
            lightbox.close();
        }
    });

    carousel.addEventListener("keydown", handleArrowKeys);
    lightbox.addEventListener("keydown", handleArrowKeys);

    [previousButton, nextButton, counter, thumbnails, lightboxPrevious, lightboxNext].forEach(element => {
        element.hidden = !hasMultiple;
    });

    carousel.append(stage, caption, thumbnails, lightbox);
    show(0);

    return carousel;
}

export function createGallery(items) {
    const gallery = createElement("div", "gallery");

    items
        .filter(item => VIDEO_TYPES.includes(item.type))
        .map(createVideo)
        .filter(Boolean)
        .forEach(element => gallery.appendChild(element));

    const images = items.filter(item => item.type === "image");

    if (images.length > 0) {
        gallery.appendChild(createCarousel(images));
    }

    return gallery;
}
