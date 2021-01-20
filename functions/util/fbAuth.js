const { admin, db } = require('./admin');

module.exports = (req, res, next) => {
    let idToken;
    // Finding and extracting the token
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        console.error('No token found');
        return res.status(403).json({ error: 'Unauthorised'});
    }

    // Need to check that the token was authorised from our side and not elsewhere
    // Decoded token returns user info which is assigned to req.user
    admin
        .auth()
        .verifyIdToken(idToken)
        .then(decodedToken => {
            req.user = decodedToken;
            console.log(decodedToken);
            // Checking to find the user in the DB and return as data
            return db
                .collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get();
        })
        // Find the handle of returned user and assigned to req.user.userHandle, now included as part of the req
        .then(data => {
            req.user.handle = data.docs[0].data().handle;
            req.user.imageUrl = data.docs[0].data().imageUrl;
            return next();
        })
        .catch(err => {
            console.error('Error while verifying token', err);
            return res.status(403).json(err);
        })
}