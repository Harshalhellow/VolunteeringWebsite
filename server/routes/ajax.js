var express = require('express');
var path = require('path');
var router = express.Router();
const bodyParser = require('body-parser');
const { resource } = require('../app');
var argon2 = require('argon2');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('910246570713-dj7bu1ljijs1mi62n6t130cb381aa713.apps.googleusercontent.com');
// Homepage routes
// login route
module.exports = router;
router.post('/login', function (req, res) {
    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        const { email, password } = req.body;
        var query = 'SELECT userID, Username, Password, System_Admin_Toggle, Text_Color, Color1, Color2, Color3, Color4 FROM Users WHERE Email = ?;';
        connection.query(query, [email], async function (err, rows) {
            connection.release();
            if (err) {
                console.error('Database query error:', err.message);
                return res.status(500).send({ success: false, message:
'Database query error' });
            }
            if (rows.length > 1) {
                return res.status(401).send({ success: false, message: 'Contact admins for support.' });
            }
            if (rows.length == 0) {
                return res.status(401).send({ success: false, message: 'Incorrect email or password' });
            }
            // Check Password.
            try {
                if (await argon2.verify(rows[0].Password, password)) {
                    // Password matches.
                    req.session.userID = rows[0].userID;
                    req.session.username = rows[0].Username;
                    req.session.isAdmin = rows[0].System_Admin_Toggle;
                    req.session.colors.text = rows[0].Text_Color;
                    req.session.colors.c1 = rows[0].Color1;
                    req.session.colors.c2 = rows[0].Color2;
                    req.session.colors.c3 = rows[0].Color3;
                    req.session.colors.c4 = rows[0].Color4;
                    res.send({ success: true });
                } else {
                    // Password does not match.
                    res.status(401).send({ success: false, message: 'Incorrect email or password' });
                }
            } catch (err) {
                // Internal failure.
                res.status(500).send({ success: false, message: 'Internal failure.' });
            }
        });
    });
});


router.post('/signup', async function (req, res, next) {
    const { email, username, password } = req.body;

    // Encrypt password.
    let phash = null;
    try {
        phash = await argon2.hash(password);
    } catch (err) {
        res.sendStatus(500).send("Failed password encryption.");
        return;
    }

    const query = 'INSERT INTO Users (Email, Username, Password) VALUES (?, ?, ?)';
    req.pool.getConnection((err, connection) => {
        if (err) {
            console.error('Database connection error:', err.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        connection.query(query, [email, username, phash], (err, results) => {
            connection.release();
            if (err) {
                console.error('Database query error:', err.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send({ success: true, message: 'User registered successfully' });
        });
    });
});

router.post('/logout', function (req, res) {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err.message);
            return res.status(500).send({ success: false, message: 'Logout failed' });
        }
        res.send({ success: true, message: 'Logged out successfully' });
    });
});

router.get('/getUsernameAndID.json', function (req, res) {
    if (!req.session.userID) {
        return res.send({ userID: -1 });
    }

    const userID = req.session.userID;
    const username = req.session.username;

    res.send({ userID, Username: username });
});

