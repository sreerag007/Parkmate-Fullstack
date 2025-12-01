import React from 'react'
import { MapPin, User, CalendarDays, Star } from 'lucide-react'

const ReviewModal = ({ isOpen, review, onClose }) => {
  if (!isOpen || !review) return null

  const reviewDate = new Date(review.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-xl w-full p-8 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-100">
          <h2 className="flex items-center gap-3 text-xl font-semibold text-gray-900">
            <MapPin className="w-5 h-5 text-blue-600" />
            Full Review
          </h2>
        </div>

        {/* Info Grid - 2 Columns with breathing space */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-gray-700 px-2">
          {/* Customer */}
          <span className="font-medium text-gray-600 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            Customer
          </span>
          <span className="text-gray-800 text-base font-semibold">
            {review.user_detail?.firstname} {review.user_detail?.lastname}
          </span>

          {/* Date */}
          <span className="font-medium text-gray-600 text-sm flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            Date
          </span>
          <span className="text-gray-800 text-base font-semibold">{reviewDate}</span>

          {/* Parking Lot */}
          <span className="font-medium text-gray-600 text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Parking Lot
          </span>
          <span className="text-gray-800 text-base font-semibold">
            {review.lot_detail?.lot_name}
          </span>

          {/* Rating */}
          <span className="font-medium text-gray-600 text-sm flex items-center gap-2">
            ⭐ Rating
          </span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < review.rating
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-600 text-sm font-semibold">{review.rating}/5</span>
          </div>
        </div>

        {/* Review Text */}
        <div className="mt-6 pt-4 border-t border-gray-100 px-2">
          <span className="block font-medium text-gray-600 text-sm mb-3">Review</span>
          <p className="text-gray-800 bg-gray-50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {review.review_desc}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReviewModal
