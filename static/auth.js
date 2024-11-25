let auth0Client;

// Initialize Auth0 client
const initializeAuth0 = async () => {
    try {
        console.log("Initializing Auth0...");
        auth0Client = await createAuth0Client({
            domain: "dev-txal0zdxum5np65h.us.auth0.com",
            client_id: "wJrsVXMV1XZjiiUGfanHjyU6oPYvhOpn",
            redirect_uri: window.location.origin + "http://192.168.1.12:5000/callback" // Specify the callback URL after login
        });
        console.log("Auth0 initialized.");
    } catch (error) {
        console.error("Error initializing Auth0:", error);
    }
};

// Handle login with Auth0
const login = async () => {
    if (!auth0Client) {
        console.error("Auth0 client is not initialized.");
        return;
    }

    try {
        console.log("Redirecting to Auth0 login...");
        await auth0Client.loginWithRedirect({
            redirect_uri: window.location.origin + "http://192.168.1.12:5000/callback"
        });
    } catch (error) {
        console.error("Error during login:", error);
    }
};

// Check if redirected after login
const handleRedirectCallback = async () => {
    try {
        const result = await auth0Client.handleRedirectCallback();
        console.log(result);
        window.location.replace('/'); // Redirect to home after successful login
    } catch (error) {
        console.error("Error handling redirect callback:", error);
    }
};

// Check if the user is authenticated
const updateUI = async () => {
    try {
        const user = await auth0Client.getUser();
        const authButton = document.getElementById('authLoginButton');

        if (user) {
            // Logged in user: change UI (you can show user info here)
            authButton.innerText = 'Logged In';
            // Optionally, display user info (e.g., email)
            console.log('User:', user);
        } else {
            // Not logged in: show login button
            authButton.innerText = 'Log in with Auth0';
        }
    } catch (error) {
        console.error("Error updating UI:", error);
    }
};

// Set up Auth0 login button
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeAuth0(); // Ensure Auth0 is initialized before interacting with it

        // Check if the user was redirected back after login
        if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
            await handleRedirectCallback();
        } else {
            await updateUI();
        }

        // Handle Auth0 login button click
        const authLoginButton = document.getElementById('authLoginButton');
        if (authLoginButton) {
            authLoginButton.addEventListener('click', login);
        } else {
            console.error("Auth0 login button not found.");
        }
    } catch (error) {
        console.error("Error during DOM content loaded:", error);
    }
});
