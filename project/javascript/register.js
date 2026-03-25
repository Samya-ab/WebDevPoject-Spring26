const form = document.getElementById("register-f");

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    let users = JSON.parse(localStorage.getItem("users")) || [];

    // Validation for a new user register
    if (!username || !email || !password) {
        alert("Please fill all fields");
        return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
        alert("Invalid email");
        return;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    if (users.some(u => u.email === email)) {
        alert("Email already exists");
        return;
    }

    const newUser = {
        id: "user_" + Date.now(),
        username,
        email,
        password,
        bio: "",
        avatarUrl: "",
        bannerUrl: "",
        followers: [],
        following: []
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    alert("Account created!");

    window.location.href = "login.html";
});