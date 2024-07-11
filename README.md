# Wallpaper Mate

> Wallpaper Mate is a CLI tool that sets your desktop background to a random wallpaper fetched from a pool of over a million images.
You can specify search terms to look under (e.g. space, cowboy), and set it to run at intervals. It also
fetches your screen's resolution to ensure the best quality images.



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
wpmate [-q <queries...>] [-i <hours> <minute> <seconds>] [-r <width> <height>]
                                                                                                                                                                
Options:                                                                                                                                                        
  -q, --queries     List of query terms to search for wallpapers under, <queries...> e.g. space nature            [array] [default: search under all wallpapers]
  -i, --interval    Time interval between updating wallpaper, <hours> <minutes> <seconds> e.g. 0 30 0  [array] [default: update wallpaper immediately just once]
  -r, --resolution  Minimum resolution of the wallpaper, <width> <height> e.g. 1920 1080                       [array] [default: fetch your screen's resolution]
  -h, --help        Show help                                                                                                                          [boolean]
  -v, --version     Show version number                                                                                                                [boolean]

Examples:
  wpmate                                   Set desktop to a random wallpaper
  wpmate -q space                          Set desktop to a random wallpaper searching under the term 'space'
  wpmate -q nature cowboy                  Set desktop to a random wallpaper searching under the terms 'nature' and 'cowboy'
  wpmate -q "animal crossing" -i 0 10 0    Set desktop to a random wallpaper searching under the term 'animal crossing' every 10 minutes
  wpmate -i 1 0 0 -r 3840 2160             Set desktop to a random wallpaper every hour, only fetch wallpapers with a resolution that is at least 3840x2160 
```