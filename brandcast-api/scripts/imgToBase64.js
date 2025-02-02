import axios from 'axios';
import sharp from 'sharp';

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Function to convert a remote image into Base64
// export async function imgToBase64(imageUrl) {
//     try {
//         const response = await fetch(imageUrl);
//
//         if (!response.ok) {
//             throw new Error(`Failed to fetch image. Status: ${response.status}`);
//         }
//
//         // Fetch the image data as a buffer
//         const buffer = await response.arrayBuffer();
//
//         // Convert buffer into Base64 string
//         const base64 = Buffer.from(buffer).toString('base64');
//
//         // Return the Base64-encoded result
//         return base64;
//     } catch (error) {
//         console.error('Error converting image to Base64:', error);
//         return null;
//     }
// }

export async function processRemoteImage(imageUrl, maxWidth = 200, maxHeight = 200) {
    try {
        // Fetch the image as a buffer
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(response.data, 'binary');

        // Load the image with sharp
        const image = sharp(imageBuffer);

        // Get original metadata
        const metadata = await image.metadata();

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = metadata;
        if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            if (width > height) {
                width = maxWidth;
                height = Math.round(maxWidth / aspectRatio);
            } else {
                height = maxHeight;
                width = Math.round(maxHeight * aspectRatio);
            }
        }

        // Resize and convert to grayscale
        const processedImageBuffer = await image
            .resize(width, height)
            .grayscale()
            .jpeg({ quality: 70 }) // Convert to JPEG with quality 70
            .toBuffer();

        // Convert to Base64
        const base64String = processedImageBuffer.toString('base64');
        return base64String;
    } catch (error) {
        console.error('Error processing the image:', error);
        throw error;
    }
}

export function getMimeTypeFromSignature(base64String) {
    const signatures = {
        '/9j/': 'image/jpeg',
        'iVBORw0KGgo': 'image/png',
        'R0lGOD': 'image/gif',
        // Add more signatures as needed
    };

    for (const signature in signatures) {
        if (base64String.startsWith(signature)) {
            return signatures[signature];
        }
    }

    return null;
}

// eg
// (async () => {
//     const imageUrl = 'https://www.google.co.uk/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png';
//
//     const base64String = await imgToBase64(imageUrl);
//     if (base64String) {
//         console.log('Base64 Encoded String:', base64String);
//     }
// })();