import React, { useState } from 'react';
import { Trip, Destination, ModalType, GeminiFeature } from '../types';
import IconButton from './IconButton';
import DestinationForm from './DestinationForm';
import Modal from './Modal';
import GeminiHelper from './GeminiHelper';
import { MapPin, CalendarDays, ArrowRight, Trash2, PlusCircle, FileText, ListChecks, Brain, Sparkles } from 'lucide-react';

interface TripDetailViewProps {
  trip: Trip;
  onClose: () => void;
  onUpdateTrip: (updatedTrip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
  // onOpenGeminiModal: (title: string, content: string) => void; // Removed
  onOpenAiSpotChatModal: (trip: Trip, destination?: Destination) => void;
  isDarkMode: boolean; // Added to pass to GeminiHelper
}

const TripDetailView: React.FC<TripDetailViewProps> = ({ trip, onClose, onUpdateTrip, onDeleteTrip, onOpenAiSpotChatModal, isDarkMode }) => {
  const [showAddDestinationModal, setShowAddDestinationModal] = useState(false);
  const [selectedDestinationForAI, setSelectedDestinationForAI] = useState<Destination | undefined>(
    trip.destinations.length > 0 ? trip.destinations[0] : undefined
  );
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleAddDestination = (newDestinationData: Omit<Destination, 'id'>) => {
    const newDestination: Destination = {
      ...newDestinationData,
      id: Date.now().toString(),
    };
    const updatedTrip = {
      ...trip,
      destinations: [...trip.destinations, newDestination],
    };
    onUpdateTrip(updatedTrip);
    if (!selectedDestinationForAI && updatedTrip.destinations.length > 0) {
        setSelectedDestinationForAI(updatedTrip.destinations[0]);
    }
    setShowAddDestinationModal(false);
  };

  const handleDeleteDestination = (destinationId: string) => {
    if (window.confirm("Are you sure you want to delete this destination?")) {
      const updatedTrip = {
        ...trip,
        destinations: trip.destinations.filter(d => d.id !== destinationId),
      };
      onUpdateTrip(updatedTrip);
      if (selectedDestinationForAI?.id === destinationId) {
        setSelectedDestinationForAI(updatedTrip.destinations.length > 0 ? updatedTrip.destinations[0] : undefined);
      }
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg max-h-[calc(85vh-100px)] sm:max-h-[calc(85vh-120px)] overflow-y-auto scrollbar-thin ${isDarkMode ? 'scrollbar-thumb-slate-600 scrollbar-track-slate-800' : 'scrollbar-thumb-slate-400 scrollbar-track-slate-100'}`}>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700 px-6 pt-6 sticky top-0 bg-white dark:bg-slate-800 z-10">
        <div>
          <h2 className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">{trip.name}</h2>
          <div className="flex items-center text-md text-slate-600 dark:text-slate-300 mt-1">
            <CalendarDays size={18} className="mr-2 text-cyan-600 dark:text-cyan-500" />
            <span>{formatDate(trip.startDate)}</span>
            <ArrowRight size={18} className="mx-2 text-slate-400 dark:text-slate-500" />
            <span>{formatDate(trip.endDate)}</span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6"> 
        {trip.description && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center"><FileText size={16} className="mr-1.5"/>Description</h4>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{trip.description}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xl font-semibold text-slate-700 dark:text-slate-200 flex items-center"><MapPin size={20} className="mr-2 text-cyan-600 dark:text-cyan-500"/>Destinations</h4>
            <button
              onClick={() => setShowAddDestinationModal(true)}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-cyan-500"
            >
              <PlusCircle size={18} className="mr-1.5" /> Add Destination
            </button>
          </div>
          {trip.destinations.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 italic">No destinations added yet. Click "Add Destination" to start planning!</p>
          ) : (
            <ul className="space-y-3">
              {trip.destinations.map(dest => (
                <li key={dest.id} className={`p-4 rounded-lg border hover:shadow-md transition-shadow ${selectedDestinationForAI?.id === dest.id ? (isDarkMode ? 'bg-cyan-900 border-cyan-700 ring-2 ring-cyan-500' : 'bg-cyan-50 border-cyan-300 ring-2 ring-cyan-500') : (isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200')}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{dest.name}</h5>
                      {dest.activities && (
                         <div className="mt-1">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center"><ListChecks size={14} className="mr-1"/>Activities:</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{dest.activities}</p>
                         </div>
                      )}
                      {dest.notes && (
                        <div className="mt-1">
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center"><Brain size={14} className="mr-1"/>Notes:</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{dest.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-1 ml-2">
                       <IconButton 
                          onClick={() => setSelectedDestinationForAI(dest)} 
                          ariaLabel={`Set ${dest.name} as focus for AI suggestions`}
                          className={`p-1.5 ${selectedDestinationForAI?.id === dest.id ? 'bg-amber-500 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'}`}
                          title={`Focus AI Assistant on ${dest.name}`}
                          >
                          <Sparkles size={18} />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteDestination(dest.id)} ariaLabel="Delete destination" className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 p-1.5">
                        <Trash2 size={18} />
                      </IconButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
           {selectedDestinationForAI && trip.destinations.length > 0 && (
              <p className={`text-sm mt-3 text-center p-2 rounded-md ${isDarkMode ? 'text-cyan-300 bg-cyan-800' : 'text-cyan-700 bg-cyan-100'}`}>
                  AI Assistant is focused on: <span className="font-semibold">{selectedDestinationForAI.name}</span>.
                  {trip.destinations.length > 1 && 
                    <button onClick={() => setSelectedDestinationForAI(undefined)} className="ml-2 text-xs text-red-500 hover:underline">(Clear Focus / Use Trip Context)</button>
                  }
              </p>
          )}
          {!selectedDestinationForAI && trip.destinations.length > 0 && (
               <p className={`text-sm mt-3 text-center p-2 rounded-md ${isDarkMode ? 'text-slate-300 bg-slate-700' : 'text-slate-600 bg-slate-100'}`}>
                  AI Assistant will use the general trip context (<span className="font-semibold">{trip.name}</span>). Select a destination above to focus AI suggestions.
              </p>
          )}
        </div>

        <GeminiHelper 
          trip={trip} 
          selectedDestination={selectedDestinationForAI} 
          onOpenChatbot={onOpenAiSpotChatModal}
          isDarkMode={isDarkMode}
        />
      </div>
      
      {showAddDestinationModal && (
        <Modal isOpen={showAddDestinationModal} onClose={() => setShowAddDestinationModal(false)} title="Add New Destination">
          <DestinationForm
            onSubmit={handleAddDestination}
            onClose={() => setShowAddDestinationModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default TripDetailView;