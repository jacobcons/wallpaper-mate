import { Command, InvalidArgumentError } from 'commander';
import { createWriteStream } from 'fs';
import fetch from 'node-fetch';
import { extname } from 'path';
import { setWallpaper } from 'wallpaper';
import { getResolution } from 'get-screen-resolution';
async function main() {
    const program = new Command();
    program
        .option('-q, --queries <strings...>', "List of query terms to search for wallpapers under e.g. -q space nature (if not supplied => it'll search under all wallpapers)")
        .option('-i, --interval <hours:minutes:seconds>', "Time interval between updating wallpaper e.g. -i 00:30:00 (if not supplied => it'll update wallpaper immediately just once)", (value) => {
        const regex = /^(\d+):(\d+):(\d+)$/;
        const match = value.match(regex);
        if (!match) {
            throw new InvalidArgumentError('Interval must be of format hours:minutes:seconds where each component is an integer e.g. 12:62:101');
        }
        let [_, hours, minutes, seconds] = match.map((group) => parseInt(group));
        const MILLISECONDS_IN_SECOND = 1000;
        const MILLISECONDS_IN_MINUTE = MILLISECONDS_IN_SECOND * 60;
        const MILLISECONDS_IN_HOUR = MILLISECONDS_IN_MINUTE * 60;
        return (seconds * MILLISECONDS_IN_SECOND +
            minutes * MILLISECONDS_IN_MINUTE +
            hours * MILLISECONDS_IN_HOUR);
    })
        .option('-r --resolution <widthxheight>', "Minimum resolution of the wallpaper e.g. -r 1920x1080 (if not supplied => fetch your screen's resolution)", (value) => {
        const regex = /^(\d+)x(\d+)$/;
        const match = value.match(regex);
        if (!match) {
            throw new InvalidArgumentError('Resolution must be of the format widthxheight where each component is an integer e.g. 1920x1080');
        }
        const [_, width, height] = match.map((group) => parseInt(group));
        return { width, height };
    });
    program.parse();
    const { queries = [''], interval, resolution } = program.opts();
    let width, height;
    try {
        ({ width, height } = resolution || (await getResolution()));
    }
    catch (err) {
        throw new Error("Unable to get your screen's resolution. Please supply one with the -r option e.g. -r 1920x1080");
    }
    function randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    if (!interval) {
        const q = randomChoice(queries);
        const wallpapersResponse = await fetch(`https://wallhaven.cc/api/v1/search?q=${q}&sorting=random&atleast=${width}x${height}`);
        const wallpapersJson = await wallpapersResponse.json();
        const imageUrl = wallpapersJson.data[0].path;
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.body) {
            throw new Error('Failed to fetch image');
        }
        const wallpaperPath = `./wallpaper${extname(imageUrl)}`;
        const fileStream = createWriteStream(wallpaperPath);
        imageResponse.body.pipe(fileStream);
        fileStream.on('finish', async () => {
            await setWallpaper(wallpaperPath);
        });
    }
}
console.time();
try {
    await main();
}
catch (err) {
    const error = err;
    console.error(`error: ${error.message}`);
    process.exit(1);
}
console.timeEnd();
