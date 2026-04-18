const form = document.getElementById("register-f");

function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve("");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const fileInput = document.getElementById("profile");
    const file = fileInput.files[0];
    let users = JSON.parse(localStorage.getItem("users")) || [];

    if (!username || !email || !password) {
        toast("Please fill all fields");
        return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
        toast("Invalid email");
        return;
    }

    if (password.length < 6) {
        toast("Password must be at least 6 characters");
        return;
    }

    if (users.some(u => u.email === email)) {
        toast("Email already exists");
        return;
    }

    let avatarUrl = "";
    if (file) {
        avatarUrl = await fileToDataUrl(file);
    }

    const newUser = {
        id: "user_" + Date.now(),
        username,
        email,
        password,
        bio: "",
        avatarUrl,
        bannerUrl: "",
        followers: [],
        following: []
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    toast("Account created!");

    setTimeout(() => {
        window.location.href = "login.html";
    }, 700);
});