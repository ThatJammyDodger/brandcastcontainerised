import express from 'express';
import TwitchScraper from './twitch-scraper.js';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from '@firebase/firestore';
import database from './database.js';
import { getLiveStreamerIds } from './scripts/getStreamerIds.js';
import StreamFetcher from './streamFetcher.js';
import {compareAgainstStreamers} from "./scripts/embeddings/compareAgainstStreamers.js";
// import database from './database.js';
// import { claudeEndpointForClient } from './scripts/claudeEndpointForClient.js';
const app = express();
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/streamer/:streamer', async (req, res) => {
    const userDoc = await getDoc(doc(database, "streamers", req.params["streamer"].toLowerCase()));

    if (userDoc.exists()) {
        res.json(userDoc.data());
    } else {
        const result = await TwitchScraper(req.params["streamer"], null);
        res.json(result)
    }
})

app.post('/newProject', async (req, res) => {
    const data = req.body;

    const country = data["country"];
    const tags = data["tags"];
    const budget = data["budget"];

    // do streamer matching
    const streamers = []

    await setDoc(doc(database, "project"), {
        streamers: streamers.map(streamer => {return {
            id: `/streamers/${streamer}`,
            streamerStatus: "not selected"
        }}),
        title: data["title"],
        userId: data["userId"],
        loading: false
    })
})

app.get('/projects/:userId', async (req, res) => {
    const projects = await getDocs(query(collection(database, "project"), where("userId", "==", req.params["userId"])));

    res.json(projects.docs);
})

app.get('/streamerSearch/:userId', async (req, res) => {
    const dbQuery = (await getDoc(doc(database, "users/" + req.params["userId"] + '/companyProfile/main'))).data();

    console.log(dbQuery);

    const company = dbQuery;

    const tingsToPassInit = (company.adContent?.keywords?.join(' ') || '') + ' ' + (company.targetAudience.demographics.join(' ') || '') + ' ' + (company.targetAudience.interests.join(' ') || '');

    console.log(tingsToPassInit);

    const resultjson = await compareAgainstStreamers(tingsToPassInit);

    res.json(resultjson);
})

app.get('/project/:projectId', async (req, res) => {
    const projects = await getDoc(doc(database, "project", req.params["projectId"]));

    if (projects.exists()) {
        res.json(projects.data());
    } else {
        res.json(null);
    }
})

// app.get('/claude/:prompt', async (req, res) => {
//     const result = await claudeEndpointForClient(req.params["prompt"]);
//     res.json(result);
// })

// StreamFetcher();

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;