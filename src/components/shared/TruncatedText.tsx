import { useState } from "react";

type TruncatedTextProps = {
  text: string;
  limit?: number; // max characters before truncating
};

const TruncatedText = ({ text, limit = 150 }: TruncatedTextProps) => {
    const [expanded, setExpanded] = useState(false);
    const isTruncated = text.length > limit;

    const displayText = expanded || !isTruncated ? text : text.slice(0, limit) + "...";

    return (
        <div className="text-gray-200">
        <p>{displayText}</p>
        {isTruncated && (
            <button
            className="text-indigo-400 hover:underline text-sm mt-1"
            onClick={() => setExpanded(!expanded)}
            >
            {expanded ? "Show less" : "Read more"}
            </button>
        )}
        </div>
    );
};

export default TruncatedText;