router.get('/userGroups', function (req, res) {
    if (!req.session.userID) {
        return res.status(401).send({ success: false, message: 'User not logged in' });
    }

    const userID = req.session.userID;
    const query = `
        SELECT g.groupID, g.Group_Name
        FROM \`Groups\` g
        JOIN \`Group_Members\` gm ON g.groupID = gm.groupID
        WHERE gm.userID = ?;
    `;

    console.log(`Fetching groups for userID: ${userID}`);
    console.log(`Running query: ${query}`);

    req.pool.getConnection(function (err, connection) {
        if (err) {
            console.error('Database connection error:', err.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }

        connection.query(query, [userID], function (err, rows) {
            connection.release();
            if (err) {
                console.error('Database query error:', err.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            console.log(`Groups fetched for userID ${userID}:`, rows);
            res.send({ success: true, groups: rows });
        });
    });
});

router.get('/userPosts', function (req, res) {
    if (!req.session.userID) {
        return res.status(401).send({ success: false, message: 'User not logged in' });
    }

    const userID = req.session.userID;
    const query = `
        SELECT p.PostID, p.Post_Title AS postTitle, p.Description AS postDescription
        FROM Posts p
        JOIN Group_Members gm ON p.groupID = gm.groupID
        WHERE gm.userID = ?;
    `;

    req.pool.getConnection(function (err, connection) {
        if (err) {
            console.error('Database connection error:', err.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }

        connection.query(query, [userID], function (err, rows) {
            connection.release();
            if (err) {
                console.error('Database query error:', err.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send({ success: true, posts: rows });
        });
    });
});

router.post('/auth/google/callback', (req, res) => {
    const { token } = req.body;
    console.log('Received Google token:', token);

    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: '910246570713-dj7bu1ljijs1mi62n6t130cb381aa713.apps.googleusercontent.com',
        });
        const payload = ticket.getPayload();
        const email = payload['email'];

        req.pool.getConnection((err, connection) => {
            if (err) {
                console.error('Database connection error:', err.message);
                return res.status(500).send({ success: false, message: 'Database connection error' });
            }
            const query = 'SELECT * FROM Users WHERE Email = ?';
            connection.query(query, [email], (err, results) => {
                if (err) {
                    console.error('Database query error:', err.message);
                    connection.release();
                    return res.status(500).send({ success: false, message: 'Database query error' });
                }

                if (results.length > 0) {
                    const user = results[0];
                    req.session.userID = user.userID;
                    req.session.username = user.Username;
                    req.session.isAdmin = user.System_Admin_Toggle;
                    req.session.colors = {
                        text: user.Text_Color,
                        c1: user.Color1,
                        c2: user.Color2,
                        c3: user.Color3,
                        c4: user.Color4
                    };
                    connection.release();
                    res.send({ success: true, username:
user.Username });
                } else {
                    const insertQuery = 'INSERT INTO Users (Email, Username) VALUES (?, ?)';
                    connection.query(insertQuery, [email, payload['name']], (err, results) => {
                        if (err) {
                            console.error('Database query error:', err.message);
                            connection.release();
                            return res.status(500).send({ success: false, message: 'Database query error' });
                        }
const newUserQuery = 'SELECT * FROM Users WHERE Email = ?';
                        connection.query(newUserQuery, [email], (err, results) => {
                            if (err) {
                                console.error('Database query error:', err.message);
                                connection.release();
                                return res.status(500).send({ success: false, message: 'Database query error' });
                            }
                            const user = results[0];
                            req.session.userID = user.userID;
                            req.session.username = user.Username;
                            req.session.isAdmin = user.System_Admin_Toggle;
                            req.session.colors = {
                                text: user.Text_Color,
                                c1: user.Color1,
                                c2: user.Color2,
                                c3: user.Color3,
                                c4: user.Color4
                            };
                            connection.release();
                            res.send({ success: true, username: user.Username });
                        });
                    });
                }
            });
        });
    }
    verify().catch(error => {
        console.error('Error:', error);
        res.status(500).send({ success: false, message: 'Token verification error' });
    });
});

//VOLUNTEER GROUPS PAGE section start

//searchbar query
/*route for getting data from 'Dabase' based on search query
router.get('/getSearchQuery', function (req, res) {
    req.pool.getConnection(function (err1, connection) {
router.get('/getSearchQuery', function (req, res) {

        //query to 'Dabase' to search for groups based on search query
        const searchQuery = req.query.query;
        const searchBarquery = `SELECT * FROM 'Groups' WHERE category LIKE '%${searchQuery}%' `;
        const searchBarquery = `SELECT * FROM 'Groups' WHERE 'Group_Name' LIKE '%${searchQuery}%' `;

    connection.query(searchBarquery, function (err2, results) {
            connection.release(); // release connection*/

//autopopulating group tiles from dabase
router.get('/autopopulateTiles', function (req, res) {
    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            console.log("this bit is broken");
            return res.status(500).send({ success: false, message: 'Database query error' });
        }
        const tileQuery = "SELECT * FROM `Groups`";
        connection.query(tileQuery, function (err2, rows, fields) {
            connection.release(); // release connection

            if (err2) {
                console.error('Database query error:', err2.message);
                console.log("just kidding its actually this bit thats broken");
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.json(rows); // Send back the results
        });
    });
});


//VOLUNTEER GROUPS PAGE section end


// route for getting posts data from 'Dabase' for defaultGroups Page


router.post('/createEvent', function (req, res) {
    console.log(req.body);
    const { eventTitle, eventDescription } = req.body;
    const eventQuery = "INSERT INTO Posts (Description, Post_Category, Post_Title, groupID) VALUES ( ?, 'Event', ?, 1);";
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database query error' });
        }
        connection.query(eventQuery, [eventDescription, eventTitle, req.session.groupID], (err2, results) => {
            connection.release();
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send({ success: true });
        });
    });
});

