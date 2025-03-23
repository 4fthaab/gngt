const firebaseConfig = {
    apiKey: "AIzaSyAcv6e_eol5mUYfUJdQ0Oqh5tB0IrNOMus",
    authDomain: "holadup123.firebaseapp.com",
    projectId: "holadup123",
    storageBucket: "holadup123.firebasestorage.app",
    messagingSenderId: "1012681468829",
    appId: "1:1012681468829:web:fb9de3cdf51a1c67479d74"
};

// Initialize Firebase (v8 method)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function () {
    fetchReviews(); // Automatically fetch reviews when the page loads
});

window.scrollToSection = function (sectionId) {
    const shoppingListSection = document.getElementById(sectionId);
    
    if (shoppingListSection) {
        const navbarHeight = document.querySelector(".navbar")?.offsetHeight || 50; // Adjust based on navbar size

        const sectionTop = shoppingListSection.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = sectionTop - navbarHeight - 10; // Adjust the `-10` if needed
        
        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
        });
        // Highlight effect
        shoppingListSection.classList.add("focus-highlight");
        setTimeout(() => {
            shoppingListSection.classList.remove("focus-highlight");
        }, 3000);
    } else {
        console.error(`Element with ID '${sectionId}' not found!`);
    }
};

// Search Functionality
const searchInput = document.querySelector('.search-bar input');
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.review-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(term) ? 'block' : 'none';
    });
});

window.toggleSection = function toggleSection(section) {
    const selectedSection = document.getElementById(`${section}-section`);
    
    // Check if the selected section is already visible
    if (selectedSection && !selectedSection.classList.contains("hidden")) {
        // If visible, hide it
        selectedSection.classList.add("hidden");
    } else {
        // Hide all sections
        document.querySelectorAll(".database-container div, .offers-container div").forEach(div => {
            div.classList.add("hidden");
        });

        // Show the selected section
        if (selectedSection) {
            selectedSection.classList.remove("hidden");
        }
    }
};

document.getElementById("googleLogin").addEventListener("click", function () {
    const provider = new firebase.auth.GoogleAuthProvider();

    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            console.log("User signed in:", user);

            const userEmail = user.email;
            const userName = user.displayName;
            const adminEmails = ["afthabrahman0808@gmail.com", "supermgenie@gmail.com"];
            const accountType = adminEmails.includes(userEmail) ? "admin" : "customer";

            const db = firebase.firestore();
            const userDocId = userEmail.replace(/[@.]/g, "_");
            const userDocRef = db.collection("users").doc(userDocId);

            userDocRef.set({
                mailid: userEmail,
                name: userName,
                account_type: accountType
            }, { merge: true }).then(() => {
                console.log("User stored/updated in Firestore");

                // ✅ Send login data to Flask for session storage
                fetch("/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: userEmail, name: userName })
                }).then(response => response.json()).then(data => {
                    console.log("Login Response:", data);
                    if (data.account_type === "admin") {
                        window.location.href = "/admin";  // Use Flask route
                    } else {
                        window.location.href = "/customer"; // Redirect customers
                    }
                });
            });

        }).catch(error => {
            console.error("Login Failed: ", error.message);
        });
});

function toggleSection(section) {
    // Hide all sections
    document.querySelectorAll(".database-container div, .offers-container div").forEach(div => {
        div.classList.add("hidden");
    });

    // Show the selected section
    const selectedSection = document.getElementById(`${section}-section`);
    if (selectedSection) {
        selectedSection.classList.remove("hidden");
    }
}

// Add a click event listener to the document
let clickCount = 0;
document.addEventListener('click', function(event) {
    const adminContainer = document.querySelector('.admin-container');
    
    // Check if the click is outside the admin-container
    if (!adminContainer.contains(event.target)) {
        clickCount++;
        
        // If clicked twice outside, hide all sections
        if (clickCount === 3) {
            document.querySelectorAll(".database-container div, .offers-container div").forEach(div => {
                div.classList.add("hidden");
            });
            clickCount = 0; // Reset the click count
        }
    } else {
        clickCount = 0; // Reset the click count if clicked inside the admin-container
    }
});

