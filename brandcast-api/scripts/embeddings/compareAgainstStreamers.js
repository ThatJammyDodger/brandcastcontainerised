import { cosineSimilarity } from "./similarityFunction.js";
import { getEmbeddingForText } from "./reprocessDb.js";
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    updateDoc
} from 'firebase/firestore';
import fetch from 'node-fetch';

const firebaseConfig = {
    apiKey: "AIzaSyDUOmqVlX83hD5V5mGXENgwnIwmNUyTd10",
    authDomain: "brandcast-85493.firebaseapp.com",
    projectId: "brandcast-85493",
    storageBucket: "brandcast-85493.firebasestorage.app",
    messagingSenderId: "294502153664",
    appId: "1:294502153664:web:e68c303d1b57460b381c25",
    measurementId: "G-9LJKXJG91F"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function compareAgainstStreamers(text) {
    const embedding = await getEmbeddingForText(text);
    const streamersRef = collection(db, "streamers");
    const snapshot = await getDocs(streamersRef);

    const results = [];

    snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();

        // Ensure the document has both vector_embeddings and a username.
        if (data.vector_embeddings && data.name) {
            try {
                // Calculate the cosine similarity.
                const similarity = cosineSimilarity(embedding, data.vector_embeddings);
                results.push({ username: data.name, similarity });
            } catch (err) {
                console.error(`Error computing similarity for document ${docSnap.id}:`, err);
            }
        } else {
            console.warn(`Document ${docSnap.id} is missing vector_embeddings or name.`);
        }
    });

    // Sort results by similarity in descending order.
    results.sort((a, b) => b.similarity - a.similarity);

    // Return the top 10 streamers.
    return results.slice(0, 10);
}