router.post('/joinEvent', function (req, res) {
    const { eventID } = req.body;

    if (!req.session.userID) {
        return res.status(401).send({ success: false, message: 'User not logged in' });
    }

    const userID = req.session.userID;

    const query = 'UPDATE Group_Members SET event = 1 WHERE userID = ? AND groupID = (SELECT groupID FROM Posts WHERE PostID = ? AND Post_Category = "Event")';
    req.pool.getConnection((err, connection) => {
        if (err) {
            console.error('Database connection error:', err.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        connection.query(query, [userID, eventID], (err, results) => {
            connection.release();
            if (err) {
                console.error('Database query error:', err.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send({ success: true, message: 'Joined event successfully' });
        });
    });
});

router.get('/groupEvents', function (req, res) {
    if (!req.session.userID) {
        return res.status(401).send({ success: false, message: 'User not logged in' });
    }

    const groupID = req.session.groupID;
    const query = `
        SELECT PostID as eventID, Post_Title as eventTitle, Description as eventDescription
        FROM Posts
        WHERE groupID = 1 AND Post_Category = "Event";
    `;

    req.pool.getConnection(function (err, connection) {
        if (err) {
            console.error('Database connection error:', err.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }

        connection.query(query, [groupID], function (err, rows) {
            connection.release();
            if (err) {
                console.error('Database query error:', err.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            console.log("Events fetched from DB:", rows);
            res.send({ success: true, events: rows });
        });
    });
});



router.get('/groupPosts', function (req, res) {
    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database query error' });
        }
        const postQuery = "SELECT * FROM Posts";
        connection.query(postQuery, function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.json(rows);
        });
    });
});



router.get('/groupInformation', function (req, res) {
    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database query error' });
        }
        const postQuery = "SELECT * FROM `Groups` WHERE groupID = ?";
        connection.query(postQuery, [req.session.currentGroupID], function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.json(rows);
        });
    });
});

// Find list of Joined Members for a certain group: Work in progress at the moment.
router.get('/joinedMembers', function (req, res) {
    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database query error' });
        }
        const postQuery = "SELECT Username FROM Users WHERE userID IN (SELECT userID FROM Group_Members WHERE groupID = ?)";
        connection.query(postQuery, [req.session.currentGroupID], function (err2, rows, fields) {
            //console.log(req.session.currentGroupID);
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.json(rows);
        });
    });
});

//
router.get('/updateGroup', function (req, res) {
    // Connect to the database.
    console.log(req.body);
    const { Group_Name, Description, Email, phoneNumber } = req.body;
    const postQuery = "UPDATE `Groups` SET Description = ?, Email = ?, phoneNumber = ?, groupName = ? WHERE groupID = ?;";
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database query error' });
        }
        connection.query(postQuery, [Description, Email, phoneNumber, Group_Name, req.session.currentGroupID], (err2, results) => {
            connection.release();
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send({ success: true });
        });
    });
});


// sending an email and creating a post
const nodeMailer = require('nodemailer');
const htmlEmail = `<p> A group you follow has just posted ! </p>`;
// this bit

router.post('/createPost', function (req, res) {
    console.log(req.body);
    const { postTitle, postDescription } = req.body;
    const postQuery = "INSERT INTO Posts (Description, Post_Category, Post_Title, groupID) VALUES ( ?, 'Post', ?, '1');";
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database query error' });
        }
        connection.query(postQuery, [postDescription, postTitle], (err2, results) => {
            connection.release();
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send({
                success: function () {
                    const postQuery = "SELECT Email FROM Users WHERE userID IN (SELECT userID FROM Group_Members WHERE groupID = ?) AND Email_Toggle = 1;";
                    req.pool.getConnection(function (err1, connection) {
                        if (err1) {
                            console.error('Database connection error:', err1.message);
                            return res.status(500).send({ success: false, message: 'Database query error' });
                        }
                        connection.query(postQuery, [req.session.groupID], (err2, results) => {
                            connection.release();
                            if (err2) {
                                console.error('Database query error:', err2.message);
                                return res.status(500).send({ success: false, message: 'Database query error' });
                            }
                            else {
                                console.log(results);
                                let transporter = nodeMailer.createTransport({
                                    host: 'smtp.ethereal.email',
                                    port: 587,
                                    auth: {
                                        user: 'christop.kirlin@ethereal.email',
                                        pass: 'FBhw4WNpBq6fAcHwGA'
                                    }
                                });

                                // function

                            }
                        });
                    });
                }
            });
        });
    });
});


