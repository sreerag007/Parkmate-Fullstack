import React, { useState } from 'react'
import { MessageSquareText } from 'lucide-react'

const ReviewText = ({ text = '', maxLength = 120, onOpenModal = null }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || typeof text !== 'string') {
    return <span className="text-gray-400 text-sm">No review provided</span>
  }

  const isTruncated = text.length > maxLength
  const displayText = isExpanded ? text : text.substring(0, maxLength)

  const handleReadMore = () => {
    if (text.length > 300 && onOpenModal) {
      // For very long reviews, open modal instead
      onOpenModal()
    } else {
      // For moderate length, just expand inline
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-gray-700 text-sm leading-relaxed">
        {displayText}
        {isTruncated && !isExpanded && <span>...</span>}
      </p>
      {isTruncated && (
        <button
          onClick={handleReadMore}
          aria-expanded={isExpanded}
          className="text-blue-600 hover:underline text-sm font-medium transition-colors duration-200 flex items-center gap-1 w-fit"
        >
          <MessageSquareText size={14} />
          {text.length > 300 ? 'View Full Review' : isExpanded ? 'Show Less' : 'Read More'}
        </button>
      )}
    </div>
  )
}

export default ReviewText
