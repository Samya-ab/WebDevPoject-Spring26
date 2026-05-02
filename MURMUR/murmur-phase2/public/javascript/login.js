// @ts-nocheck
const form = document.getElementById("login-f");

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = form.querySelector("input[type='email']").value.trim();
    const password = form.querySelector("input[type='password']").value.trim();


    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            document.getElementById("error-msg").style.display = "block";
            return;
        }

        localStorage.setItem("currentUserId", data.userId);

        //Directing to feed page:
        window.location.href = "feed.html";

    } catch (error) {
        console.error('Login error:', error);
        document.getElementById("error-msg").style.display = "block";
    }
});