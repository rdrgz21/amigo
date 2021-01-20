const { DocumentBuilder } = require('firebase-functions/lib/providers/firestore');
const { db } = require('../util/admin');

exports.getAllReibun = (req, res) => {
    db
        .collection('reibun')
        .orderBy('createdAt', 'desc')
        .get()
            .then(data => {
                let reibun = [];
                data.forEach(doc => {
                    reibun.push({
                        reibunId: doc.id,
                        body: doc.data().body,
                        userHandle: doc.data().userHandle,
                        createdAt: doc.data().createdAt,
                        commentCount: doc.data().commentCount,
                        likeCount: doc.data().likeCount,
                        userImage: doc.data().userImage
                    });
                });
                return res.json(reibun);
            })
            .catch(err => console.error(err));
}

exports.postOneReibun = (req, res) => {
    if(req.method !== 'POST'){
        return res.status(400).json({ error: "Method not allowed" });
    }
    const newReibun = {
        body: req.body.body,
        // user handle attached to req.user as part of middleware function
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };

    db
        .collection('reibun')
        .add(newReibun)
        .then(doc => {
            const resReibun = newReibun;
            resReibun.reibunId = doc.id;
            res.json(resReibun);
        })
        .catch(err => {
            res.status(500).json({ error: "something went wrong" });
            console.error(err);
        });
}

// Fetch single reibun

exports.getReibun = (req, res) => {
    let reibunData = {};
    db.doc(`/reibun/${req.params.reibunId}`)
        .get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Reibun not found' });
            } 
            reibunData = doc.data();
            reibunData.reibunId = doc.id;
            return db.collection('comments').orderBy('createdAt', 'desc').where('reibunId', '==', req.params.reibunId).get();
        })
        .then(data => {
            reibunData.comments = [];
            data.forEach(doc => {
                reibunData.comments.push(doc.data());
            });
            return res.json(reibunData);
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code });
        });
};

// Comment on a reibun

exports.commentOnReibun = (req, res) => {
    if(req.body.body.trim() === '') return res.status(400).json({ comment: 'Must not be empty'});

    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        reibunId: req.params.reibunId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    };

    db.doc(`/reibun/${req.params.reibunId}`).get()
    .then(doc=>{
        if (!doc.exists) {
            return res.status(404).json({ error: 'Reibun not found' })
        }
        return doc.ref.update({ commentCount: doc.data().commentCount + 1})
    })
    .then (()=>{
        return db.collection('comments').add(newComment);
    })
    .then(() => {
        res.json(newComment);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({ error: 'Something went wrong' });
    });
}
// Like a reibun
exports.likeReibun = (req, res) => {
    const likeDocument = db.collection('likes').where('userHandle', "==", req.user.handle)
        .where('reibunId', "==", req.params.reibunId).limit(1);
    
    const reibunDocument = db.doc(`/reibun/${req.params.reibunId}`);

    let reibunData = {};

    // First retrieve the reibun
    reibunDocument.get()
        .then(doc => {
            // If reibun exists, returns corresponding like document and values of reibunData updated
            if(doc.exists){
                reibunData = doc.data();
                reibunData.reibunId = doc.id;
                return likeDocument.get()
            } else {
                return res.status(404).json({ error: 'Reibun not found' });
            }
        })
        // If like document empty (user has not previously liked it) then adds to collection 
        .then(data => {
            if(data.empty){
                return db.collection('likes').add({
                    reibunId: req.params.reibunId,
                    userHandle: req.user.handle
                })
                // Updates the like count
                .then(() => {
                    reibunData.likeCount++
                    return reibunDocument.update({ likeCount: reibunData.likeCount });
                })
                .then(() => {
                    return res.json(reibunData);
                })
            } else {
                return res.status(400).json({ error: 'Reibun already liked' });
            }
        }) 
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code });
        })
};

exports.unlikeReibun = (req, res) => {
    const likeDocument = db.collection('likes').where('userHandle', "==", req.user.handle)
        .where('reibunId', "==", req.params.reibunId).limit(1);
    
    const reibunDocument = db.doc(`/reibun/${req.params.reibunId}`);

    let reibunData = {};

    reibunDocument.get()
        .then(doc => {
            if(doc.exists){
                reibunData = doc.data();
                reibunData.reibunId = doc.id;
                return likeDocument.get()
            } else {
                return res.status(404).json({ error: 'Reibun not found' });
            }
        })
        .then(data => {
            if(data.empty){
                return res.status(400).json({ error: 'Reibun not liked' });
            } else {
                return db.doc(`likes/${data.docs[0].id}`).delete()
                .then(() => {
                    reibunData.likeCount--;
                    return reibunDocument.update({ likeCount: reibunData.likeCount});
                })
                .then(() => {
                    res.json(reibunData);
                })
            }
        }) 
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err.code });
        })
};
// Delete reibun

exports.deleteReibun = (req, res) => {
    const document = db.doc(`/reibun/${req.params.reibunId}`);
    document.get()
        .then(doc => {
            if(!doc.exists){
                return res.status(404).json({ eror: 'Reibun not found'});
            }
            if(doc.data().userHandle !== req.user.handle){
                return res.status(403).json({ error: 'Unauthorised'});
            } else {
                return document.delete();
            }
        })
        .then(() => {
            res.json({ message: 'Reibun deleted successfully'});
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code });
        })
}