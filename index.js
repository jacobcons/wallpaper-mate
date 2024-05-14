import { Command, InvalidArgumentError } from 'commander';
import { createWriteStream, existsSync, readFileSync, writeFileSync } from 'fs';
import fetch from 'node-fetch';
import { extname } from 'path';
import { setWallpaper } from 'wallpaper';
import { getResolution } from 'get-screen-resolution';
try {
    await main();
}
catch (err) {
    const error = err;
    console.error(`error: ${error.message}`);
    process.exit(1);
}
async function main() {
    // setup command-line options
    const program = new Command();
    program
        .option('-q, --queries <strings...>', "List of query terms to search for wallpapers under e.g. -q space nature (if not supplied => it'll search under all wallpapers)")
        .option('-i, --interval <hours:minutes:seconds>', "Time interval between updating wallpaper e.g. -i 00:30:00 (if not supplied => it'll update wallpaper immediately just once)", (value) => {
        // extract hours, minutes and seconds from interval and convert to total number of milliseconds
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
        // extract the width and height specified in resolution
        const regex = /^(\d+)x(\d+)$/;
        const match = value.match(regex);
        if (!match) {
            throw new InvalidArgumentError('Resolution must be of the format widthxheight where each component is an integer e.g. 1920x1080');
        }
        const [_, width, height] = match.map((group) => parseInt(group));
        return { width, height };
    });
    // extract options
    program.parse();
    const { queries = [''], interval, resolution } = program.opts();
    // set width and height to provided resolution option -r if given
    // otherwise fetch the screen's resolution and cache that value to disk if needed when program is ran again
    let width, height;
    const RESOLUTION_CACHE_FILE = 'resolution.txt';
    if (resolution) {
        ({ width, height } = resolution);
    }
    else {
        if (existsSync(RESOLUTION_CACHE_FILE)) {
            const cachedResolution = readFileSync(RESOLUTION_CACHE_FILE, 'utf-8').split(' ');
            width = cachedResolution[0];
            height = cachedResolution[1];
        }
        else {
            try {
                ({ width, height } = await getResolution());
                writeFileSync('resolution.txt', `${width} ${height}`);
            }
            catch (err) {
                throw new Error("Unable to get your screen's resolution. Please supply one with the -r option e.g. -r 1920x1080");
            }
        }
    }
    // choose a random element from an array
    function randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    // if no interval is specified => update the wallpaper just once
    if (!interval) {
        // get the url of a wallpaper chosen from one the given query terms
        const q = randomChoice(queries);
        const wallpapersResponse = await fetch(`https://wallhaven.cc/api/v1/search?q=${q}&sorting=random&atleast=${width}x${height}`);
        const wallpapersJson = await wallpapersResponse.json();
        const imageUrl = wallpapersJson.data[0].path;
        // get the binary data of the image at said url => save it to disk => set desktop wallpaper using it
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
