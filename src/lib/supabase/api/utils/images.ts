export function processProfileImage(file: File, maxSize = 500): Promise<Blob> {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            // Determine new dimensions
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }

            // Draw to canvas
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to JPEG
            canvas.toBlob((blob) => {
                resolve(blob!);
            }, "image/jpeg", 0.9); // 0.9 quality to save some space
        };
    });
}

export function processPlaylistCover(file: File, size = 800): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onerror = () => reject(new Error("Failed to load image"));

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d")!;

            // --- CENTER CROP LOGIC ---
            let sourceX = 0;
            let sourceY = 0;
            let sourceWidth = img.width;
            let sourceHeight = img.height;

            if (img.width > img.height) {
                sourceWidth = img.height;
                sourceX = (img.width - img.height) / 2;
            } else {
                sourceHeight = img.width;
                sourceY = (img.height - img.width) / 2;
            }

            ctx.drawImage(
                img, 
                sourceX, sourceY, sourceWidth, sourceHeight, 
                0, 0, size, size                             
            );

            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Canvas to Blob failed"));
            }, "image/webp", 0.85); 
        };
    });
}
