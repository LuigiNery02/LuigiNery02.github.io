import { loadAbout } from "../systems/data-loader.js";
import { renderRichContent } from "../systems/rich-text.js";
import { createStepNavigation } from "../components/step-navigation.js";
import "../components/navigation.js";

function createContact(contact) {
    const item = document.createElement("li");

    const link = document.createElement("a");
    link.classList.add("about-contact");
    link.href = contact.href;

    if (/^https?:/.test(contact.href)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
    }

    const icon = document.createElement("i");
    icon.className = `about-contact-icon ${contact.icon ?? "fa-solid fa-link"}`;
    icon.setAttribute("aria-hidden", "true");

    const text = document.createElement("span");
    text.classList.add("about-contact-text");

    const label = document.createElement("span");
    label.classList.add("about-contact-label", "code-texts");
    label.textContent = contact.label;

    const value = document.createElement("span");
    value.classList.add("about-contact-value", "secondary-texts");
    value.textContent = contact.value;

    const arrow = document.createElement("i");
    arrow.className = "about-contact-arrow fa-solid fa-arrow-right";
    arrow.setAttribute("aria-hidden", "true");

    text.append(label, value);
    link.append(icon, text, arrow);
    item.appendChild(link);

    return item;
}

function renderSlideshow(slides) {
    const slide = document.querySelector(".about-slide");
    const photo = slide.querySelector(".about-slide-photo img");
    const counter = slide.querySelector(".about-slide-counter");
    const title = slide.querySelector(".about-slide-title");
    const content = slide.querySelector(".about-slide-content");
    const textColumn = slide.querySelector(".about-slide-text");

    const pad = number => String(number).padStart(2, "0");

    const navigation = createStepNavigation(showSlide, {
        previousLabel: "Previous",
        nextLabel: "Next"
    });

    function showSlide(index) {
        const data = slides[index];

        photo.src = data.photo;
        photo.alt = data.title ?? "";

        counter.textContent = `${pad(index + 1)} / ${pad(slides.length)}`;
        counter.hidden = slides.length < 2;

        title.textContent = data.title ?? "";
        title.hidden = !data.title;

        content.replaceChildren(renderRichContent(data.content ?? []));
        textColumn.scrollTop = 0;

        slide.classList.remove("about-slide-enter");
        void slide.offsetWidth;
        slide.classList.add("about-slide-enter");

        navigation.setIndex(index);
    }

    slides.forEach(data => {
        const preload = new Image();
        preload.src = data.photo;
    });

    navigation.setSteps(slides.map((data, index) => data.title ?? `Slide ${index + 1}`));
    document.querySelector(".about-slide-navigation").appendChild(navigation.element);

    document.addEventListener("keydown", event => {
        if (!document.querySelector("dialog[open]")) {
            navigation.handleKey(event);
        }
    });

    showSlide(0);
}

async function initializeAboutPage() {
    const about = await loadAbout();

    const slides = about.slides ?? [];

    if (slides.length > 0) {
        renderSlideshow(slides);
    } else {
        document.querySelector(".about-slideshow").hidden = true;
    }

    const contacts = document.querySelector(".about-contacts");
    (about.contacts ?? []).forEach(contact => contacts.appendChild(createContact(contact)));

    if (about.resume?.href) {
        const resume = document.querySelector(".about-resume");
        resume.href = about.resume.href;
        resume.setAttribute("download", "");
        resume.querySelector("span").textContent = about.resume.label ?? "Download CV";
        resume.hidden = false;
    }

    document.querySelector(".about-layout").hidden = false;
}

initializeAboutPage();
