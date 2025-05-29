
import React from 'react';
import { Trip } from '../types';
import IconButton from './IconButton';
import { Edit3, Trash2, MapPin, CalendarDays, ArrowRight } from 'lucide-react';

interface TripCardProps {
  trip: Trip;
  onEdit: (trip: Trip) => void;
  onDelete: (tripId: string) => void;
  onViewDetails: (trip: Trip) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onEdit, onDelete, onViewDetails }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 
            className="text-2xl font-semibold text-cyan-700 hover:text-cyan-800 cursor-pointer"
            onClick={() => onViewDetails(trip)}
          >
            {trip.name}
          </h3>
          <div className="flex space-x-1">
            <IconButton onClick={() => onEdit(trip)} ariaLabel="Edit trip" className="text-slate-500 hover:text-cyan-600">
              <Edit3 size={20} />
            </IconButton>
            <IconButton onClick={() => onDelete(trip.id)} ariaLabel="Delete trip" className="text-slate-500 hover:text-red-600">
              <Trash2 size={20} />
            </IconButton>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-slate-600 mb-2">
          <CalendarDays size={16} className="mr-2 text-cyan-600" />
          <span>{formatDate(trip.startDate)}</span>
          <ArrowRight size={16} className="mx-2 text-slate-400" />
          <span>{formatDate(trip.endDate)}</span>
        </div>

        {trip.description && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{trip.description}</p>}

        {trip.destinations.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Destinations</h4>
            <div className="flex flex-wrap gap-2">
              {trip.destinations.slice(0, 3).map(dest => (
                <span key={dest.id} className="bg-cyan-100 text-cyan-700 px-2 py-1 text-xs rounded-full flex items-center">
                  <MapPin size={12} className="mr-1" /> {dest.name}
                </span>
              ))}
              {trip.destinations.length > 3 && (
                <span className="bg-slate-100 text-slate-600 px-2 py-1 text-xs rounded-full">
                  +{trip.destinations.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
         <button
          onClick={() => onViewDetails(trip)}
          className="w-full mt-2 px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-cyan-500 transition-colors"
        >
          View Details & Plan
        </button>
      </div>
    </div>
  );
};

export default TripCard;
