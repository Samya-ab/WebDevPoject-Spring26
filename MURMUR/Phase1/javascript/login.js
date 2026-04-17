const form = document.getElementById("login-f");

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const email = form.querySelector("input[type='email']").value.trim();
    const password = form.querySelector("input[type='password']").value.trim();

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        document.getElementById("error-msg").style.display = "block";
        return;
    }

    // Save session
    localStorage.setItem("session", JSON.stringify({ userId: user.id }));

    // Go to feed
    window.location.href = "feed.html";
});