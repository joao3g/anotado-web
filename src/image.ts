// Profile photo: center-crops an image (file or camera frame) to a square and resizes it to 256x256 JPEG.
// Lowers the quality until it fits the API limit (90,000 chars), so the upload stays small (~5-40 KB).
const AVATAR_SIZE = 256;
const MAX_DATA_URL_LENGTH = 90000;

// Shared by the gallery and the in-app camera, so both give exactly the same result.
function toAvatarDataUrl(source: CanvasImageSource, width: number, height: number) {
    const side = Math.min(width, height);
    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("NO_CANVAS");

    // White behind transparent PNGs (JPEG has no transparency)
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
    context.drawImage(
        source,
        (width - side) / 2, (height - side) / 2, side, side,
        0, 0, AVATAR_SIZE, AVATAR_SIZE
    );

    for (const quality of [0.85, 0.75, 0.6, 0.45]) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl;
    }

    throw new Error("TOO_BIG");
}

// Gallery: a file chosen with <input type="file">.
export async function fileToAvatarDataUrl(file: File) {
    if (!file.type.startsWith("image/")) throw new Error("NOT_AN_IMAGE");

    const url = URL.createObjectURL(file);

    try {
        const image = new Image();
        image.src = url;
        await image.decode(); // Fails for formats the browser cannot read

        return toAvatarDataUrl(image, image.naturalWidth, image.naturalHeight);
    } finally {
        URL.revokeObjectURL(url);
    }
}

// In-app camera: the current frame of a playing <video>. Saved as the camera sees it (not mirrored).
export function videoFrameToAvatarDataUrl(video: HTMLVideoElement) {
    if (!video.videoWidth || !video.videoHeight) throw new Error("NO_FRAME");

    return toAvatarDataUrl(video, video.videoWidth, video.videoHeight);
}
