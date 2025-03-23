import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAcv6e_eol5mUYfUJdQ0Oqh5tB0IrNOMus",
    authDomain: "holadup123.firebaseapp.com",
    projectId: "holadup123",
    storageBucket: "holadup123.firebasestorage.app",
    messagingSenderId: "1012681468829",
    appId: "1:1012681468829:web:fb9de3cdf51a1c67479d74"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Fetch items from Firestore (replacing Flask's /get_items)
async function fetchItems() {
    const itemsCollection = collection(db, "items");
    const itemsSnapshot = await getDocs(itemsCollection);
    
    const items = itemsSnapshot.docs.map(doc => {
        const itemData = doc.data();
        
        // Prepend the correct static path to the image filename
        itemData.image = `static/images/${itemData.image}`;
        
        return { ...itemData, id: doc.id };
    });
    
    console.log("Fetched items with updated image paths:", items);
    return items;
}


// Fetch offers from Firestore (replacing Flask's /get_offers)
async function fetchOffers() {
    const offersCollection = collection(db, "offers");
    const itemsCollection = collection(db, "items");

    // Fetch offers and items data
    const offersSnapshot = await getDocs(offersCollection);
    const itemsSnapshot = await getDocs(itemsCollection);

    // Map item images by name
    const itemImages = {};
    itemsSnapshot.docs.forEach(doc => {
        const item = doc.data();
        itemImages[item.itemname] = item.image;
    });

    // Merge offer data with item images
    const offers = offersSnapshot.docs.map(doc => {
        const offer = doc.data();
        offer.image = itemImages[offer.itemname] || "";  // Add image if available
        return offer;
    });

    console.log("Fetched offers with images:", offers);
    return offers;
}


// Show alert for login check before feedback
window.checkLoginBeforeFeedback = function () {
    onAuthStateChanged(auth, user => {
        if (user) {
            showAlert("success", "You are logged in! Redirecting to feedback section...");
            // Redirect to feedback section
            window.scrollToSection("feedback-section");
        } else {
            showAlert("info", "Please sign in to provide feedback.", "login.html");
        }
    });
};

// Example: Loading items and offers into the UI
(async function initializeApp() {
    try {
        // Fetch and load items
        const items = await fetchItems();
        // Fetch and load offers
        const offers = await fetchOffers();
    } catch (error) {
        console.error("Error initializing app:", error);
        showAlert("error", "Failed to load data. Please try again later.");
    }
})();

async function fetchItemsFromFirestore() {
    try {
        const db = getFirestore();  // Initialize Firestore
        const itemsCollection = collection(db, "items");  // Reference to the "items" collection
        const itemsSnapshot = await getDocs(itemsCollection);  // Fetch documents from Firestore

        // Convert Firestore snapshot to object format
        const items = {};
        itemsSnapshot.forEach(doc => {
            const itemData = doc.data();
            items[itemData.itemname] = {
                location: itemData.location,
                image: itemData.image,
            };
        });

        console.log("Items fetched from Firestore:", items);
        return items;  // Return the items as an object
    } catch (error) {
        console.error("Error fetching items from Firestore:", error);
        return {};
    }
}

// Initialize item locations dynamically
let itemLocations = {};

// Fetch data from Firestore
fetchItemsFromFirestore().then(data => {
    itemLocations = data;
});

window.scrollToSection = function(sectionId) {
    const shoppingListSection = document.getElementById(sectionId);

    if (shoppingListSection) {
        // Scroll smoothly to the shopping list section
        shoppingListSection.scrollIntoView({ behavior: "smooth", block: "start" });

        // Add a highlight border effect
        shoppingListSection.classList.add("focus-highlight");

        // Remove the effect after 2 seconds
        setTimeout(() => {
            shoppingListSection.classList.remove("focus-highlight");
        }, 3000);
    }
}

// Generate the racks dynamically
const map = document.getElementById("map");
for (let i = 1; i <= 4; i++) {
    const rack = document.createElement("div");
    rack.classList.add("rack");
    rack.id = `rack${i}`;

    for (let j = 1; j <= 50; j++) {
        const compartment = document.createElement("div");
        let compartmentNumber = j <= 25 ? j : 51 - (j - 25);
        compartment.textContent = compartmentNumber;
        compartment.id = `r${i}c${compartmentNumber}`;

        // Click event to show item pop-up from Firestore data
        compartment.addEventListener("click", () => {
            const item = Object.keys(itemLocations).find(
                key => itemLocations[key].location === `r${i}c${compartmentNumber}`
            );
            if (item) {
                showPopup(compartment, item);
            }
        });

        rack.appendChild(compartment);
    }

    map.appendChild(rack);
}

// Function to show item details on click
function showPopup(element, item) {
    if (searchBox) {
        searchBox.value = "";  // Clear search input
    }

    let popup = document.createElement("div");
    popup.classList.add("popup");

    const img = document.createElement("img");
    img.src = itemLocations[item].image;
    img.alt = item;

    const text = document.createElement("span");
    text.textContent = item;

    popup.appendChild(img);
    popup.appendChild(text);

    // Append to body instead of element to prevent layout shifts
    document.body.appendChild(popup);

    // Position the popup near the element
    let rect = element.getBoundingClientRect();
    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.style.top = `${rect.top + window.scrollY - popup.offsetHeight - 10}px`; // Above the element

    popup.style.display = "block";

    setTimeout(() => {
        popup.style.display = "none";
        popup.remove();

        // Scroll back to the top **AFTER** hiding the popup (3-second delay)
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }, 500);
    }, 3000);
}


