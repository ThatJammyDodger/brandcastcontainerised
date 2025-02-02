import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const app = initializeApp({
    apiKey: "AIzaSyDUOmqVlX83hD5V5mGXENgwnIwmNUyTd10",
    authDomain: "brandcast-85493.firebaseapp.com",
    projectId: "brandcast-85493",
    storageBucket: "brandcast-85493.firebasestorage.app",
    messagingSenderId: "294502153664",
    appId: "1:294502153664:web:e68c303d1b57460b381c25",
    measurementId: "G-9LJKXJG91F"
});

const database = getFirestore(app);

export default database;