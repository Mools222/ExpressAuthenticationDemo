const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require("fs");

function loginServer() {
    const app = express();
    const port = 3000;

    let cookieName = "loginCookie";

    app.use(express.urlencoded({extended: true}));
    app.use(express.json());

    app.use(express.static('login_server'));

    // app.use(express.cookieParser()); // Error: Most middleware (like cookieParser) is no longer bundled with Express and must be installed separately. Please see https://github.com/senchalabs/connect#middleware.
    app.use(cookieParser());

    // app.use(function (req, res, next) {
    //     console.log(req.cookies);
    //     console.log("asd")
    //
    //     if (req.cookies.hasOwnProperty(cookieName))
    //         next();
    //     else
    //         res.sendFile("login_server_login.html", {root: __dirname});
    // });

    app.get('/', (req, res) => {
        // console.log(req.cookies);

        if (req.cookies.hasOwnProperty(cookieName)) {
            // res.sendFile("login_server_index.html", {root: __dirname});
            let data = fs.readFileSync("login_server_index.html").toString()
                .replace(/REPLACE_USER/, req.cookies[cookieName].login)
                .replace(/REPLACE_PW/, req.cookies[cookieName].password)
                .replace(/REPLACE_EXPIRATION/, req.cookies[cookieName].cookieExpirationDate);
            res.send(data);
        } else {
            res.sendFile("login_server_login.html", {root: __dirname});
        }
    });

    app.post('/loginY', (req, res) => {
        // console.log(req.body);

        let login = checkLogin(req.body.login, req.body.password); // "login" is undefined if no such login is found - Otherwise the login object (which contains the user name and password) is returned

        if (login) { // If the login is undefined, it is converted to false. If it contains something, it is converted to true (https://www.w3schools.com/js/js_type_conversion.asp)
            console.log(`User logged in. User name: "${req.body.login}". Password: "${req.body.password}".`);

            // Cookie options
            let cookieAgeInMinutes = 0.5;
            let options = {
                maxAge: 1000 * 60 * cookieAgeInMinutes, // would expire after 15 minutes
                httpOnly: true, // The cookie only accessible by the web server
                signed: false // Indicates if the cookie should be signed
            };

            let date = new Date();
            date.setSeconds(date.getSeconds() + cookieAgeInMinutes * 60);
            login.cookieExpirationDate = date.toUTCString();

            // Set cookie
            res.cookie(cookieName, login, options); // options is optional

            // Serve HTML
            res.status(200).redirect('/');
        } else {
            console.log(`Someone failed to log in. User name: "${req.body.login}". Password: "${req.body.password}".`);

            let data = fs.readFileSync("login_server_status.html").toString()
                .replace(/REPLACE_TEXT/, "Error: Wrong user name and/or password.")
                .replace(/REPLACE_LINK/, "/");
            res.send(data);
        }
    });

    app.get('/logout', (req, res) => {
        res.clearCookie(cookieName);
        res.status(200).redirect('/');
    });

    app.get('/create', (req, res) => {
        res.sendFile("login_server_create.html", {root: __dirname});
    });

    app.post('/create', (req, res) => {
        // console.log(req.body);

        let userCreated = createNewUser(req.body.login, req.body.password);

        let data = fs.readFileSync("login_server_status.html").toString();
        if (userCreated === "User created.") {
            // res.status(200).redirect('/');
            data = data.replace(/REPLACE_TEXT/, "Success: " + userCreated);
            data = data.replace(/REPLACE_LINK/, "/");
        } else {
            data = data.replace(/REPLACE_TEXT/, "Error: " + userCreated);
            data = data.replace(/REPLACE_LINK/, "/create");
        }
        res.send(data);
    });

    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}

loginServer();

function checkLogin(userName, password) {
    let data = fs.readFileSync("login_server_logins.json");

    let loginsArray = JSON.parse(data);

    for (let i = 0; i < loginsArray.length; i++) {
        if (loginsArray[i].login === userName && loginsArray[i].password === password)
            return loginsArray[i];
    }
}

function createNewUser(userName, password) {
    if (userName.length < 1)
        return "User name must be over 1 character long.";

    let data = fs.readFileSync("login_server_logins.json");
    let loginsArray = JSON.parse(data);

    for (let i = 0; i < loginsArray.length; i++) {
        if (loginsArray[i].login === userName)
            return "Duplicate user names cannot exist.";
    }

    loginsArray.push({login: userName, password: password});
    fs.writeFileSync("login_server_logins.json", JSON.stringify(loginsArray));
    return "User created.";
}