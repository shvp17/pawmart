document.addEventListener("DOMContentLoaded", function () {
    checkDarkModePreference();
            function checkDarkModePreference() {
            const darkModeSaved = sessionStorage.getItem('darkMode');
            const icon = document.querySelector('.dark-mode-toggle i');
            if (darkModeSaved === 'true') {
                document.body.classList.add('dark-mode');
                icon.className = 'fas fa-sun';
            } else {
                document.body.classList.remove('dark-mode');
                icon.className = 'fas fa-moon';
            }
        }
    const accountLink = document.getElementById("accountLink");
    const logoutLink = document.getElementById("logoutLink");
    const accountDropdown = document.getElementById("accountDropdown");
    const cartCountElem = document.getElementById("cartCount");

    // Current user's cart status (in-memory, for minor UI synchronization)
    let cartItems = [];
    let cartCount = 0;

    // Read current user
    function getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem("currentUser")) || null;
        } catch {
            return null;
        }
    }

    // Read login status
    function isLoggedIn() {
        return (
            localStorage.getItem("isLoggedIn") === "true" ||
            sessionStorage.getItem("isLoggedIn") === "true"
        );
    }

    // Read and calculate user cart (by total item count)
    function loadUserCart() {
        const user = getCurrentUser();
        if (user && isLoggedIn()) {
            const cartKey = `cart_${user.email}`;
            try {
                cartItems = JSON.parse(localStorage.getItem(cartKey) || "[]");
            } catch {
                cartItems = [];
            }
            cartCount = cartItems.reduce((t, it) => t + (it.quantity || 1), 0);
        } else {
            cartItems = [];
            cartCount = 0;
        }
    }

    // Update cart display (ensure synchronization with other pages)
    function updateCartDisplay() {
        if (!cartCountElem) return;        // Error handling: some pages may not have the badge
        loadUserCart();                    // Key: read the latest storage first, then display
        cartCountElem.textContent = String(cartCount);
    }
    window.updateCartDisplay = updateCartDisplay; 

    // Update account dropdown/button
    function updateAccountUI() {
        if (!accountLink || !accountDropdown) return; // Error handling

        const user = getCurrentUser();
        const loggedIn = isLoggedIn();

        if (user && loggedIn) {
            const displayName = user.firstName?.trim() || user.lastName?.trim() || user.email || "Account";
            accountLink.textContent = displayName;
            accountLink.classList.add("dropdown-toggle");
            accountDropdown.hidden = false;
            accountDropdown.style.pointerEvents = "auto";

            accountLink.onclick = function (e) {
                e.preventDefault();
                accountDropdown.classList.toggle("show");
            };

            if (logoutLink) {
                logoutLink.onclick = function (e) {
                    e.preventDefault();
                    // Clear currentUser on logout
                    localStorage.removeItem("currentUser");

                    localStorage.setItem("isLoggedIn", "false");
                    sessionStorage.setItem("isLoggedIn", "false");

                    cartItems = [];
                    cartCount = 0;
                    updateCartDisplay();
                    updateAccountUI();
                    alert("You have logged out.");
                    window.location.href = "index.html";
                };
            }
        } else {
            accountLink.textContent = "Account";
            accountLink.classList.remove("dropdown-toggle");
            accountDropdown.classList.remove("show");
            accountDropdown.hidden = true;
            accountDropdown.style.pointerEvents = "none";

            accountLink.onclick = function () {
                window.location.href = "login.html";
            };

            if (logoutLink) logoutLink.onclick = null;
        }
    }

    // Click outside to close dropdown
    document.addEventListener("click", function (e) {
        if (!accountLink || !accountDropdown) return;
        if (!accountLink.contains(e.target) && !accountDropdown.contains(e.target)) {
            accountDropdown.classList.remove("show");
        }
    });

    // Add to cart (called by homepage/category page buttons)
    function addToCart(productId, productName, price, img) {
        const user = JSON.parse(localStorage.getItem("currentUser"));
        const loggedIn = localStorage.getItem("isLoggedIn") === "true" ||
            sessionStorage.getItem("isLoggedIn") === "true";
        if (!user || !loggedIn) {
            alert("Please login first!");
            window.location.href = "login.html";
            return;
        }

        // Price must be a number
        const numericPrice = Number(price);
        if (!Number.isFinite(numericPrice)) {
            console.warn("[addToCart] price is invalid or missing, defaulting to 0:", price, productName);
        }

        const cartKey = `cart_${user.email}`;
        const userCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
        const idx = userCart.findIndex(i => i.id === productId);

        if (idx !== -1) {
            userCart[idx].quantity = (userCart[idx].quantity || 1) + 1;
        } else {
            userCart.push({
                id: productId,
                name: productName,
                price: Number.isFinite(numericPrice) ? numericPrice : 0,
                img: img || "images/placeholder.jpg",
                quantity: 1,
                timestamp: new Date().toISOString()
            });
        }

        localStorage.setItem(cartKey, JSON.stringify(userCart));
        // Refresh badge
        const count = userCart.reduce((t, it) => t + (it.quantity || 1), 0);
        const badge = document.getElementById("cartCount");
        if (badge) badge.textContent = String(count);
        alert(`${productName} added to cart!`);
    }


    // Open cart
    function toggleCart() {
        const user = getCurrentUser();
        if (!user || !isLoggedIn()) {
            alert("Please login first!");
            window.location.href = "login.html";
            return;
        }

        // Directly jump to cart page and interrupt function (avoid subsequent code execution)
        window.location.href = "cart.html";
        return;
    }

    // Listen for storage events: when other tabs/pages update cart or login status, synchronize badge and account area
    window.addEventListener("storage", function (e) {
        // As long as there is a change, refresh the UI (lightweight operation: internal fault tolerance/re-reading)
        if (!e) return;
        updateCartDisplay();
        updateAccountUI();
    });

    // Initialize
    loadUserCart();
    updateCartDisplay();
    updateAccountUI();

    // Expose to global (for HTML button onclick calls)
    window.addToCart = addToCart;
    window.toggleCart = toggleCart;
});