// Search functionality
const searchButton = document.getElementById("search-button");
const searchBox = document.getElementById("search-box");
const suggestionsBox = document.getElementById("suggestions");

// Update suggestions from Firestore
searchBox.addEventListener("input", () => {
    const query = searchBox.value.toLowerCase();
    suggestionsBox.innerHTML = "";
    if (query) {
        const suggestions = Object.keys(itemLocations).filter(item => item.toLowerCase().includes(query));
        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement("div");
            suggestionItem.classList.add("suggestion-item");  // Ensure it has the class for event listener
            suggestionItem.style.display = "flex";
            suggestionItem.style.alignItems = "center";

            const img = document.createElement("img");
            img.src = itemLocations[suggestion].image;
            img.alt = suggestion;
            img.style.width = "30px";
            img.style.height = "30px";
            img.style.marginRight = "10px";

            const text = document.createElement("span");
            text.textContent = suggestion;

            suggestionItem.appendChild(img);
            suggestionItem.appendChild(text);

            suggestionsBox.appendChild(suggestionItem);
        });
    }
});

// Trigger search when a suggestion is clicked
suggestionsBox.addEventListener("click", (event) => {
    let selectedItem = event.target.closest(".suggestion-item")?.querySelector("span")?.textContent;
    if (selectedItem) {
        searchBox.value = selectedItem;  // Fill input box
        searchItem(selectedItem);        // Trigger search function
        suggestionsBox.innerHTML = "";   // Clear suggestions box
    }
});

searchBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        searchButton.click();
    }
});

searchButton.addEventListener("click", () => {
    searchItem(searchBox.value);
});

