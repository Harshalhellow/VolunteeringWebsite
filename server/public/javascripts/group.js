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

function doSideAndHeaderBar() {
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
};


function logout() {
    fetch('/ajax/logout', {
        method: 'POST',
    })
    .then(response => {
        if (response.ok) {
            location.assign('/homepage.html');
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

document.addEventListener("DOMContentLoaded", () => {
    doSideAndHeaderBar();

    function getExtraButtons() {
        let req = new XMLHttpRequest();
        req.onreadystatechange = () => {
            if (req.readyState === 4 && req.status === 200) {
                let data = JSON.parse(req.responseText);
                if (data.userID == -1) {
                    return;
                }
                if (data.isJoined == 0) {
                    const orgInfo = document.getElementById("organisationInformation");
                    const joinGroupButton = document.createElement('button');

                    joinGroupButton.type = 'button';
                    joinGroupButton.className = 'joinGroupButton';
                    joinGroupButton.onclick = function() { this.joinGroup(); };
                    joinGroupButton.innerText = 'Join Group';

                    orgInfo.appendChild(joinGroupButton);
                }
                if (data.isAdmin == 1) {
                    const sideBit = document.getElementById("side");
                    const adminButton = document.createElement('button');

                    adminButton.type = 'button';
                    adminButton.className = 'adminButtons';
                    adminButton.onclick = function() { this.openAdminForm(); };
                    adminButton.innerText = 'Admin Toggle';

                    sideBit.appendChild(adminButton);
                }
            }
        };
        req.open('GET', '/ajax/extraGroupButtons.json');
        req.send();
    }
    getExtraButtons();
});




// eslint-disable-next-line no-undef
const vueinst = new Vue({
    el: '#defaultGroupPage',
    data: {
        posts: [],
        groupInformation: [],
        joinedMembers: [],
        events: [],
    },
    beforeMount() {
        this.setColors();

    },

    methods: {
        getEvents: function () {
            const url = `/ajax/groupEvents?_=${new Date().getTime()}`;
            fetch(url)
                .then(response => {
                    console.log("Fetch response:", response);
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        this.events = data.events;
                        console.log("Events fetched: ", this.events);
                    } else {
                        console.error('Failed to fetch events: ', data.message);
                    }
                })
                .catch(error => {
                    console.error('The events couldn\'t be retrieved - vue', error);
                });
        },
        addEvent: function () {
            const formData = new FormData(document.getElementById("eventForm"));
            fetch('/ajax/createEvent', {
                method: 'POST',
                body: new URLSearchParams(formData)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.closeEForm();
                        this.getEvents();
                    } else {
                        console.error('Failed to create event: ', data.message);
                    }
                });
        },
        joinEvent: function (eventID) {
            fetch('/ajax/joinEvent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ eventID })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert("Successfully joined the event!");
                    } else {
                        alert("Failed to join the event.");
                    }
                })
                .catch(error => {
                    console.error('Failed to join the event - vue', error);
                });
        },
        getPosts: function () {
            fetch('/ajax/groupPosts')
                .then(response => response.json())
                .then(data => {
                    this.posts = data;
                    console.log("Group Posts function loads");
                })
                .catch(error => {
                    console.error('The posts couldn\'t be retrieved - vue', error);
                });
        },
        getGroupData: function () {
            fetch('/ajax/groupInformation')
                .then(response => response.json())
                .then(data => {
                    this.groupInformation = data;
                    console.log("Group Information loads");
                })
                .catch(error => {
                    console.error('The group information couldn\'t be retrieved - vue', error);
                });
        },
        getJoinedMembers: function () {
            fetch('/ajax/joinedMembers')
                .then(response => response.json())
                .then(data => {
                    this.joinedMembers = data;
                    console.log("Joined Members loads");
                })
                .catch(error => {
                    console.error('The joined members couldn\'t be retrieved - vue', error);
                });
        },
        addPost: function () {
            const formData = new FormData(document.getElementById("postForm"));
            fetch('/ajax/createPost', {
                method: 'POST',
                body: new URLSearchParams(formData)
            })
                .then(response => response.json())
                .then(data => {
                    console.log("Post added successfully");
                });
        },
        loadAdminFunction: function() {
            fetch('/ajax/updateGroup');
        },

        joinGroup: function(){
            fetch('/ajax/joinGroup')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("YIPPEEE");
                    alert("You've successfully joined this group!");
                } else {
                    console.error('Failed to create event: ', data.message);
                }
            });
        },

        // OPEN AND CLOSE FORMS  //
        openPForm: function () {
            document.getElementById("crtPostPopUp").style.display = "block";
        },
        closePForm: function () {
            document.getElementById("crtPostPopUp").style.display = "none";
        },
        openEForm: function () {
            document.getElementById("crtEventPopUp").style.display = "block";
        },
        closeEForm: function () {
            document.getElementById("crtEventPopUp").style.display = "none";
        },
        openAdminForm: function () {
            document.getElementById("adminForm").style.display = "block";
        },
        closeAdminForm: function () {
            document.getElementById("adminForm").style.display = "none";
        },
        saveGroupInformation: function () { },
        openPostsTab: function () {
            document.getElementById("postsTab").style.display = "block";
            document.getElementById("eventsTab").style.display = "none";
            document.getElementById("joinedMembers").style.display = "none";
        },
        openEventsTab: function () {
            document.getElementById("postsTab").style.display = "none";
            document.getElementById("eventsTab").style.display = "block";
            document.getElementById("joinedMembers").style.display = "none";
        },
        openJMembersTab: function () {
            document.getElementById("postsTab").style.display = "none";
            document.getElementById("eventsTab").style.display = "none";
            document.getElementById("joinedMembers").style.display = "block";
        },
        setColors: function () {
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
    },

    mounted() {
        this.getPosts(),
            this.getGroupData(),
            this.addPosts(),
            this.getEvents();
        this.getJoinedMembers();
    }
});
