import puppeteer from 'puppeteer';

export async function acquireUsernames(desiredLength) {
    // Launch Puppeteer in headless mode.
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    let results = [];
    let pageNum = 1;
    let hasData = true;

    while (hasData) {
        // Construct URL with pagination support.
        const url = `https://twitchtracker.com/channels/ranking${pageNum > 1 ? '?page=' + pageNum : ''}`;
        console.log(`Scraping page ${pageNum}: ${url}`);

        // Navigate to the page.
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Extract data from the table.
        const pageData = await page.evaluate(() => {
            // Get all rows from the table's body.
            const rows = Array.from(document.querySelectorAll('table tbody tr'));

            return rows.map(row => {
                const cells = row.querySelectorAll('td');
                // Adjusted indexes:
                // cells[0] -> Rank (ignored)
                // cells[1] -> Possibly an image or empty
                // cells[2] -> Channel name
                // cells[3] -> Average viewers (30 days)
                // cells[4] -> Time streamed (30 days)
                // cells[5] -> Followers gained (30 days)
                return {
                    channel: cells[2] ? cells[2].innerText.trim().toLowerCase() : null,
                    recentAverageViewers: cells[3] ? cells[3].innerText.trim().replace(',','') : null,
                    recentTimeStreamed: cells[4] ? cells[4].innerText.trim().split('\n')[0] : null,
                    recentFollowersGained: cells[5] ? cells[5].innerText.trim().replace(',','') : null
                };
            });
        });

        // If no rows are returned, we've reached the end.
        if (!pageData || pageData.length === 0) {
            console.log('No more data found; ending pagination.');
            hasData = false;
            break;
        }

        if (results.length >= desiredLength) {
            console.log(`Found sufficient entries; ending pagination.`);
            results = results.slice(0, desiredLength);
            hasData = false;
            break
        }

        results.push(...pageData);
        console.log(`Found ${pageData.length} entries on page ${pageNum}.`);
        pageNum++;
    }
    await browser.close();

    // Output the scraped data.
    return results;

}