router.get('/joinGroup', function (req, res) {
    // Connect to the database.

    const postQuery = "INSERT INTO `Group_Members` (userID, groupID) VALUES(?, ?);";
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database query error' });
        }
        connection.query(postQuery, [req.session.userID, req.session.currentGroupID], (err2, results) => {
            connection.release();
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send({ success: true });
        });
    });
});


// GROUP SECTION END

// Get Session Data.
router.get('/getSession.json', function (req, res, next) {
    res.json(req.session);
});

// Set color.
router.post('/setColor', function (req, res, next) {
    var query = "";
    switch (req.body.colorName) {
        case "--color1":
            req.session.colors.c1 = req.body.color;
            query = "UPDATE Users SET Color1 = ? WHERE userID = ?;";
            break;
        case "--color2":
            req.session.colors.c2 = req.body.color;
            query = "UPDATE Users SET Color2 = ? WHERE userID = ?;";
            break;
        case "--color3":
            req.session.colors.c3 = req.body.color;
            query = "UPDATE Users SET Color3 = ? WHERE userID = ?;";
            break;
        case "--color4":
            req.session.colors.c4 = req.body.color;
            query = "UPDATE Users SET Color4 = ? WHERE userID = ?;";
            break;
        case "--textColor":
            req.session.colors.text = req.body.color;
            query = "UPDATE Users SET Text_Color = ? WHERE userID = ?;";
            break;
    }

    if (req.session.userID == -1) { // Don't update database if user is not logged in.
        return res.send();
    }

    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        connection.query(query, [req.body.color, req.session.userID], function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send();
        });
    });
});

// Get user data.
router.get('/getUserData.json', function (req, res, next) {
    let data = {
        userID: -1,
        Email: "",
        Email_Toggle: 0,
        Username: "Guest",
    };

    if (req.session.userID == -1) { // Don't query database if user is not logged in.

        return res.json(data);
    }

    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        let query = "SELECT userID, Email, Email_Toggle, Username FROM Users WHERE userID = ?;";
        connection.query(query, [req.session.userID], function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.json(rows[0]);
        });
    });
});

// Set email.
router.post('/setEmail', function (req, res, next) {
    if (req.session.userID == -1) { // Don't update database if user is not logged in.
        return res.send();
    }

    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        let query = "UPDATE Users SET Email = ? WHERE userID = ?;";
        connection.query(query, [req.body.email, req.session.userID], function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send();
        });
    });
});

// Set username.
router.post('/setUsername', function (req, res, next) {
    if (req.session.userID == -1) { // Don't update database if user is not logged in.
        return res.send();
    }

    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        let query = "UPDATE Users SET Username = ? WHERE userID = ?;";
        connection.query(query, [req.body.username, req.session.userID], function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send();
        });
    });
});

// Check password.
router.post('/checkPassword.json', function (req, res, next) {
    if (req.session.userID == -1) { // Don't query database if user is not logged in.
        return res.send();
    }

    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        let query = "SELECT Username, Password FROM Users WHERE userID = ?";
        connection.query(query, [req.session.userID], async function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            // Check Password.
            try {
                if (await argon2.verify(rows[0].Password, req.body.password)) {
                    // Password matches.
                    res.json(rows);
                } else {
                    rows[0].Username = "IT'S ALL WRONG!!!!!!!!!!!!!!!!!";
                    res.json(rows);
                }
            } catch (err) {
                // Internal failure.
                res.status(500).send({ success: false, message: 'Internal failure.' });
            }
        });
    });
});

// Set password.
router.post('/setPassword', async function (req, res, next) {
    if (req.session.userID == -1) { // Don't update database if user is not logged in.
        return res.send();
    }

    // Encrypt password.
    let phash = null;
    try {
        phash = await argon2.hash(req.body.password);
    } catch (err) {
        res.sendStatus(500).send("Failed password encryption.");
        return;
    }

    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        let query = "UPDATE Users SET Password = ? WHERE userID = ?;";
        connection.query(query, [phash, req.session.userID], function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send();
        });
    });
});

