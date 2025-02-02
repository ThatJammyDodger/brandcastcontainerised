import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if no app exists
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

// Initialize collections
const initializeCollections = async () => {
  try {
    // Create analysedStreamers collection if it doesn't exist
    const analysedStreamersRef = collection(db, 'analysedStreamers');
    
    // Create streamerScores collection if it doesn't exist
    const streamerScoresRef = collection(db, 'streamerScores');
    
    // Create a placeholder document in each collection to ensure they exist
    await setDoc(doc(analysedStreamersRef, '_placeholder'), {
      _created: new Date(),
      _isPlaceholder: true
    });
    
    await setDoc(doc(streamerScoresRef, '_placeholder'), {
      _created: new Date(),
      _isPlaceholder: true
    });

  } catch (error) {
    console.error('Error initializing Firebase collections:', error);
  }
};

// Run initialization
initializeCollections();

export { db }; 