async function insertItem() {
    const name = document.getElementById("insert-name").value.trim();
    const mrp = Number(document.getElementById("insert-mrp").value);
    const sale = Number(document.getElementById("insert-sale").value);
    const location = document.getElementById("insert-location").value.trim();
    const image = document.getElementById("insert-image").value.trim();

    if (!name || !mrp || !sale || !location || !image) {
        alert("Please fill all fields!");
        return;
    }

    try {
        // Insert or Update Item (Using itemname as document ID)
        await db.collection("items").doc(name).set({
            itemname: name,
            mrp: mrp,
            saleprice: sale,
            location: location,
            image: image
        });

        alert("Item inserted/updated successfully!");

        // Clear input fields after insertion
        document.getElementById("insert-name").value = "";
        document.getElementById("insert-mrp").value = "";
        document.getElementById("insert-sale").value = "";
        document.getElementById("insert-location").value = "";
        document.getElementById("insert-image").value = "";

    } catch (error) {
        console.error("Error inserting/updating item:", error);
        alert("Failed to insert/update item.");
    }
}


async function fetchSuggestions(value, type) {
    let suggestionsDiv = document.getElementById(`${type}-suggestions`);

    if (!value.trim()) {
        suggestionsDiv.innerHTML = "";
        suggestionsDiv.classList.add("hidden"); // Hide if no input
        return;
    }

    try {
        const querySnapshot = await db.collection("items").get();
        console.log("Firestore Query Result:", querySnapshot.size); // 🔍 Debugging Step

        let suggestions = "";

        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.itemname.toLowerCase().includes(value.toLowerCase())) {
                if (type === 'delete') {
                    suggestions += `<div onclick="fillDeleteDetails('${doc.id}', '${data.itemname}', '${data.mrp}', '${data.saleprice}', '${data.location}', '${data.image}')">${data.itemname}</div>`;
                } else {
                    suggestions += `<div onclick="fillDetails('${doc.id}', '${data.itemname}', '${data.mrp}', '${data.saleprice}', '${data.location}', '${data.image}', '${type}')">${data.itemname}</div>`;
                }
            }
        });

        suggestionsDiv.innerHTML = suggestions;
        console.log("Generated Suggestions:", suggestions); // 🔍 Debugging Step

        if (suggestions.trim() !== "") {
            suggestionsDiv.classList.remove("hidden");  // ✅ Show suggestions
            suggestionsDiv.style.height = "auto";
            suggestionsDiv.style.opacity = "1";
            suggestionsDiv.style.visibility = "visible";
        } else {
            suggestionsDiv.classList.add("hidden");  // Hide if empty
        }
    } catch (error) {
        console.error("Error fetching suggestions:", error);
    }
}

function fillDetails(id, name, mrp, sale, location, image, type) {
    document.getElementById(`${type}-name`).value = name;
    document.getElementById(`${type}-mrp`).value = mrp;
    document.getElementById(`${type}-sale`).value = sale;
    document.getElementById(`${type}-location`).value = location;
    document.getElementById(`${type}-image`).value = image;
    document.getElementById(`${type}-name`).setAttribute("data-id", id);

    // Hide suggestions after selection
    document.getElementById(`${type}-suggestions`).innerHTML = "";
}


