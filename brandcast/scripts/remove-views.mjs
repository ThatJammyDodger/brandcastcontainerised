import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' : undefined
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function removeViewsFromDatabase() {
  try {
    console.log('Starting to remove views from database...');
    
    // Get all documents from analyzedStreamers collection
    const streamersSnapshot = await getDocs(collection(db, 'analyzedStreamers'));
    const batch = writeBatch(db);
    let count = 0;

    streamersSnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if ('views' in data) {
        const { views, ...restData } = data;
        batch.set(doc(db, 'analyzedStreamers', docSnapshot.id), restData);
        count++;
      }
    });

    // Get all documents from history collection
    const historySnapshot = await getDocs(collection(db, 'history'));
    historySnapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      if ('views' in data) {
        const { views, ...restData } = data;
        batch.set(doc(db, 'history', docSnapshot.id), restData);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Successfully removed views from ${count} documents`);
    } else {
      console.log('No documents found with views field');
    }
  } catch (error) {
    console.error('Error removing views from database:', error);
  }
}

// Execute the function
removeViewsFromDatabase(); 