const functions = require('firebase-functions');
const app = require('express')();
const FBAuth = require('./util/fbAuth');

const cors = require('cors');
app.use(cors());

const { db } = require('./util/admin');

const { getAllReibun, postOneReibun, getReibun, commentOnReibun, likeReibun, unlikeReibun, deleteReibun } = require('./handlers/reibun');
const { signUp, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead } = require('./handlers/users');

// Reibun routes
app.get('/reibun', getAllReibun);
app.post('/reibun', FBAuth, postOneReibun);
app.get('/reibun/:reibunId', getReibun);
app.delete('/reibun/:reibunId', FBAuth, deleteReibun);
app.get('/reibun/:reibunId/like', FBAuth, likeReibun);
app.get('/reibun/:reibunId/unlike', FBAuth, unlikeReibun);
app.post('/reibun/:reibunId/comment', FBAuth, commentOnReibun);

// Users routes
app.post('/signup', signUp);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

exports.api = functions.region('europe-west1').https.onRequest(app);

exports.createNotificationOnLike = functions.region('europe-west1').firestore.document('likes/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/reibun/${snapshot.data().reibunId}`).get()
            .then(doc => {
                if(doc.exists && doc.data().userHandle !== snapshot.data.userHandle){
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'like',
                        read: false,
                        reibunId: doc.id
                    });
                }
            })
            .catch(err=>{
                console.error(err);
                // No need for JSON response as this is not an API endpoint
            })
    });

exports.deleteNotificationOnUnlike = functions.region('europe-west1').firestore.document('likes/{id}')
    .onDelete((snapshot) => {
      return db.doc(`/notifications/${snapshot.id}`)
        .delete()
        .catch(err => {
            console.error(err);
            return;
        })
    })

exports.createNotificationOnComment = functions.region('europe-west1').firestore.document('comments/{id}')
    .onCreate((snapshot) => {
        return db.doc(`/reibun/${snapshot.data().reibunId}`).get()
            .then(doc => {
                if(doc.exists && doc.data().userHandle !== snapshot.data.userHandle){
                    return db.doc(`/notifications/${snapshot.id}`).set({
                        createdAt: new Date().toISOString(),
                        recipient: doc.data().userHandle,
                        sender: snapshot.data().userHandle,
                        type: 'comment',
                        read: false,
                        reibunId: doc.id
                    });
                }
            })
            .catch(err=>{
                console.error(err);
                return
            })
    });

// Updating user image shown on individual reibun if user changes  it

exports.onUserImageChange = functions.region('europe-west1').firestore.document('/users/{userId}')
    .onUpdate((change) => {
        console.log(change.before.data());
        console.log(change.after.data());
        if(change.before.data().imageUrl !== change.after.data().imageUrl){
            console.log('Image has changed');
            let batch = db.batch();
            return db.collection('reibun').where('userHandle', '==', change.before.data().handle).get()
            .then((data) => {
                data.forEach(doc => {
                    const reibun = db.doc(`reibun/${doc.id}`);  
                    batch.update(reibun, { userImage: change.after.data().imageUrl});             
                })
                return batch.commit();
            })
        }
    })

exports.onReibunDelete = functions
.region('europe-west1')
.firestore.document('/reibun/{reibunId}')
.onDelete((snapshot, context) => {
    const reibunId = context.params.reibunId;
    const batch = db.batch();
    return db
    .collection('comments')
    .where('reibunId', '==', reibunId)
    .get()
    .then((data) => {
        data.forEach((doc) => {
        batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db
        .collection('likes')
        .where('reibunId', '==', reibunId)
        .get();
    })
    .then((data) => {
        data.forEach((doc) => {
        batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
        .collection('notifications')
        .where('reibunId', '==', reibunId)
        .get();
    })
    .then((data) => {
        data.forEach((doc) => {
        batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
    })
    .catch((err) => console.error(err));
});

