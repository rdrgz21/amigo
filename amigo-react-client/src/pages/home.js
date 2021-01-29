import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Grid from '@material-ui/core/Grid';

import Reibun from '../components/Reibun';
import Profile from '../components/Profile';

export default function Home() {

    const [reibun, updateReibun] = useState(null);

    useEffect(() => {
        axios.get('/reibun')
            .then(res => {
                console.log(res.data);
                updateReibun(res.data)
            })
            .catch(err => console.log(err));
    }, []);

    let recentReibunMarkup = reibun ? (
        reibun.map(reibun => <Reibun key={reibun.reibunId} reibun={reibun} />)
    ) : <p>Loading...</p>

    return (
        <Grid container spacing={2}>
            <Grid item sm={8} xs={12}>
                {recentReibunMarkup}
            </Grid>
            <Grid item sm={4} xs={12}>
                <Profile />
            </Grid>
        </Grid>
    )
}