// Function to handle search
function searchItem(query) {
    if (itemLocations[query]) {
        const location = itemLocations[query].location;
        const compartment = document.getElementById(location);
        if (compartment) {
            // Remove previous highlights
            document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
            compartment.classList.add('highlight');

            // Scroll smoothly to the item location
            compartment.scrollIntoView({ behavior: "smooth", block: "center" });

            // Remove highlight after 5 seconds
            setTimeout(() => {
                compartment.classList.remove('highlight');

                // Scroll back to top AFTER highlight disappears (extra delay)
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }, 1000); // Adjust delay before scrolling back
            }, 5000);

            // Clear the search box
            searchBox.value = "";

            // Add item to cart (if applicable)
            addToCart(query);
        }
    } else {
        showAlert("error", "Item not found");
    }
}
// Populate `newItemLocations` with item data
let newItemLocations = {};
async function fetchItemsFromFirestoreForList() {
    try {
        const db = getFirestore();
        const itemsCollection = collection(db, "items");
        const itemsSnapshot = await getDocs(itemsCollection);

        itemsSnapshot.forEach(doc => {
            const item = doc.data();
            newItemLocations[item.itemname] = {
                rack: parseInt(item.location.split('r')[1].charAt(0)), // Extract rack number
                compartment: parseInt(item.location.split('c')[1]),    // Extract compartment number
                image: item.image,
                saleprice: item.saleprice,
            };
        });

        console.log("Items for cart:", newItemLocations);
    } catch (error) {
        console.error("Error fetching items for cart:", error);
    }
}

// Call the function to initialize item data
fetchItemsFromFirestoreForList();

const cartsearchBox = document.getElementById("shopping-list-input");
const searchsuggestionsBox = document.createElement("div");
searchsuggestionsBox.classList.add("searchsuggestions-box");
cartsearchBox.insertAdjacentElement("afterend", searchsuggestionsBox);
const shoppingList = document.getElementById("shopping-list-items");
const totalAmountContainer = document.getElementById("total-amount-container");

let totalAmount = 0;

function checkBudget() {
    const budget = parseFloat(document.getElementById("budget-input").value);
    const totalAmount = parseFloat(totalAmountContainer.textContent.replace("Total Amount: ₹", "").trim());
    if (totalAmount > budget) {
        showAlert("warning","You have exceeded your budget. Continue?")
    }
}

cartsearchBox.addEventListener("input", () => {
    const query = cartsearchBox.value.toLowerCase();
    searchsuggestionsBox.innerHTML = "";
    if (query) {
        const searchsuggestions = Object.keys(newItemLocations).filter(item => item.toLowerCase().includes(query));
        searchsuggestions.forEach(searchsuggestion => {
            const searchsuggestionItem = document.createElement("div");
            searchsuggestionItem.textContent = searchsuggestion;
            searchsuggestionItem.addEventListener("click", () => {
                addToCart(searchsuggestion);
                searchsuggestionsBox.innerHTML = "";
                cartsearchBox.value = ""; // Clear the search box after selection
            });
            searchsuggestionsBox.appendChild(searchsuggestionItem);
        });
    }
});

window.addToCart = function(itemName, quantity = null, isLoadedFromList = false) {
    const item = newItemLocations[itemName];
    const location = `r${item.rack}c${item.compartment}`;

    if (!isLoadedFromList) {
        // Manually added items should ask for quantity
        openQuantityDialog(itemName, (userQuantity) => {
            processItemAddition(itemName, location, userQuantity, item.saleprice);
        });
    } else {
        // Loaded from a saved list → Use predefined quantity
        processItemAddition(itemName, location, quantity, item.saleprice);
    }
    checkBudget();
};

function processItemAddition(itemName, location, quantity, saleprice) {
    const totalPrice = saleprice * quantity;

    const shoppingList = document.getElementById("shopping-list-items");
    if (!shoppingList) {
        console.error("Shopping list container not found!");
        return;
    }

    // Create list item
    const listItem = document.createElement("li");

    // Create quantity span
    const quantitySpan = document.createElement("span");
    quantitySpan.textContent = `Qty: ${quantity}`;
    quantitySpan.dataset.quantity = quantity;

    // Create total price span
    const totalPriceSpan = document.createElement("span");
    totalPriceSpan.classList.add("item-total");
    totalPriceSpan.textContent = ` ₹${totalPrice}`;

    // Create delete button (❌)
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.onclick = function () {
        listItem.remove(); // Remove item from list
        updateTotalAmount(); // Update total amount after deletion
    };

    // Append content to list item
    listItem.innerHTML = `${itemName} | ₹${saleprice} | ${location} `;
    listItem.appendChild(quantitySpan);
    listItem.appendChild(totalPriceSpan);
    listItem.appendChild(deleteBtn); // Add delete button

    // Append item to shopping list
    shoppingList.appendChild(listItem);

    // Update total amount
    updateTotalAmount();
}


