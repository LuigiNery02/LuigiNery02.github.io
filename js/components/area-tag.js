export function createAreaTag(area, variant = "primary") {
    const tag = document.createElement("span");
    tag.classList.add("area-tag", `area-tag-${variant}`);
    tag.textContent = area.name;
    tag.style.setProperty("--area-color", area.color);

    return tag;
}
