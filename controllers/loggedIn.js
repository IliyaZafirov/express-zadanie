const { client } = require('../config/db-config');
const jwt = require('jsonwebtoken');
const loggedIn = async (req, res, next) => {
    if (!req.cookies.userRegistered) return next();
    try {

        const decoded = jwt.verify(req.cookies.userRegistered, process.env.JWT_SECRET);

        const query = 'SELECT * FROM users WHERE id = $1'; // must be edited? it must have only one record in users table
        const values = [decoded.id];

        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return res.sendStatus(401);
        }

        req.user = result.rows[0];
        return next();

    } catch (err) {
        console.log(err.message || err);
        if (err) return next();

    }
}
module.exports = loggedIn;