// Set profile picture.
router.post('/setProfilePicture', function (req, res, next) {
    if (req.session.userID == -1) { // Don't update database if user is not logged in.
        return res.send();
    }

    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        let query = "UPDATE Users SET Password = ? WHERE userID = ?;";
        connection.query(query, [req.body.password, req.session.userID], function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send();
        });
    });
});




//! Temp
router.get('/getUser.json', function (req, res, next) {
    if (req.session.userID == -1) { // Don't query database if user is not logged in.
        return res.send();
    }

    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        let query = "SELECT * FROM Users WHERE userID = ?;";
        connection.query(query, [req.session.userID], function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.json(rows[0]);
        });
    });
});


// Image uploads.
const multer = require('multer');
const { hash } = require('crypto');
const e = require('express');

// Check file type
function checkFileType(file, cb) {
    const filetypes = /png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images only! (.png only)');
    }
}

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            let type = req.params.location;
            let path = '/workspaces/24S1_WDC_UG_Group_80/server/public/images/' + type;
            callback(null, path);
        },
        filename: (req, file, callback) => {
            let name = req.params.name + '.png';
            callback(null, name);
        }
    }),
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

router.post('/upload/:location/:name', upload.single('file'), (req, res) => {
    res.status(200).send();
});

router.get('/joinedGroups.json', function (req, res) {
    if (req.session.userID == -1) { // Don't query database if user is not logged in.
        return res.send();
    }

    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        let query = "SELECT Groups.groupID, Groups.Group_Name, Group_Members.Email_Preference FROM `Groups` INNER JOIN Group_Members ON Groups.groupID = Group_Members.groupID WHERE Group_Members.userID = ?;";
        connection.query(query, [req.session.userID], function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.json(rows);
        });
    });
});

router.post('/leaveGroup/:groupID', function (req, res) {
    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        let query = "DELETE FROM Group_Members WHERE userID = ? AND groupID = ?;";
        connection.query(query, [req.session.userID, req.params.groupID], function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send();
        });
    });
});

router.post('/toggleGroupEmails/:groupID/:value', function (req, res) {
    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        let query = "UPDATE Group_Members SET Email_Preference = ? WHERE userID = ? AND groupID = ?;";
        connection.query(query, [req.params.value, req.session.userID, req.params.groupID], function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send();
        });
    });
});

router.post('/createGroup', function (req, res) {
    const { Group_Name, Decription, Email, phoneNumber } = req.body;
    console.log(req.body);
    const postQuery = "INSERT INTO `Groups` (Description, Email, phoneNumber, Group_Name) VALUES ( ?, ?, ?, ?);";
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database query error' });
        }
        connection.query(postQuery, [Decription, Email, phoneNumber, Group_Name], (err2, results) => {
            connection.release();
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.send({ success: true });
        });
    });
});

router.post('/setCurrentGroup/:groupID', function (req, res) {
    req.session.currentGroupID = req.params.groupID;
    res.send();
});



// Get user data.
router.get('/getUsernameAndID.json', function (req, res, next) {
    let data = {
        userID: -1,
        Username: "Guest"
    };

    if (req.session.userID == -1) { // Don't query database if user is not logged in.

        return res.json(data);
    }

    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        let query = "SELECT userID, Username FROM Users WHERE userID = ?;";
        connection.query(query, [req.session.userID], function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            res.json(rows[0]);
        });
    });
});


// Get extra group buttons.
router.get('/extraGroupButtons.json', function (req, res, next) {
    let data = {
        userID: -1,
        isJoined: 0,
        isAdmin: 0
    };

    if (req.session.userID == -1 || req.session.currentGroupID == -1) { // Don't query database if user is not logged in.
        console.log("This happened. 1");
        return res.json(data);
    }

    // Connect to the database.
    req.pool.getConnection(function (err1, connection) {
        if (err1) {
            console.error('Database connection error:', err1.message);
            return res.status(500).send({ success: false, message: 'Database connection error' });
        }
        let query = "SELECT isAdmin FROM Group_Members WHERE userID = ? AND groupID = ?;";
        connection.query(query, [req.session.userID, req.session.currentGroupID], function (err2, rows, fields) {
            connection.release(); // release connection
            if (err2) {
                console.error('Database query error:', err2.message);
                return res.status(500).send({ success: false, message: 'Database query error' });
            }
            data.userID = req.session.userID;
            if (rows.length == 1) {
                data.isJoined = 1;
                if (rows[0].isAdmin == 1) {
                    data.isAdmin = 1;
                }
            }
            res.json(data);
        });
    });
});

module.exports = router;