async function updateItem() {
    const id = document.getElementById("update-name").getAttribute("data-id");

    if (!id) {
        alert("Please select a valid item from the suggestions!");
        return;
    }

    const updatedName = document.getElementById("update-name").value.trim();
    const updatedMRP = Number(document.getElementById("update-mrp").value);
    const updatedSalePrice = Number(document.getElementById("update-sale").value);
    const updatedLocation = document.getElementById("update-location").value.trim();
    const updatedImage = document.getElementById("update-image").value.trim();

    if (!updatedName || !updatedMRP || !updatedSalePrice || !updatedLocation || !updatedImage) {
        alert("Please fill all fields!");
        return;
    }

    try {
        await db.collection("items").doc(id).update({
            itemname: updatedName,
            mrp: updatedMRP,
            saleprice: updatedSalePrice,
            location: updatedLocation,
            image: updatedImage
        });

        alert("Item Updated Successfully!");
    } catch (error) {
        console.error("Error updating item:", error);
        alert("Failed to update item.");
    }
}

function fillDeleteDetails(itemId, itemName, mrp, salePrice, location, image) {
    document.getElementById("delete-name").value = itemName;
    document.getElementById("delete-name").dataset.id = itemId; // Store item ID for deletion

    document.getElementById("delete-mrp").value = mrp;
    document.getElementById("delete-sale").value = salePrice;
    document.getElementById("delete-location").value = location;
    document.getElementById("delete-image").value = image;

    document.getElementById("delete-suggestions").innerHTML = ""; // Clear suggestions
}

// Delete Item from "items"
async function deleteItem() {
    const deleteInput = document.getElementById("delete-name");
    const itemId = deleteInput.dataset.id; // Retrieve stored item ID

    if (!itemId) {
        alert("Please select an item to delete.");
        return;
    }

    try {
        await db.collection("items").doc(itemId).delete();
        alert("Item deleted successfully!");

        // Clear input and stored ID after deletion
        deleteInput.value = "";
        deleteInput.removeAttribute("data-id");

        // Clear details fields
        document.getElementById("delete-mrp").value = "";
        document.getElementById("delete-sale").value = "";
        document.getElementById("delete-location").value = "";
        document.getElementById("delete-image").value = "";

        document.getElementById("delete-suggestions").innerHTML = "";
    } catch (error) {
        console.error("Error deleting item:", error);
        alert("Failed to delete item. Check console for details.");
    }
}
//DONE TILL HERE ITEMS MANIPULATION

async function fetchOfferSuggestions(value) {
    if (!value.trim()) {
        document.getElementById("offer-suggestions").innerHTML = "";
        return;
    }

    try {
        const querySnapshot = await db.collection("items").get();
        console.log("Firestore Query Result:", querySnapshot.size); // 🔍 Check if data is coming

        let suggestions = "";

        querySnapshot.forEach(doc => {
            const data = doc.data();
            console.log("Checking Item:", data.itemname); // 🔍 Log each item
            if (data.itemname.toLowerCase().includes(value.toLowerCase())) {
                suggestions += `<div onclick="fillOfferDetails('${doc.id}', '${data.itemname}', '${data.saleprice}')">${data.itemname}</div>`;
            }
        });

        console.log("Generated Suggestions:", suggestions); // 🔍 Check final output

        const suggestionsDiv = document.getElementById("offer-suggestions");
        suggestionsDiv.innerHTML = suggestions;

        // Ensure the suggestion box is visible
        if (suggestions.trim() !== "") {
            suggestionsDiv.classList.remove("hidden");
            suggestionsDiv.style.display = "block"; // Make sure it appears
        } else {
            suggestionsDiv.classList.add("hidden");
        }

    } catch (error) {
        console.error("Error fetching suggestions:", error);
    }
}


function fillOfferDetails(docId, itemName, oldSalePrice) {
    document.getElementById("offer-name").value = itemName;
    document.getElementById("offer-oldsale").value = oldSalePrice;
    document.getElementById("offer-suggestions").innerHTML = ""; // Hide suggestions
}

