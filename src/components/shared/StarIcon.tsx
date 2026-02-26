const StarIcon = ({ 
    fillLevel, 
    sizeClass = "w-4 h-4" // Default size for lists/profile
    }: { 
    fillLevel: number, 
    sizeClass?: string 
}) => {
    return (
        <div className={`relative ${sizeClass}`}>
            <img
                src="/assets/icons/cute-star.svg"
                className="absolute inset-0 w-full h-full invert opacity-20"
                alt="star-empty"
            />
            {fillLevel > 0 && (
                <img
                    src="/assets/icons/cute-star_full.svg"
                    className="absolute inset-0 w-full h-full drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]"
                    style={{ clipPath: fillLevel === 0.5 ? 'inset(0 50% 0 0)' : 'none' }}
                    alt="star-full"
                />
            )}
        </div>
    );
};

export default StarIcon;