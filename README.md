# Wallpaper Mate

> Wallpaper Mate is a command-line tool that allows you to update your desktop background with a fresh, random new wallpaper. 
You can specify the search terms you want to look under e.g. space, nature. Additionally, you can refresh your wallpaper
based on an interval you specify.

Works on
- Windows
- MacOS
- Linux (requires ImageMagick if you want program to automatically fetch your screen's resolution `apt-get install imagemagick`)

## Install

```sh 
npm i -g wallpaper-mate
```

## Usage

```
wp-mate [-q <queries...>] [-i <hours> <minute> <seconds>] [-r <width> <height>]
                                                                                                                                                                
Options:                                                                                                                                                        
  -q, --queries     List of query terms to search for wallpapers under, <queries...> e.g. space nature            [array] [default: search under all wallpapers]
  -i, --interval    Time interval between updating wallpaper, <hours> <minutes> <seconds> e.g. 0 30 0  [array] [default: update wallpaper immediately just once]
  -r, --resolution  Minimum resolution of the wallpaper, <width> <height> e.g. 1920 1080                       [array] [default: fetch your screen's resolution]
  -h, --help        Show help                                                                                                                          [boolean]
  -v, --version     Show version number                                                                                                                [boolean]

Examples:
  wp-mate                                   Set desktop to a random wallpaper
  wp-mate -q space                          Set desktop to a random wallpaper searching under the term 'space'
  wp-mate -q nature cowboy                  Set desktop to a random wallpaper searching under the terms 'nature' and 'cowboy'
  wp-mate -q "animal crossing" -i 0 10 0    Set desktop to a random wallpaper searching under the term 'animal crossing' every 10 minutes
  wp-mate -i 1 0 0 -r 3840 2160             Set desktop to a random wallpaper every hour, only fetch wallpapers with a resolution that is at least 3840x2160 
```