Dumb script to process and store a youtube video from its subtitles.
The script assumes that the subtitles were downloaded with youtube-dl.

```
sudo pip install --upgrade youtube_dl
sudo pip install pysrt

youtube-dl --write-sub --write-auto-sub -x --audio-format wav <video_url>
```
