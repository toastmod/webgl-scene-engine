// Pass in the current time of the playing track
function furpPos(curTime) {
	y = sin(map(curTime, noteTime1, noteTime2, 0.0, 1.0));
	x = map(curTime, noteTime1, noteTime2, prevNoteX, nextNoteX);
}
