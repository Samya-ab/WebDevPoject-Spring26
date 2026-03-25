document.addEventListener('DOMContentLoaded',()=>{
    const form= document.getElementById('register-form');
    const error1=document.getElementById('error-message');

    form.addEventListener('submit',async(e) =>{
        e.preventDefault();
        error1.classList.add('hidden');

        const username=document.getElementById('username').value.trim();

        const email=document.getElementById('email').value.trim();

        const pass=document.getElementById('Password').value;

        const fileInput=document.getElementById('Profile-picture');
        const file=fileInput.files[0];
    })
    


});