async function insertOffer() {
    const itemName = document.getElementById("offer-name").value.trim();
    const oldSalePrice = document.getElementById("offer-oldsale").value;
    const newSalePrice = document.getElementById("offer-newsale").value;

    if (!itemName || !newSalePrice) {
        alert("Please select an item and enter a new sale price.");
        return;
    }

    try {
        // Insert or Update Offer (Using itemname as document ID)
        await db.collection("offers").doc(itemName).set({
            itemname: itemName,
            oldsaleprice: oldSalePrice,
            newsaleprice: newSalePrice
        }, { merge: true });

        // Update the saleprice in 'items' collection
        const itemRef = await db.collection("items").where("itemname", "==", itemName).get();
        itemRef.forEach(async (doc) => {
            await db.collection("items").doc(doc.id).update({
                saleprice: newSalePrice
            });
        });

        alert("Offer inserted/updated successfully!");
        document.getElementById("offer-name").value = "";
        document.getElementById("offer-oldsale").value = "";
        document.getElementById("offer-newsale").value = "";
    } catch (error) {
        console.error("Error inserting/updating offer:", error);
        alert("Failed to insert/update offer.");
    }
}

async function fetchOfferDeleteSuggestions(value) {
    if (!value.trim()) {
        document.getElementById("delete-offer-suggestions").innerHTML = "";
        document.getElementById("delete-offer-suggestions").classList.add("hidden");
        return;
    }

    try {
        const querySnapshot = await db.collection("offers").get();
        let suggestions = "";

        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.itemname.toLowerCase().includes(value.toLowerCase())) {
                suggestions += `<div onclick="fillDeleteOfferDetails('${doc.id}', '${data.itemname}', '${data.oldsaleprice}', '${data.newsaleprice}')">${data.itemname}</div>`;
            }
        });

        document.getElementById("delete-offer-suggestions").innerHTML = suggestions;

        // 🔹 Show the suggestion box if there are results
        if (suggestions.trim() !== "") {
            document.getElementById("delete-offer-suggestions").classList.remove("hidden");
            document.getElementById("delete-offer-suggestions").style.display = "block";
        } else {
            document.getElementById("delete-offer-suggestions").classList.add("hidden");
        }

    } catch (error) {
        console.error("Error fetching offer suggestions:", error);
    }
}


// Auto-Fill New Sale Price
function fillDeleteOfferDetails(docId, itemName, oldSalePrice, newSalePrice) {
    document.getElementById("delete-offer-name").value = itemName;
    document.getElementById("delete-offer-name").dataset.id = docId; // Store Offer ID
    document.getElementById("delete-offer-name").dataset.oldprice = oldSalePrice; // Store old price
    document.getElementById("delete-new-saleprice").value = newSalePrice; // Show new sale price (readonly)
    document.getElementById("delete-offer-suggestions").innerHTML = ""; // Clear suggestions
}

// Delete Offer & Restore Old Sale Price
async function deleteOffer() {
    const offerInput = document.getElementById("delete-offer-name");
    const offerId = offerInput.dataset.id; // Retrieve stored Offer ID
    const itemName = offerInput.value;
    const oldSalePrice = offerInput.dataset.oldprice; // Retrieve stored old sale price

    if (!offerId || !itemName || !oldSalePrice) {
        alert("Please select a valid offer to delete.");
        return;
    }

    try {
        // Restore Old Sale Price in 'items' collection
        const itemQuery = await db.collection("items").where("itemname", "==", itemName).get();
        if (!itemQuery.empty) {
            const itemDoc = itemQuery.docs[0].id;
            await db.collection("items").doc(itemDoc).update({ saleprice: oldSalePrice });
        }

        // Delete the offer from 'offers' collection
        await db.collection("offers").doc(offerId).delete();

        alert("Offer deleted & old price restored!");

        // Clear fields after deletion
        offerInput.value = "";
        offerInput.removeAttribute("data-id");
        offerInput.removeAttribute("data-oldprice");
        document.getElementById("delete-new-saleprice").value = "";
        document.getElementById("delete-offer-suggestions").innerHTML = "";
    } catch (error) {
        console.error("Error deleting offer:", error);
        alert("Failed to delete offer. Check console for details.");
    }
}

