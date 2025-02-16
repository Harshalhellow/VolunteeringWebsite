let currentSlide = 0;
function handleCredentialResponse(response) {
    console.log('Encoded JWT ID token: ' + response.credential);
    const token = response.credential;

    fetch('/ajax/auth/google/callback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: token })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('authButtons').style.display = 'none';
            document.getElementById('userProfileContainer').style.display = 'flex';
            document.getElementById('usernameDisplayToggle').textContent = data.username;
        } else {
            alert('Google login failed: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}




function moveCarousel(direction) {
    const slides = document.querySelectorAll("#carousel > a");
    slides[currentSlide].style.display = "none";
    currentSlide += direction;
    if (currentSlide >= slides.length) currentSlide = 0;
    else if (currentSlide < 0) currentSlide = slides.length - 1;
    slides[currentSlide].style.display = "inline-block";
}

function closePopup(popupId) {
    document.getElementById(popupId).style.display = "none";
}

function autoRotateCarousel() {
    moveCarousel(1);
}

setInterval(autoRotateCarousel, 5000);

document.addEventListener("DOMContentLoaded", () => {

    updatePermanentContent();
    const slides = document.querySelectorAll("#carousel > a");
    slides.forEach((slide, idx) => slide.style.display = idx === 0 ? "inline-block" : "none");

    const postsContainer = document.getElementById("posts");

    function createPostElement(post) {
        const postDiv = document.createElement("div");
        postDiv.classList.add("post");

        const postTitle = document.createElement("h3");
        postTitle.textContent = post.postTitle;

        const postDescription = document.createElement("p");
        postDescription.textContent = post.postDescription;

        postDiv.appendChild(postTitle);
        postDiv.appendChild(postDescription);

        return postDiv;
    }

    function loadPosts() {
        fetch('/ajax/userPosts')
            .then(response => response.json())
            .then(data => {
                console.log("loadPosts response", data);
                if (data.success) {
                    postsContainer.innerHTML = '';
                    data.posts.forEach(post => {
                        const postElement = createPostElement(post);
                        postsContainer.appendChild(postElement);
                    });
                } else {
                    console.error('Failed to load posts:', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    const loginPopup = document.getElementById("loginPopup");
    const loginButton = document.getElementById("loginButton");
    const signupPopup = document.getElementById("signupPopup");
    const signupButton = document.getElementById("signupButton");
    const closeButton = document.querySelector(".popup .close");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const authButtons = document.getElementById("authButtons");
    const userProfileContainer = document.getElementById("userProfileContainer");
    const usernameDisplayToggle = document.getElementById("usernameDisplayToggle");
    const sidebar = document.getElementById("sidebar");

    function createGroupBubble(group) {
        const link = document.createElement('a');
        link.onclick = function() { gotoGroup(group.groupID); };
        link.className = 'bubble';

        const img = document.createElement('img');
        img.src = `/images/group/${group.groupID}.png`;
        img.alt = group.Group_Name;
        img.className = 'group-icon';
        link.appendChild(img);

        // const span = document.createElement('span');
        // span.textContent = group.Group_Name;
        // link.appendChild(span);

        return link;
    }

    function loadUserGroups() {
        fetch('/ajax/userGroups')
            .then(response => response.json())
            .then(data => {
                console.log("loadUserGroups response", data);
                if (data.success) {
                    data.groups.forEach(group => {
                        const groupBubble = createGroupBubble(group);
                        sidebar.appendChild(groupBubble);
                    });
                } else {
                    console.error('Failed to load user groups:', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function updatePermanentContent() {
        fetch('/ajax/getUsernameAndID.json')
            .then(response => response.json())
            .then(data => {
                console.log('updatePermanentContent data:', data);
                if (data.userID != -1) {
                    authButtons.style.display = "none";
                    userProfileContainer.style.display = "flex";
                    usernameDisplayToggle.textContent = data.Username;
                    loginPopup.style.display = "none";
                    loadUserGroups();
                    loadPosts();
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    loginButton.addEventListener("click", () => {
        loginPopup.style.display = "block";
    });

    signupButton.addEventListener("click", () => {
        signupPopup.style.display = "block";
    });

    window.addEventListener("click", (event) => {
        if (event.target == loginPopup) {
            loginPopup.style.display = "none";
        }
        if (event.target == signupPopup) {
            signupPopup.style.display = "none";
        }
    });

    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(loginForm);
        fetch('/ajax/login', {
            method: 'POST',
            body: new URLSearchParams(formData)
        })
            .then(response => response.json())
            .then(data => {
                console.log("Login response", data);
                if (data.success) {
                    updatePermanentContent();
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });

    signupForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(signupForm);
        const password = formData.get('password');
        const retypePassword = formData.get('retypePassword');

        if (password !== retypePassword) {
            alert("Passwords do not match!");
            return;
        }

        fetch('/ajax/signup', {
            method: 'POST',
            body: new URLSearchParams(formData)
        })
            .then(response => response.json())
            .then(data => {
                console.log("Signup response", data);
                if (data.success) {
                    alert("Signup successful! You can now log in.");
                    signupPopup.style.display = "none";
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });
});


function logout() {
    fetch('/ajax/logout', {
        method: 'POST',
    })
    .then(response => {
        if (response.ok) {
            location.reload();
        } else {
            console.error('Logout failed.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function gotoGroup(groupID) {
    fetch('/ajax/setCurrentGroup/' + groupID, {
        method: 'POST',
    })
    .then(response => {
        if (response.ok) {
            location.assign('/group.html');
        } else {
            console.error('Failed to set current group.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