// Function to update the total amount
function updateTotalAmount() {
    let total = 0;
    document.querySelectorAll(".item-total").forEach(item => {
        total += parseFloat(item.textContent.replace("₹", "").trim()) || 0;
    });
    totalAmountContainer.textContent = `Total Amount: ₹${total}`;
}



function openQuantityDialog(itemName, callback) {
    // Remove existing dialog if present
    const existingDialog = document.getElementById("quantity-dialog");
    if (existingDialog) existingDialog.remove();

    // Create dialog container
    const dialog = document.createElement("div");
    dialog.id = "quantity-dialog";
    dialog.innerHTML = `
        <div class="dialog-box">
            <h3>Select Quantity for ${itemName}</h3>
            <div class="quantity-controls">
                <button id="decrease-qty">-</button>
                <span id="selected-quantity">1</span>
                <button id="increase-qty">+</button>
            </div>
            <div class="dialog-buttons">
                <button id="confirm-qty">Confirm</button>
                <button id="close-qty-dialog">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    let selectedQuantity = 1; // Default quantity

    // Increase quantity
    document.getElementById("increase-qty").addEventListener("click", () => {
        selectedQuantity++;
        document.getElementById("selected-quantity").textContent = selectedQuantity;
    });

    // Decrease quantity (but keep it at min 1)
    document.getElementById("decrease-qty").addEventListener("click", () => {
        if (selectedQuantity > 1) {
            selectedQuantity--;
            document.getElementById("selected-quantity").textContent = selectedQuantity;
        }
    });

    // Confirm button - send the selected quantity back
    document.getElementById("confirm-qty").addEventListener("click", () => {
        callback(selectedQuantity);
        closeQuantityDialog();
        cartsearchBox.value = "";  
        searchsuggestionsBox.innerHTML = "";
    });

    // Close dialog
    document.getElementById("close-qty-dialog").addEventListener("click", closeQuantityDialog);
}

function closeQuantityDialog() {
    const dialog = document.getElementById("quantity-dialog");
    if (dialog) dialog.remove();
}

function updateItemTotal(listItem, salePrice) {
    const quantityInput = listItem.querySelector(".quantity-input");
    let quantity = parseInt(quantityInput.value);

    if (isNaN(quantity) || quantity <= 0) {
        quantity = 1;
        quantityInput.value = 1;
    }

    const itemTotal = listItem.querySelector(".item-total");
    itemTotal.textContent = `₹${salePrice * quantity}`;

    updateTotalAmount();
}

async function fetchOffersFromFirestore() {
    try {
        const db = getFirestore();  // Initialize Firestore
        const offersCollection = collection(db, "offers");
        const itemsCollection = collection(db, "items");

        // Fetch offers and items data
        const offersSnapshot = await getDocs(offersCollection);
        const itemsSnapshot = await getDocs(itemsCollection);

        // Map item images using item names
        const itemImages = {};
        itemsSnapshot.docs.forEach(doc => {
            const item = doc.data();
            itemImages[item.itemname] = item.image;
        });

        // Combine offer data with item images
        const offers = offersSnapshot.docs.map(doc => {
            const offer = doc.data();
            offer.image = itemImages[offer.itemname] || "";  // Add image if available
            return offer;
        });

        console.log("Fetched offers:", offers);
        return offers;
    } catch (error) {
        console.error("Error fetching offers from Firestore:", error);
        return [];
    }
}

// Load offers
async function loadOffers() {
    const offersContainer = document.querySelector(".offers-grid");
    offersContainer.innerHTML = ""; // Clear existing offers before adding new ones

    const offers = await fetchOffersFromFirestore();

    offers.forEach(offer => {
        const offerDiv = document.createElement("div");
        offerDiv.classList.add("offer");

        offerDiv.innerHTML = `
            <img src="${offer.image}" alt="${offer.itemname}">
            <span class="title">${offer.itemname}</span>
            <div class="price"><del>₹${offer.oldsaleprice}</del> ₹${offer.newsaleprice}</div>
            <button onclick="addToCart('${offer.itemname}')">Add to Cart</button>
        `;

        offersContainer.appendChild(offerDiv);
    });
}

loadOffers();
const checkoutButton = document.getElementById("checkout-button");
const checkoutModal = document.getElementById("checkout-modal");
const closeButton = document.querySelector(".close-button");
const sortedListContainer = document.getElementById("sorted-list-container");
const printBillButton = document.getElementById("print-bill-button");
const backToCartButton = document.getElementById("back-to-cart-button");

// Add the event listener
//printBillButton.addEventListener("click", printBill);
checkoutButton.addEventListener("click", checkout);
closeButton.addEventListener("click", () => (checkoutModal.style.display = "none"));
backToCartButton.addEventListener("click", () => (checkoutModal.style.display = "none"));

// Close modal when clicking outside of it
window.addEventListener("click", (event) => {
    if (event.target === checkoutModal) {
        checkoutModal.style.display = "none";
    }
});

function checkout() {
    const items = Array.from(document.querySelectorAll("#shopping-list-items li"));

    if (!items.length) {
        showAlert("info","Your Cart is Empty!. Please add Some Items Before Checkout");
        return;
    }

    // Prepare the data for the sorted shopping list
    const checkoutCart = items.map(item => {
        const itemText = item.textContent.trim(); // Get the full text content
        console.log("Item Text Content:", itemText); // Debugging line

        // Split the text content into parts using "|"
        const parts = itemText.split("|");
        console.log("Item Parts:", parts); // Debugging line

        // Ensure the parts array has at least 3 elements
        if (parts.length < 3) {
            console.error("Invalid item format:", itemText);
            return null; // Skip invalid items
        }

        // Extract item details
        const itemName = parts[0].trim(); // First part is the item name
        const salePrice = parseFloat(parts[1].replace("₹", "").trim()); // Second part is the sale price
        const location = parts[2].trim(); // Third part is the location
        const quantity = parseInt(item.querySelector("span").dataset.quantity || 1); // Get quantity from span
        const total = salePrice * quantity; // Calculate total price

        return {
            name: itemName,
            saleprice: salePrice,
            location: location,
            quantity: quantity,
            total: total,
        };
    }).filter(item => item !== null); // Filter out invalid items

    // Sort items based on location (r1c1, r1c2, etc.)
    checkoutCart.sort((a, b) => {
        const locA = a.location.match(/r(\d+)c(\d+)/);
        const locB = b.location.match(/r(\d+)c(\d+)/);

        if (locA && locB) {
            const rackA = parseInt(locA[1]);
            const rackB = parseInt(locB[1]);
            const compA = parseInt(locA[2]);
            const compB = parseInt(locB[2]);
            return rackA - rackB || compA - compB;
        }
        return 0;
    });

    // Display the sorted list in the popup modal
    displaySortedItems(checkoutCart);
}

function displaySortedItems(checkoutCart) {
    const sortedListContainer = document.getElementById("sorted-list-container");
    sortedListContainer.innerHTML = ""; // Clear previous content

    let totalAmount = 0;

    // Render sorted items
    checkoutCart.forEach(item => {
        const listItem = document.createElement("div");
        listItem.className = "sorted-item";

        // Reconstruct the location string with proper spacing
        const formattedLocation = `&nbsp; &nbsp; Location: ${item.location.split(" ")[0]} &nbsp; &nbsp; &nbsp; &nbsp;  Qty: ${item.quantity} &nbsp; &nbsp; &nbsp; &nbsp;  ₹${item.total}`;

        // Construct the list item with proper spacing
        listItem.innerHTML = `
            <span>${item.name}</span>
            <span>${formattedLocation}</span>
        `;
        sortedListContainer.appendChild(listItem);
        totalAmount += item.total;
    });

    // Display total amount
    const totalAmountElement = document.createElement("div");
    totalAmountElement.className = "total-amount";
    totalAmountElement.innerHTML = `<strong>Total Amount: ₹${totalAmount}</strong>`;
    sortedListContainer.appendChild(totalAmountElement);

    // Show the modal
    checkoutModal.style.display = "block";
}

// Print bill functionality
printBillButton.addEventListener("click", () => {
    const modalContent = document.getElementById("sorted-list-container").innerHTML;

    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
        <html>
            <head>
                <title>Print List</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h2 { text-align: center; }
                    .sorted-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ccc; }
                    .total-amount { text-align: right; margin-top: 20px; font-size: 1.2em; font-weight: bold; }
                    .bill-container { width: 80%; margin: auto; border: 1px solid #000; padding: 15px; }
                    .logo-container { text-align: center; margin-bottom: 15px; }
                    .logo { height: 60px; border-radius: 50%; }
                    .project-name { font-family: 'Poppins', sans-serif; color: #000; font-size: 24px; font-weight: bold; margin-top: 5px; }
                </style>
            </head>
            <body>
                <div class="logo-container">
                    <img src="../static/images/logo.png" alt="Project Logo" class="logo">
                    <h2 class="project-name">GRAB & GO</h2>
                </div>
                <div class="bill-container">
                    <h2>Sorted Shopping List</h2>
                    ${modalContent}
                </div>
                <script>
                    document.addEventListener("DOMContentLoaded", function() {
                        window.print();
                    });
                </script>
            </body>
        </html>
    `);
    printWindow.document.close(); // Ensure content is loaded
    printWindow.focus(); // Focus the new window

    // Ensure the print function runs after the window is fully loaded
    printWindow.onload = function () {
        printWindow.print();
        printWindow.onafterprint = function () {
            printWindow.close();
        };
    };
});

