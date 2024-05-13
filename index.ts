import { Command, InvalidArgumentError } from 'commander';
import { createWriteStream } from 'fs';
import fetch from 'node-fetch';
import { extname } from 'path';
import { setWallpaper } from 'wallpaper';
const program = new Command();

program
  .option(
    '-q, --queries <strings...>',
    "List of query terms to search for wallpapers under e.g. '-q space nature' (if not supplied => it'll search under all wallpapers)",
  )
  .option(
    '-i, --interval <HH:MM:SS>',
    "Time interval between updating wallpaper e.g. '-i 00:30:00' (if not supplied => it'll update wallpaper immediately just once)",
    (interval: string): number => {
      const regex = /^([01]?[0-9]|2[0-3]):([0-5]?[0-9]):([0-5]?[0-9])$/;
      const match = interval.match(regex);
      if (!match) {
        throw new InvalidArgumentError(
          'Interval must be of format HH:mm:ss. Hours must be an integer between 0 and 23, minutes an integer between 0 and 59, and seconds an integer between 0 and 59',
        );
      }

      let [_, hours, minutes, seconds] = match.map((group) => parseInt(group));
      const MILLISECONDS_IN_SECOND = 1000;
      const MILLISECONDS_IN_MINUTE = MILLISECONDS_IN_SECOND * 60;
      const MILLISECONDS_IN_HOUR = MILLISECONDS_IN_MINUTE * 60;
      return (
        seconds * MILLISECONDS_IN_SECOND +
        minutes * MILLISECONDS_IN_MINUTE +
        hours * MILLISECONDS_IN_HOUR
      );
    },
  );

program.parse();

const { queries = [''], interval } = program.opts();

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

if (!interval) {
  const imageUrlPromises = queries.map((q: string) =>
    fetch(
      `https://wallhaven.cc/api/v1/search?q=${q}&sorting=random&atleast=1920x1080`,
    )
      .then((res) => res.json())
      .then((res: any) => res.data[0].path),
  );
  const imageUrls = await Promise.all(imageUrlPromises);
  const imageUrl = randomChoice<string>(imageUrls);

  const res = await fetch(imageUrl);
  if (!res.body) {
    throw new Error('Failed to fetch image');
  }

  const wallPaperPath = `./wallpaper${extname(imageUrl)}`;
  const fileStream = createWriteStream(wallPaperPath);
  res.body.pipe(fileStream);
  fileStream.on('finish', async () => {
    await setWallpaper(wallPaperPath);
  });
}
