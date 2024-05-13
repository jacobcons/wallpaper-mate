import commander from 'commander';
const program = new commander.Command();

program
  .option(
    '-q, --query <strings...>',
    "List of query terms to search for wallpapers under e.g. '-q space nature' (if not supplied => it'll search under all wallpapers)",
  )
  .option(
    '-i, --interval <HH:MM:SS>',
    "Time interval between updating wallpaper e.g. '-i 00:30:00' (if not supplied => it'll update wallpaper immediately just once)",
    (interval) => {
      const regex = /^([01]?[0-9]|2[0-3]):([0-5]?[0-9]):([0-5]?[0-9])$/;
      const match = interval.match(regex);
      if (!match) {
        throw new commander.InvalidArgumentError(
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

const { query, interval } = program.opts();

if (!interval) {
}
