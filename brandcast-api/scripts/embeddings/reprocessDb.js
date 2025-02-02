import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    updateDoc
} from 'firebase/firestore';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' }); // Load environment variables from .env

const firebaseConfig = {
    apiKey: "AIzaSyDUOmqVlX83hD5V5mGXENgwnIwmNUyTd10",
    authDomain: "brandcast-85493.firebaseapp.com",
    projectId: "brandcast-85493",
    storageBucket: "brandcast-85493.firebasestorage.app",
    messagingSenderId: "294502153664",
    appId: "1:294502153664:web:e68c303d1b57460b381c25",
    measurementId: "G-9LJKXJG91F"
};

// Initialize the Firebase app and Firestore.
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- OpenAI API Configuration ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    throw new Error('Missing OpenAI API key in environment variables.');
}

const OPENAI_EMBEDDINGS_API_URL = 'https://api.openai.com/v1/embeddings';

/**
 * Uses OpenAI's API to generate a vector embedding for the given text.
 *
 * @param {string} text - The text for which to generate an embedding.
 * @returns {Promise<Array<number>>} The embedding vector.
 */
export async function getEmbeddingForText(text) {
    // Prepare the payload for OpenAI's Embeddings API.
    const payload = {
        model: "text-embedding-ada-002",
        input: text,
    };

    // Call OpenAI's API.
    const response = await fetch(OPENAI_EMBEDDINGS_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();

    // OpenAI's API returns an object with a "data" array.
    // Each element in the array corresponds to an input item. Since we passed a single text,
    // we extract the embedding from the first element.
    const embedding = data.data && data.data[0] && data.data[0].embedding;
    if (!embedding) {
        throw new Error('No embedding returned from OpenAI API.');
    }

    return embedding;
}

/**
 * Processes all documents in a Firestore collection:
 * - Retrieves each document,
 * - Generates a vector embedding for its "text" field using OpenAI's API,
 * - Updates the document with the new "embedding" field.
 */
async function processDocuments() {
    // Replace 'your_collection' with the name of your Firestore collection.
    const collRef = collection(db, 'streamers');
    const snapshot = await getDocs(collRef);

    if (snapshot.empty) {
        console.log('No documents found in the collection.');
        return;
    }

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        // Construct the text from description, tags, and game_name.
        // (Note: Ensure spacing is correct between concatenated parts.)
        const text =
            (data.description || '') +
            ' ' +
            (Array.isArray(data.tags) ? data.tags.join(', ') : '') +
            ' ' +
            (data.game_name || '');

        // If text is empty, skip this document.
        if (!text.trim()) {
            console.log(`Document ${docSnap.id} does not have sufficient text; skipping.`);
            continue;
        }

        console.log(`Processing document ${docSnap.id}...`);

        try {
            // Generate the embedding using OpenAI.
            const embedding = await getEmbeddingForText(text);
            console.log(`Got embedding for document ${docSnap.id}:`, embedding);

            // Update the document by adding a new field "vector_embeddings".
            const docRef = doc(db, 'streamers', docSnap.id);
            await updateDoc(docRef, { vector_embeddings: embedding });
            console.log(`Updated document ${docSnap.id} with vector_embeddings.`);
        } catch (error) {
            console.error(`Error processing document ${docSnap.id}:`, error);
        }
    }
}

// Run the document processing function.
// processDocuments()
//     .then(() => {
//         console.log('Processing complete.');
//     })
//     .catch((err) => {
//         console.error('Error processing documents:', err);
//     });