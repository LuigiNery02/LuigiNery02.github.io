const ID_PATTERN = /^[\w-]{11}$/;

export function getYouTubeId(url) {
    if (typeof url !== "string") {
        return null;
    }

    if (ID_PATTERN.test(url)) {
        return url;
    }

    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\.|^m\./, "");
        let id = null;

        if (host === "youtu.be") {
            id = parsed.pathname.slice(1).split("/")[0];
        } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
            const [, section, value] = parsed.pathname.split("/");
            id = section === "watch" ? parsed.searchParams.get("v") : value;
        }

        return ID_PATTERN.test(id ?? "") ? id : null;
    } catch {
        return null;
    }
}

export function createYouTubeEmbed(item) {
    const id = getYouTubeId(item.src);

    if (!id) {
        return null;
    }

    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
    iframe.title = item.caption ?? "YouTube video";
    iframe.loading = "lazy";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    return iframe;
}
