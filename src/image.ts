// Profile photo: center-crops the chosen image to a square and resizes it to 256x256 JPEG.
// Lowers the quality until it fits the API limit (90,000 chars), so the upload stays small (~20-40 KB).
const AVATAR_SIZE = 256;
const MAX_DATA_URL_LENGTH = 90000;

export async function fileToAvatarDataUrl(file: File) {
    if (!file.type.startsWith("image/")) throw new Error("NOT_AN_IMAGE");

    const url = URL.createObjectURL(file);

    try {
        const image = new Image();
        image.src = url;
        await image.decode(); // Fails for formats the browser cannot read

        const side = Math.min(image.naturalWidth, image.naturalHeight);
        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;

        const context = canvas.getContext("2d");
        if (!context) throw new Error("NO_CANVAS");

        // White behind transparent PNGs (JPEG has no transparency)
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
        context.drawImage(
            image,
            (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side,
            0, 0, AVATAR_SIZE, AVATAR_SIZE
        );

        for (const quality of [0.85, 0.75, 0.6, 0.45]) {
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl;
        }

        throw new Error("TOO_BIG");
    } finally {
        URL.revokeObjectURL(url);
    }
}
