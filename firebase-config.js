const firebaseConfig = {
    apiKey: "AIzaSyDXdfc3obHpGIfWf3Yji0F7ZzqmcuW409Q",
    authDomain: "espresso-2b53d.firebaseapp.com",
    databaseURL: "https://espresso-2b53d-default-rtdb.firebaseio.com",
    projectId: "espresso-2b53d",
    storageBucket: "espresso-2b53d.firebasestorage.app",
    messagingSenderId: "279177798448",
    appId: "1:279177798448:web:35b6338a6f22b994c45ef5",
    measurementId: "G-1TZ8L1B97L"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const auth = firebase.auth();

console.log('تم تهيئة Firebase بنجاح!');

// تهيئة قاعدة بيانات
function initializeDatabase() {
    const dbRef = database.ref();
    return dbRef.child('appInitialized').once('value').then(snapshot => {
        if (!snapshot.exists()) {
            return dbRef.set({
                appInitialized: true,
                lastUpdated: new Date().toISOString()
            });
        }
        return Promise.resolve();
    });
}