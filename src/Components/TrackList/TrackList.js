import React from "react";
import "./TrackList.css";

import Track from "../Track/Track";
import VirtualizedList from "../VirtualizedList/VirtualizedList";

class TrackList extends React.Component{
    render(){
        const { 
            tracks, 
            showPlayButton = true, 
            virtualized = false,
            containerHeight = 400,
            itemHeight = 64
        } = this.props;
        
        // Defensive check for tracks prop before calling map method
        if (!tracks || !Array.isArray(tracks)) {
            return (
                <div 
                    className="TrackList"
                    role="status"
                    aria-live="polite"
                >
                    No tracks available
                </div>
            );
        }
        
        // Handle empty array case
        if (tracks.length === 0) {
            return (
                <div 
                    className="TrackList"
                    role="status"
                    aria-live="polite"
                >
                    No tracks to display
                </div>
            );
        }
        
        const renderTrack = (track, index) => (
            <Track
                track={track}
                key={track.id}
                onAdd={this.props.onAdd}
                isRemoval={this.props.isRemoval}
                onRemove={this.props.onRemove}
                showPlayButton={showPlayButton}
                trackList={tracks}
                trackIndex={index + 1}
                totalTracks={tracks.length}
            />
        );

        // Use virtualization for large lists (>50 items)
        if (virtualized || tracks.length > 50) {
            return (
                <div 
                    className="TrackList TrackList--virtualized"
                    role="list"
                    aria-label={`Track list with ${tracks.length} tracks`}
                >
                    <VirtualizedList
                        items={tracks}
                        itemHeight={itemHeight}
                        containerHeight={containerHeight}
                        renderItem={renderTrack}
                        className="TrackList__virtualized-container"
                    />
                </div>
            );
        }

        // Regular rendering for smaller lists
        return(
            <div 
                className="TrackList"
                role="list"
                aria-label={`Track list with ${tracks.length} tracks`}
            >
                {tracks.map((track, index) => renderTrack(track, index))}
            </div>
        );
    };
}

export default TrackList;