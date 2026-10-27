const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cookieParser());

let userBalance = 1000;
const SECRET_CSRF_TOKEN = "super_secure_token_xyz";

// Session Cookie Middleware
app.use((req, res, next) => {
    // Chrome/Edge/Firefox me cross-site delivery ke liye SameSite settings:
    res.cookie('session_id', 'authenticated_user_123', { 
        httpOnly: true,
        sameSite: 'lax' // Lax top-level navigation (window.location.href) me cookie bhejta hai
    });
    next();
});

app.get('/transfer', (req, res) => {
    console.log("Cookies received:", req.cookies); // Debugging line

    if (req.cookies.session_id === 'authenticated_user_123') {
        
        // ==========================================
        // MITIGATION (UNCOMMENT TO SECURE)
        // ==========================================
        
        const providedToken = req.query.csrf_token;
        if (providedToken !== SECRET_CSRF_TOKEN) {
            console.log(`[SECURE] Blocked CSRF attempt! Missing or invalid token.`);
            return res.status(403).send('CSRF Token Validation Failed');
        }
        
        // ==========================================

        const amount = parseInt(req.query.amount) || 0;
        const to = req.query.to || 'unknown';
        userBalance -= amount;
        
        console.log(`[VULNERABLE] Transferred $${amount} to ${to}. New balance: $${userBalance}`);
        res.send(`Successfully transferred $${amount} to ${to}. New balance: $${userBalance}`);
    } else {
        console.log('[DENIED] Request blocked: Missing or invalid session cookie.');
        res.status(401).send('Unauthorized: Session cookie missing');
    }
});

app.listen(3000, () => console.log('Bank server running on http://localhost:3000'));