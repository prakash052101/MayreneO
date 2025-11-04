import { usePlayer } from '../contexts/PlayerContext';

/**
 * Custom hook for integrating tracks with the player
 */
export const useTrackPlayer = () => {
  const { 
    currentTrack, 
    isPlaying, 
    queue, 
    playTrack, 
    playQueue, 
    addToQueue,
    togglePlayPause 
  } = usePlayer();

  /**
   * Play a single track
   */
  const handlePlayTrack = (track) => {
    if (currentTrack && currentTrack.id === track.id) {
      // If it's the same track, just toggle play/pause
      togglePlayPause();
    } else {
      // Play new track
      playTrack(track);
    }
  };

  /**
   * Play a track from a list (e.g., search results, playlist)
   */
  const handlePlayFromList = (track, trackList, startIndex = 0) => {
    const trackIndex = trackList.findIndex(t => t.id === track.id);
    const indexToUse = trackIndex >= 0 ? trackIndex : startIndex;
    
    playQueue(trackList, indexToUse);
  };

  /**
   * Add track to queue
   */
  const handleAddToQueue = (track) => {
    addToQueue(track);
  };

  /**
   * Check if a track is currently playing
   */
  const isTrackPlaying = (track) => {
    return currentTrack && currentTrack.id === track.id && isPlaying;
  };

  /**
   * Check if a track is the current track (but may be paused)
   */
  const isCurrentTrack = (track) => {
    return currentTrack && currentTrack.id === track.id;
  };

  return {
    currentTrack,
    isPlaying,
    queue,
    handlePlayTrack,
    handlePlayFromList,
    handleAddToQueue,
    isTrackPlaying,
    isCurrentTrack,
    togglePlayPause
  };
};

export default useTrackPlayer;