let resetTimeout;

// Function to clear the cart
function resetCart() {
    showAlert("warning","Session expired! Your cart has been reset.");
    document.getElementById("shopping-list-items").innerHTML = ""; // Clear cart UI
    document.getElementById("total-amount-container").textContent = "Total Amount: ₹0"; // Reset total amount
    localStorage.removeItem("checkoutCart"); // Clear localStorage
}

// Function to restart the timeout on user activity
function restartTimeout() {
    clearTimeout(resetTimeout);
    resetTimeout = setTimeout(resetCart, 60000);
}

// Start the timeout when the page loads
document.addEventListener("DOMContentLoaded", () => {
    restartTimeout();
});

// Restart timeout on user activity
document.addEventListener("click", restartTimeout);
document.addEventListener("keypress", restartTimeout);
document.addEventListener("mousemove", restartTimeout);

const clearCartButton = document.getElementById("clear-cart-button");

clearCartButton.addEventListener("click", clearCart);

function clearCart() {
    const shoppingList = document.getElementById("shopping-list-items");
    showAlert("success","Cart Cleared Successfully","#");
    // Clear the UI
    shoppingList.innerHTML = "";
    // Clear data in localStorage
    localStorage.removeItem("cartData");
    localStorage.removeItem("checkoutCart");

    // Reset total amount
    document.getElementById("total-amount-container").textContent = "Total Amount: ₹0";

    // Reload the page
    // location.reload();
}

window.checkLoginBeforeFeedback=function() {
    showAlert("info","Please Sign-In to Provide the Feedback","../../login.html");
}

window.showAlert = function(ico,message, redirectUrl) {
    Swal.fire({
        icon: ico,  // You can change this based on the scenario
        text: message,
        confirmButtonText: 'OK'
    }).then(() => {
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
    });
}

