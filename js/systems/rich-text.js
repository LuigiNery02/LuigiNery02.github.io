const SAFE_URL_PATTERN = /^(https?:\/\/|mailto:|#|\.{0,2}\/|[\w-]+\.html)/i;
const EXTERNAL_URL_PATTERN = /^(https?:\/\/|mailto:)/i;

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export function isSafeUrl(url) {
    return typeof url === "string" && SAFE_URL_PATTERN.test(url.trim());
}

export function isExternalUrl(url) {
    return EXTERNAL_URL_PATTERN.test(url);
}

function createLink(match, label, url) {
    if (!isSafeUrl(url)) {
        return label;
    }

    const target = isExternalUrl(url) ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a class="rich-link" href="${url}"${target}>${label}</a>`;
}

export function formatInline(text) {
    return escapeHtml(text)
        .replace(/`(.+?)`/g, "<code>$1</code>")
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, createLink)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^\w/])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>");
}

function createBlock(block) {
    if (typeof block === "string") {
        block = { type: "paragraph", text: block };
    }

    if (block.type === "heading") {
        const heading = document.createElement("h4");
        heading.innerHTML = formatInline(block.text);
        return heading;
    }

    if (block.type === "list") {
        const list = document.createElement(block.ordered ? "ol" : "ul");

        block.items.forEach(text => {
            const item = document.createElement("li");
            item.innerHTML = formatInline(text);
            list.appendChild(item);
        });

        return list;
    }

    const paragraph = document.createElement("p");
    paragraph.innerHTML = formatInline(block.text);
    return paragraph;
}

export function renderRichContent(blocks) {
    const fragment = document.createDocumentFragment();
    blocks.forEach(block => fragment.appendChild(createBlock(block)));
    return fragment;
}