function clearSectionInputs(section) {
    const sectionDiv = document.getElementById(`${section}-section`);
    if (!sectionDiv) return;

    // Select all input fields inside the section and clear them
    sectionDiv.querySelectorAll("input").forEach(input => {
        if (input.type !== "button") input.value = "";
    });

    // Also clear stored data attributes
    const nameInput = document.getElementById(`${section}-name`) || document.getElementById(`${section}-offer-name`);
    if (nameInput) {
        nameInput.removeAttribute("data-id");
        nameInput.removeAttribute("data-oldprice");
    }
}

async function fetchReviews() {
    console.log("Fetching reviews..."); // Debugging log
    const reviewsContainer = document.querySelector('.review-grid');
    reviewsContainer.innerHTML = '<div class="loading">Loading Reviews...</div>'; // Show loading

    try {
        const reviewsSnapshot = await db.collection("reviews").get();
        console.log("Reviews fetched:", reviewsSnapshot.size); // Debugging log

        reviewsContainer.innerHTML = ''; // Clear loading text

        if (reviewsSnapshot.empty) {
            reviewsContainer.innerHTML = '<p>No reviews found.</p>';
            return;
        }

        reviewsSnapshot.forEach(doc => {
            const review = doc.data();
            console.log(review); // Debugging log

            const reviewCard = `
            <div class="review-card">
                <img src="${review.profilepicture || 'https://ui-avatars.com/api/?name=' + review.name}" 
                     alt="${review.name}" class="user-avatar">
                <div class="review-content">
                    <h2>${review.name}</h2>
                    <a href="mailto:${review.mailid}" class="user-email">${review.mailid}</a>
                    <p class="review-text">"${review.feedbacks}"</p>
                    <div class="ratings">
                        <span>Service: ${'⭐'.repeat(review.service)}</span><br>
                        <span>Website: ${'⭐'.repeat(review.website)}</span><br>
                        <span>Overall: ${'⭐'.repeat(review.overall)}</span><br>
                    </div>
                    <button class="delete-review-btn" onclick="deleteReview('${review.mailid}')">❌ Delete Review</button>
                </div>
            </div>
        `;
            reviewsContainer.innerHTML += reviewCard;
        });
    } catch (error) {
        reviewsContainer.innerHTML = '<p>Error fetching reviews. Please try again later.</p>';
        console.error("Error fetching reviews: ", error);
    }
}

async function deleteReview(mailid) {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
        const querySnapshot = await db.collection("reviews").where("mailid", "==", mailid).get();

        if (querySnapshot.empty) {
            alert("Review not found!");
            return;
        }

        // ✅ Wait for all deletions to complete
        const deletePromises = querySnapshot.docs.map(doc => db.collection("reviews").doc(doc.id).delete());
        await Promise.all(deletePromises);

        // ✅ Reload reviews after deletion
        fetchReviews();
    } catch (error) {
        console.error("Error deleting review:", error);
        alert("Failed to delete review. Please try again.");
    }
}


document.querySelectorAll('.review-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

function logout() {
    // Clear stored user data
    localStorage.removeItem("user");
    sessionStorage.clear();

    // Optional: If using Firebase Authentication
    if (firebase?.auth) {
        firebase.auth().signOut().then(() => {
            console.log("User signed out from Firebase.");
        }).catch((error) => {
            console.error("Firebase logout error:", error);
        });
    }

    // Notify Flask backend to log out (if session-based auth is used)
    fetch("/logout", {
        method: "POST",
        credentials: "include"  // Ensures cookies (session) are included
    })
    .then(response => {
        if (response.ok) {
            console.log("Logged out from Flask session.");
        } else {
            console.error("Flask logout failed.");
        }
    })
    .catch(error => console.error("Logout request error:", error))
    .finally(() => {
        // Redirect to home page
        window.location.href = "/";
    });
}
