class Auth {
    constructor() {
        this.baseUrl = 'https://learn.reboot01.com/api';
        this.jwt = localStorage.getItem('jwt');

        // Only setup event listeners if we're on the login page
        if (document.getElementById('loginForm')) {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    async handleLogin(e) {
        e.preventDefault();
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;

        try {
            // Create base64 encoded credentials
            const credentials = btoa(`${identifier}:${password}`);

            // Make POST request to signin endpoint with Basic authentication
            const response = await fetch(`${this.baseUrl}/auth/signin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (!response.ok) {
                throw new Error('Invalid credentials');
            }

            // Get the response text and clean it
            const token = await response.text();
            // Remove any whitespace and quotes
            this.jwt = token.replace(/['"]+/g, '').trim();
            localStorage.setItem('jwt', this.jwt);

            // Redirect to dashboard after successful login
            window.location.href = '/dashboard.html';

        } catch (error) {
            const errorMessage = document.getElementById('error-message');
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Invalid username/email or password';
        }
    }

    logout() {
        localStorage.removeItem('jwt');
        this.jwt = null;
        window.location.href = '/index.html';
    }

    isAuthenticated() {
        return !!this.jwt;
    }

    getToken() {
        if (!this.jwt) return null;
        // Clean the token and return with Bearer prefix
        const cleanToken = this.jwt.replace(/['"]+/g, '').trim();
        return `Bearer ${cleanToken}`;
    }
}

// Wait for DOM to be fully loaded before initializing Auth
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
}); 