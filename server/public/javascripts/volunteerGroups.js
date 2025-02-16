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
                location.reload();
            } else {
                alert('Google login failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function closePopup(popupId) {
    document.getElementById(popupId).style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
    updatePermanentContent();

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
        link.onclick = function () { gotoGroup(group.groupID); };
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
                    location.reload();
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






function setColors() {
    let req = new XMLHttpRequest();
    req.onreadystatechange = () => {
        if (req.readyState === 4 && req.status === 200) {
            let sessionData = JSON.parse(req.responseText);

            document.documentElement.style.setProperty('--color1', sessionData.colors.c1);
            document.documentElement.style.setProperty('--color2', sessionData.colors.c2);
            document.documentElement.style.setProperty('--color3', sessionData.colors.c3);
            document.documentElement.style.setProperty('--color4', sessionData.colors.c4);
            document.documentElement.style.setProperty('--textColor', sessionData.colors.text);
        }
    };
    req.open('GET', '/ajax/getSession.json');
    req.send();
}

/*const { search } = require("../../routes");*/



//Autopopulate tiles getting data from database

// eslint-disable-next-line no-undef
var groupTiles = new Vue({
    el: "#vgPage",
    data: {
        volunteerGroups: []

        //serchQuery: ''
    },

    methods: {
        /*searchGroups() {
            const searchParams = new URLSearchParams();
                searchParams.append('query', document.getElementById('query').searchQuery);
                fetch('Groups' + searchParams.toString())
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch Groups');
                    }
                    return response.json();
                })
                .then(data => {
                    this.volunteerGroups = data;
                })
                .catch(error => {
                    console.error('Error searching groups:', error);
                });
            }, */

        populateTiles: function () {
            fetch('/ajax/autopopulateTiles')
                .then(response => response.json())
                .then(data => {
                    this.volunteerGroups = data;
                    console.log("Autopopulate works");
                })
                .catch(error => console.error('Error fetching volunteer groups', error));
        },

        gotoGroup(groupID) {
            let req = new XMLHttpRequest();

            req.onreadystatechange = () => {
                if (req.readyState === 4 && req.status === 200) {
                    location.assign('/group.html');
                }
            };

            let path = '/ajax/setCurrentGroup/' + groupID;
            req.open('POST', path);
            req.send();
        }
    },


    mounted() {
        this.populateTiles();

    }
});
