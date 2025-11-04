import React from "react";
import { useTrackPlayer } from "../../hooks/useTrackPlayer";
import "./Track.css";

const Track = ({ 
  track, 
  isRemoval, 
  onAdd, 
  onRemove, 
  showPlayButton = true, 
  trackList = null,
  trackIndex = null,
  totalTracks = null
}) => {
  const { handlePlayTrack, handlePlayFromList, isTrackPlaying, isCurrentTrack } = useTrackPlayer();

  const handleAdd = () => {
    if (onAdd) {
      onAdd(track);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove(track);
    }
  };

  const handlePlay = () => {
    if (track.preview_url) {
      // Has preview - play normally
      if (trackList) {
        handlePlayFromList(track, trackList);
      } else {
        handlePlayTrack(track);
      }
    } else {
      // No preview - show track info
      alert(`🎵 ${track.name}\n👤 Artist: ${track.artists?.[0]?.name || track.artist}\n💿 Album: ${track.album?.name || track.album}\n\n⚠️ Audio preview not available due to Spotify API limitations.\n\nThis is a common issue when using Spotify's Client Credentials authentication. In a production app, you would:\n• Use Spotify's Authorization Code flow for full access\n• Integrate with other music services\n• Provide your own audio samples`);
    }
  };

  const renderPlayButton = () => {
    if (!showPlayButton) return null;

    const isPlaying = isTrackPlaying(track);
    const isCurrent = isCurrentTrack(track);
    const hasPreview = !!track.preview_url;

    return (
      <button 
        className={`Track-action Track-action--play ${isCurrent ? 'Track-action--current' : ''} ${!hasPreview ? 'Track-action--no-preview' : ''}`}
        onClick={handlePlay}
        aria-label={`${isPlaying ? 'Pause' : 'Play'} ${track.name} by ${track.artists?.[0]?.name || track.artist}${!hasPreview ? ' (no preview available)' : ''}`}
        title={`${isPlaying ? 'Pause' : 'Play'} ${track.name}${!hasPreview ? ' (no preview available)' : ''}`}
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
    );
  };

  const renderAction = () => {
    if (isRemoval) {
      return (
        <button 
          className="Track-action Track-action--remove" 
          onClick={handleRemove}
          aria-label={`Remove ${track.name} by ${track.artists?.[0]?.name || track.artist} from playlist`}
          title="Remove from playlist"
        > 
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
            <path d="M19 13H5v-2h14v2z"/>
          </svg>
        </button>
      );
    }
    return (
      <button 
        className="Track-action Track-action--add" 
        onClick={handleAdd}
        aria-label={`Add ${track.name} by ${track.artists?.[0]?.name || track.artist} to playlist`}
        title="Add to playlist"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    );
  };

  const trackDescription = `${track.name} by ${track.artists?.[0]?.name || track.artist}`;
  const positionInfo = trackIndex && totalTracks ? ` (${trackIndex} of ${totalTracks})` : '';

  return (
    <article 
      className={`Track ${isCurrentTrack(track) ? 'Track--current' : ''} Track--playable`}
      role="listitem"
      aria-label={`${trackDescription}${positionInfo}`}
      onClick={handlePlay}
      style={{ cursor: 'pointer' }}
      title={track.preview_url ? `Click to play ${track.name}` : `Click for track info: ${track.name} (no preview available)`}
    >
      <div className="Track-information">
        <h3 className="Track-name">{track.name}</h3>
        <p className="Track-details">
          <span className="Track-artist">{track.artists?.[0]?.name || track.artist}</span>
          <span className="Track-separator" aria-hidden="true"> | </span>
          <span className="Track-album">{track.album?.name || track.album}</span>
        </p>
        {!track.preview_url && (
          <p className="Track-no-preview" role="status">
            Click to view track info • Preview not available due to Spotify API limitations
          </p>
        )}
      </div>
      <div className="Track-actions" role="group" aria-label="Track actions">
        {renderPlayButton()}
        {renderAction()}
      </div>
    </article>
  );
};

// Wrapper for backward compatibility with class component usage
class TrackClass extends React.Component {
  render() {
    return <Track {...this.props} />;
  }
}

export default Track;
export { TrackClass };