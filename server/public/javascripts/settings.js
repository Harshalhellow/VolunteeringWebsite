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







// eslint-disable-next-line no-undef
const vueinst = Vue.createApp({

    data() {
        return {
            activeTab: 0,
            color1: '#B5C0D0',
            color2: '#CCD3CA',
            color3: '#fffcf5',
            color4: '#e3e6f0',
            textColor: '#000000',
            email: '',
            emailToggle: false,
            username: '',
            userID: -1,
            passwordMessage: '',
            passwordMessageColor: '',
            newPassword: '',
            repeatedPassword: '',
            oldPassword: '',
            profilePicPath: 'images/profile/default.png?t=bla',
            joinedGroups: [],
        };
    },

    beforeMount() {
        this.getColors();
        this.getUserData();
        this.getJoinedGroups();
    },

    methods: {
        updateColor(colorName, color) {
            document.documentElement.style.setProperty(colorName, color);
        },

        getColors() {
            let req = new XMLHttpRequest();
            req.onreadystatechange = () => {
                if (req.readyState === 4 && req.status === 200) {
                    let sessionData = JSON.parse(req.responseText);
                    this.color1 = sessionData.colors.c1;
                    this.color2 = sessionData.colors.c2;
                    this.color3 = sessionData.colors.c3;
                    this.color4 = sessionData.colors.c4;
                    this.textColor = sessionData.colors.text;

                    this.updateColor('--color1', this.color1);
                    this.updateColor('--color2', this.color2);
                    this.updateColor('--color3', this.color3);
                    this.updateColor('--color4', this.colorc4);
                    this.updateColor('--textColor', this.textColor);
                }
            };
            req.open('GET', '/ajax/getSession.json');
            req.send();
        },

        setColor(colorName_, color_) {
            this.updateColor(colorName_, color_);

            let postData = {
                colorName: colorName_,
                color: color_
            };

            let req = new XMLHttpRequest();

            req.open('POST', '/ajax/setColor');
            req.setRequestHeader('Content-Type', 'application/json');
            req.send(JSON.stringify(postData));
        },

        getUserData() {
            let req = new XMLHttpRequest();
            req.onreadystatechange = () => {
                if (req.readyState === 4 && req.status === 200) {
                    let userData = JSON.parse(req.responseText);
                    this.email = userData.Email;
                    if (userData.Email_Toggle == 1) {
                        this.emailToggle = true;
                    } else {
                        this.emailToggle = false;
                    }
                    this.username = userData.Username;
                    this.userID = userData.userID;
                    if (this.userID != -1) {
                        let path = 'images/profile/' + this.userID + '.png?t=bla';
                        this.profilePicPath = path;
                    }
                }
            };
            req.open('GET', '/ajax/getUserData.json');
            req.send();
        },

        setEmail(event) {
            if (this.userID == -1) {
                return;
            }
            this.email = event.target.value;
            let postData = {
                email: this.email
            };

            let req = new XMLHttpRequest();

            req.open('POST', '/ajax/setEmail');
            req.setRequestHeader('Content-Type', 'application/json');
            req.send(JSON.stringify(postData));
        },

        setUsername(event) {
            if (this.userID == -1) {
                return;
            }
            this.username = event.target.value;
            let postData = {
                username: this.username
            };

            let req = new XMLHttpRequest();

            req.open('POST', '/ajax/setUsername');
            req.setRequestHeader('Content-Type', 'application/json');
            req.send(JSON.stringify(postData));
        },

        changePassword() {
            if (this.userID == -1) {
                return;
            }
            this.passwordMessage = '';
            this.passwordMessageColor = '#FF0000';

            // Check new password matches repeated.
            if (this.newPassword != this.repeatedPassword) {
                this.passwordMessage = 'Repeated password does not match!';
                return;
            }

            // Check old password is correct.
            let postData = {
                password: this.oldPassword
            };

            let req1 = new XMLHttpRequest();
            req1.onreadystatechange = () => {
                if (req1.readyState === 4 && req1.status === 200) {
                    let data = JSON.parse(req1.responseText);
                    if (data[0].Username == "IT'S ALL WRONG!!!!!!!!!!!!!!!!!") {
                        this.passwordMessage = 'Old password is incorrect!';
                        return;
                    }

                    // Set new password.
                    postData = {
                        password: this.newPassword
                    };
                    let req2 = new XMLHttpRequest();
                    req2.open('POST', '/ajax/setPassword');
                    req2.setRequestHeader('Content-Type', 'application/json');
                    req2.send(JSON.stringify(postData));
                    this.passwordMessageColor = '#00FF00';
                    this.passwordMessage = 'Success!';
                    this.newPassword = '';
                    this.repeatedPassword = '';
                    this.oldPassword = '';
                }
            };
            req1.open('POST', '/ajax/checkPassword.json');
            req1.setRequestHeader('Content-Type', 'application/json');
            req1.send(JSON.stringify(postData));
        },

        uploadProfilePic() {
            if (this.userID == -1) {
                return;
            }

            const formData = new FormData(document.getElementById("profilePicForm"));

            let req = new XMLHttpRequest();
            req.onreadystatechange = () => {
                if (req.readyState === 4) {
                    if (req.status === 200) {
                        let picPath = 'images/profile/' + this.userID + '.png' + '?t=' + new Date().getTime(); // Time as cache breaker to ensure file reloads.;
                        this.profilePicPath = picPath;
                    } else {
                        alert("Image must be a png!");
                    }
                }
            };
            let path = '/ajax/upload/profile/' + this.userID;
            req.open('POST', path);
            req.send(formData);
        },

        getJoinedGroups() {
            let req = new XMLHttpRequest();
            req.onreadystatechange = () => {
                if (req.readyState === 4 && req.status === 200) {
                    let data = JSON.parse(req.responseText);
                    data.forEach((item, index) => {
                        item.imagePath = 'images/group/' + item.groupID + '.png';
                    });
                    this.joinedGroups = data;
                }
            };
            req.open('GET', '/ajax/joinedGroups.json');
            req.send();
        },

        leaveGroup(groupID) {
            let req = new XMLHttpRequest();

            req.onreadystatechange = () => {
                if (req.readyState === 4 && req.status === 200) {
                    this.getJoinedGroups();
                }
            };

            let path = '/ajax/leaveGroup/' + groupID;
            req.open('POST', path);
            req.send();

            this.getJoinedGroups();
        },

        toggleGroupEmails(groupID, notEmailPreference) {
            let emailPreference = 0;
            if (notEmailPreference == 0) {
                emailPreference = 1;
            }

            let req = new XMLHttpRequest();

            req.onreadystatechange = () => {
                if (req.readyState === 4 && req.status === 200) {
                    this.getJoinedGroups();
                }
            };

            let path = '/ajax/toggleGroupEmails/' + groupID + '/' + emailPreference;
            req.open('POST', path);
            req.send();
        },
        setColorsToDefault() {
            this.color1 = '#B5C0D0';
            this.color2 = '#CCD3CA';
            this.color3 = '#fffcf5';
            this.color4 = '#e3e6f0';
            this.textColor = '#000000';

            this.setColor('--color1', this.color1);
            this.setColor('--color2', this.color2);
            this.setColor('--color3', this.color3);
            this.setColor('--color4', this.colorc4);
            this.setColor('--textColor', this.textColor);
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
        },





        openAdminForm() {
            document.getElementById("adminForm").style.display = "block";
        },

        closeAdminForm() {
            document.getElementById("adminForm").style.display = "none";
        },

        createGroup() {
            const formData = new FormData(document.getElementById("groupForm"));
            fetch('/ajax/createGroup', {
                method: 'POST',
                body: new URLSearchParams(formData)
            })
                .then(response => response.json())
                .then(data => {
                    this.closeAdminForm();
                });
        },

    }
}).mount('#app');