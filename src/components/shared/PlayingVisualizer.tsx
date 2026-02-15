const PlayingVisualizer = ({ isPaused }: { isPaused: boolean }) => (
    <div className={`playing-icon ${isPaused ? 'paused' : ''}`}>
        <span />
        <span />
        <span />
        <span />
    </div>
);

export default PlayingVisualizer;