#! set environ for magick testing
#!

export MAGICK_HOME="$HOME/ImageMagick-7.0.7"
export PATH="$MAGICK_HOME/bin:$PATH"
export DYLD_LIBRARY_PATH="$MAGICK_HOME/lib/"
#! echo $DYLD_LIBRARY_PATH

magick $1 $2 $3 $4 $5 $6 $7

