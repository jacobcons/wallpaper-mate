import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createWriteStream, existsSync, readFileSync, writeFileSync } from 'fs';
import { extname } from 'path';
import fetch from 'node-fetch';
import { getWallpaper, setWallpaper } from 'wallpaper';
import { getResolution, Resolution } from 'get-screen-resolution';
import { appendFileSync } from 'node:fs';

await main();

async function main() {
  // setup command-line options
  const y = yargs(hideBin(process.argv));
  const {
    queries,
    interval,
    resolution: resolutionArgument,
  } = await y
    .usage(
      '$0 [-q <queries...>] [-i <hours> <minute> <seconds>] [-r <width> <height>]',
    )
    .option('queries', {
      alias: 'q',
      array: true,
      description:
        'List of query terms to search for wallpapers under, <queries...> e.g. space nature',
      default: '',
      defaultDescription: 'search under all wallpapers',
      coerce(values: string[]): string[] {
        return values;
      },
    })
    .option('interval', {
      alias: 'i',
      type: 'array',
      description:
        'Time interval between updating wallpaper, <hours> <minutes> <seconds> e.g. 0 30 0',
      defaultDescription: 'update wallpaper immediately just once',
      coerce(values: number[]): number {
        // ensure 3 non-negative integers are provided for hours, minutes and seconds
        validateNonNegativeIntegerArray(
          values,
          3,
          'Interval must consist of 3 non-negative integers in the format <hours> <minutes> <seconds> e.g. 0 30 0',
        );

        // extract hours, minutes and seconds making up interval and compute that in total number of milliseconds
        const [hours, minutes, seconds] = values;
        const MILLISECONDS_IN_SECOND = 1000;
        const MILLISECONDS_IN_MINUTE = MILLISECONDS_IN_SECOND * 60;
        const MILLISECONDS_IN_HOUR = MILLISECONDS_IN_MINUTE * 60;
        return (
          seconds * MILLISECONDS_IN_SECOND +
          minutes * MILLISECONDS_IN_MINUTE +
          hours * MILLISECONDS_IN_HOUR
        );
      },
    })
    .option('resolution', {
      alias: 'r',
      type: 'array',
      description:
        'Minimum resolution of the wallpaper, <width> <height> e.g. 1920 1080',
      defaultDescription: "fetch your screen's resolution",
      coerce(values: number[]): Resolution {
        // ensure 2 non-negative integers are provided for width and height
        validateNonNegativeIntegerArray(
          values,
          2,
          'Resolution must consist of 2 non-negative integers in the format <width> <height> e.g. 1920 1080',
        );

        // extract width and height
        const [width, height] = values;
        return { width, height };
      },
    })
    .alias('h', 'help')
    .alias('v', 'version')
    .example([
      ['$0', 'Set desktop to a random wallpaper'],
      [
        '$0 -q space',
        "Set desktop to a random wallpaper searching under the term 'space'",
      ],
      [
        '$0 -q nature cowboy',
        "Set desktop to a random wallpaper searching under the terms 'nature' and 'cowboy'",
      ],
      [
        '$0 -q "animal crossing" -i 0 10 0',
        "Set desktop to a random wallpaper searching under the term 'animal crossing' every 10 minutes",
      ],
      [
        '$0 -i 1 0 0 -r 3840 2160 ',
        'Set desktop to a random wallpaper every hour, only fetch wallpapers with a resolution that is at least 3840x2160',
      ],
    ])
    .wrap(Math.min(160, y.terminalWidth()))
    .parse();

  // if resolution isn't provided as option =>
  // fetch the screen's resolution and cache that value to disk if needed when program is ran again
  let resolution;
  const RESOLUTION_CACHE_FILE = 'resolution.txt';
  if (resolutionArgument) {
    resolution = resolutionArgument;
  } else if (existsSync(RESOLUTION_CACHE_FILE)) {
    resolution = JSON.parse(readFileSync(RESOLUTION_CACHE_FILE, 'utf-8'));
  } else {
    try {
      const fetchedResolution = await getResolution();
      writeFileSync('resolution.txt', JSON.stringify(fetchedResolution));
      resolution = fetchedResolution;
    } catch (err) {
      return errorAndExit(
        "Unable to get your screen's resolution. Please supply one with the -r option e.g. -r 1920 1080",
      );
    }
  }

  if (!interval) {
    // no interval option => update the wallpaper just once
    await fetchAndSetWallpaper(queries, resolution);
  } else {
    // interval option => update wallpaper immediately and then again on repeat after each interval has passed
    await fetchAndSetWallpaper(queries, resolution);
    setInterval(async () => {
      await fetchAndSetWallpaper(queries, resolution);
    }, interval);
  }
}

// ensure array consists only of non-negative integers and is of desiredLength => otherwise error
function validateNonNegativeIntegerArray(
  values: number[],
  desiredLength: number,
  errorMsg: string,
): void {
  if (
    values.length !== desiredLength ||
    values.some((value) => !Number.isInteger(value) || value < 0)
  ) {
    return errorAndExit(errorMsg);
  }
}

function errorAndExit(msg: string): void {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

// generate random integer between max and min inclusive
function randomInt(max: number, min: number = 0): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[randomInt(array.length - 1)];
}

// fetch wallpaper with at least the given resolution, using one of the given query terms at random => set desktop background to that wallpaper
async function fetchAndSetWallpaper(queries: string[], resolution: Resolution) {
  const q = randomChoice<string>(queries);

  // get the total number of pages
  const firstPageResponse = await fetch(
    `https://wallhaven.cc/api/v1/search?q=${q}&atleast=${resolution.width}x${resolution.height}`,
  );
  checkTooManyRequestsResponse(firstPageResponse);
  const firstPageJson = (await firstPageResponse.json()) as any;
  const totalPages = firstPageJson.meta.last_page;
  const totalWallpapers = firstPageJson.meta.total;
  if (totalWallpapers === 0) {
    return errorAndExit('No wallpapers found matching your query');
  }

  // get a random page => get random wallpaper => get its image url
  const randomPageResponse = await fetch(
    `https://wallhaven.cc/api/v1/search?q=${q}&page=${randomInt(totalPages, 1)}&atleast=${resolution.width}x${resolution.height}`,
  );
  checkTooManyRequestsResponse(randomPageResponse);
  const randomPageJson = (await randomPageResponse.json()) as any;
  const wallpapers = randomPageJson.data;
  const imageUrl = randomChoice<any>(wallpapers)?.path;

  // download the image to disk from its url => set desktop wallpaper using it
  const imageResponse = (await fetch(imageUrl)) as any;
  checkTooManyRequestsResponse(imageResponse);
  const wallpaperPath = `./wallpaper${extname(imageUrl)}`;
  const fileStream = createWriteStream(wallpaperPath);
  imageResponse.body.pipe(fileStream);
  fileStream.on('finish', async () => {
    await setWallpaper(wallpaperPath);
  });
}

// if response indicates too many requests have been made => display error and exit
function checkTooManyRequestsResponse(res: any) {
  if (res.status === 429) {
    return errorAndExit(
      'API rate limit reached (around 45 per minute), please try running again later.',
    );
  }
}
