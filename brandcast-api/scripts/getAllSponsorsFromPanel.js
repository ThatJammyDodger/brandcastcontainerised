import { sponsorFromUrl } from "./sponsorFromUrl.js";
import { sponsorFromImg } from "./sponsorFromImg.js";

export async function getAllSponsorsFromPanel(arrOfUrlUrls, arrOfImgUrls) {
    const sponsors = []
    arrOfUrlUrls.forEach(url => {
        sponsors.push(sponsorFromUrl(url))
    })
    let count = 0
    for (const url of arrOfImgUrls) {
        count++
        const x = await sponsorFromImg(url)
        if (x !== "NO_SPONSOR_DETECTED")
            sponsors.push(x)
        if (count === 2) {
            break
        }
    }
    return sponsors
}