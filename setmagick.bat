REM set environ for magick testing
REM

SET MAGICK_HOME="$HOME/ImageMagick-7.0.7"
SET PATH="$MAGICK_HOME/bin:$PATH"
SET DYLD_LIBRARY_PATH="$MAGICK_HOME/lib/"
REM echo $DYLD_LIBRARY_PATH

magick $1 $2 $3 $4 $5 $6 $7

