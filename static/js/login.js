import { setPersistence, browserSessionPersistence, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAcv6e_eol5mUYfUJdQ0Oqh5tB0IrNOMus",
    authDomain: "holadup123.firebaseapp.com",
    projectId: "holadup123",
    storageBucket: "holadup123.firebasestorage.app",
    messagingSenderId: "1012681468829",
    appId: "1:1012681468829:web:fb9de3cdf51a1c67479d74"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Set session persistence to SESSION
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .then(() => console.log("Session persistence set to SESSION"))
    .catch((error) => console.error("Error setting session persistence:", error));

document.getElementById("googleLogin").addEventListener("click", async function () {
    const provider = new firebase.auth.GoogleAuthProvider();  // Compat auth provider

    try {
        // Sign in with popup using compat API
        const result = await auth.signInWithPopup(provider);  // Use compat method here
        const user = result.user;  // Retrieve signed-in user

        const userEmail = user.email;
        const userName = user.displayName;
        console.log("User signed in:", userEmail, userName);

        // Define admin emails
        const adminEmails = ["afthabrahman0808@gmail.com", "supermgenie@gmail.com"];
        const accountType = adminEmails.includes(userEmail) ? "admin" : "customer";

        const userDocId = userEmail.replace(/[@.]/g, "_");
        const userDocRef = db.collection("users").doc(userDocId);  // Firestore compat reference

        // Check if user already exists in Firestore and create/update if necessary
        const docSnapshot = await userDocRef.get();
        if (!docSnapshot.exists) {
            console.log("New user. Creating Firestore document.");
            await userDocRef.set({
                mailid: userEmail,
                name: userName,
                account_type: accountType
            });
        }

        console.log("User stored/updated in Firestore");

        // Redirect based on role
        if (accountType === "admin") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "customer.html";
        }
    } catch (error) {
        console.error("Error during sign-in process:", error);
    }
});