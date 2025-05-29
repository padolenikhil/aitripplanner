import React, { useState, useEffect, useCallback } from 'react';
import { Trip, Destination, ModalType, GeminiFeature, ChatMessage } from './types';
import { LOCAL_STORAGE_TRIPS_KEY } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import TripCard from './components/TripCard';
import TripForm from './components/TripForm';
import Modal from './components/Modal';
import TripDetailView from './components/TripDetailView';
import IconButton from './components/IconButton';
import ChatbotModal from './components/ChatbotModal'; // Import ChatbotModal
import { PlusCircle, Map, ListFilter, Sun, Moon, X } from 'lucide-react';

const App: React.FC = () => {
  const [trips, setTrips] = useLocalStorage<Trip[]>(LOCAL_STORAGE_TRIPS_KEY, []);
  const [activeModal, setActiveModal] = useState<ModalType>(ModalType.NONE);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [tripToEdit, setTripToEdit] = useState<Omit<Trip, 'id' | 'destinations'> | undefined>(undefined);
  
  // State for ChatbotModal
  const [chatbotModalContext, setChatbotModalContext] = useState<{trip: Trip, destination?: Destination} | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('aiTripPlannerDarkMode', false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const handleAddTrip = (newTripData: Omit<Trip, 'id' | 'destinations'>) => {
    const newTrip: Trip = {
      ...newTripData,
      id: Date.now().toString(),
      destinations: [],
    };
    setTrips(prevTrips => [newTrip, ...prevTrips].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
    setActiveModal(ModalType.NONE);
  };

  const handleEditTrip = (updatedTripData: Omit<Trip, 'id' | 'destinations'>) => {
    if (selectedTrip) {
      setTrips(prevTrips =>
        prevTrips.map(trip =>
          trip.id === selectedTrip.id ? { ...trip, ...updatedTripData } : trip
        ).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      );
      setSelectedTrip(prev => prev ? { ...prev, ...updatedTripData } : null);
    }
    setActiveModal(ModalType.NONE);
    setTripToEdit(undefined);
  };
  
  const handleUpdateTripDetails = (updatedTrip: Trip) => {
    setTrips(prevTrips => 
      prevTrips.map(t => t.id === updatedTrip.id ? updatedTrip : t)
               .sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    );
    setSelectedTrip(updatedTrip);
     if (chatbotModalContext && chatbotModalContext.trip.id === updatedTrip.id) {
      setChatbotModalContext(prev => prev ? {...prev, trip: updatedTrip} : null);
    }
  };

  const handleDeleteTrip = (tripId: string) => {
    if (window.confirm('Are you sure you want to delete this trip and all its data?')) {
      setTrips(prevTrips => prevTrips.filter(trip => trip.id !== tripId));
      
      if (selectedTrip && selectedTrip.id === tripId) {
        setSelectedTrip(null);
        setTripToEdit(undefined); // Also clear tripToEdit if it was the selected/edited trip
        setActiveModal(ModalType.NONE);
      }
      
      if (chatbotModalContext && chatbotModalContext.trip.id === tripId) {
        setChatbotModalContext(null);
        if (activeModal === ModalType.AI_SPOT_CHAT) {
            setActiveModal(ModalType.NONE);
        }
      }
    }
  };

  const openAddTripModal = () => {
    setTripToEdit(undefined);
    setActiveModal(ModalType.ADD_TRIP);
  };

  const openEditTripModal = (trip: Trip) => {
    setSelectedTrip(trip); // Keep selectedTrip to know which trip is being edited
    setTripToEdit({
      name: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      description: trip.description,
    });
    setActiveModal(ModalType.EDIT_TRIP);
  };
  
  const openTripDetailModal = (trip: Trip) => {
    setSelectedTrip(trip);
    setActiveModal(ModalType.VIEW_TRIP_DETAILS);
  };
  
  const handleOpenAiSpotChatModal = (trip: Trip, destination?: Destination) => {
    setChatbotModalContext({ trip, destination });
    setActiveModal(ModalType.AI_SPOT_CHAT);
  };

   const closeModal = () => {
    const currentOpenModal = activeModal;
    setActiveModal(ModalType.NONE);

    if (currentOpenModal === ModalType.AI_SPOT_CHAT) {
        if (chatbotModalContext?.trip) {
            const tripToReopen = trips.find(t => t.id === chatbotModalContext.trip.id);
            if (tripToReopen) { // Check if trip still exists (wasn't deleted)
                setSelectedTrip(tripToReopen); 
                setActiveModal(ModalType.VIEW_TRIP_DETAILS);
            } else {
                setSelectedTrip(null); // Trip was deleted or not found
            }
        } else {
            setSelectedTrip(null); 
        }
        setChatbotModalContext(null);
    } else if (currentOpenModal === ModalType.VIEW_TRIP_DETAILS || 
               currentOpenModal === ModalType.ADD_TRIP ||
               currentOpenModal === ModalType.EDIT_TRIP) {
        setSelectedTrip(null);
        setTripToEdit(undefined);
    }
};


  const closeSpecificModal = (modalTypeToClose: ModalType) => {
    if (modalTypeToClose === ModalType.AI_SPOT_CHAT) {
        const contextTripId = chatbotModalContext?.trip?.id;
        setChatbotModalContext(null);
        
        // Check if there's a selectedTrip that matches the context of the closing chat
        // and if that trip still exists in the main trips array.
        const underlyingTrip = trips.find(t => t.id === contextTripId);
        if (underlyingTrip) { 
            setSelectedTrip(underlyingTrip); // Re-select the trip
            setActiveModal(ModalType.VIEW_TRIP_DETAILS); // Revert to trip details
        } else { 
             // If no underlying trip context or trip deleted, go to NONE
             setSelectedTrip(null);
             setActiveModal(ModalType.NONE);
        }
    } else {
        setActiveModal(ModalType.NONE);
        setSelectedTrip(null);
        setTripToEdit(undefined);
    }
};


  const filteredTrips = trips
    .filter(trip => {
      const today = new Date().setHours(0,0,0,0);
      const endDate = new Date(trip.endDate).setHours(0,0,0,0);
      if (filter === 'upcoming') return endDate >= today;
      if (filter === 'past') return endDate < today;
      return true;
    })
    .filter(trip => 
      trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (trip.description && trip.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      trip.destinations.some(dest => dest.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );


  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-800'} transition-colors duration-300`}>
      <header className={`py-6 shadow-md ${isDarkMode ? 'bg-slate-800' : 'bg-white dark:bg-slate-800'}`}>
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center">
          <div className={`flex items-center text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-4 sm:mb-0`}>
            <Map size={36} className="mr-3" /> AI Trip Planner
          </div>
          <div className="flex items-center space-x-3">
             <IconButton onClick={toggleDarkMode} ariaLabel="Toggle dark mode" className={isDarkMode ? 'text-yellow-400 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-200 dark:text-yellow-400 dark:hover:bg-slate-700'}>
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </IconButton>
            <button
              onClick={openAddTripModal}
              className="flex items-center bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out"
            >
              <PlusCircle size={20} className="mr-2" /> New Trip
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className={`mb-6 p-4 rounded-lg shadow ${isDarkMode ? 'bg-slate-800' : 'bg-white dark:bg-slate-800'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text"
              placeholder="Search trips by name, description, or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`flex-grow p-3 border rounded-md focus:ring-2 focus:ring-cyan-500 outline-none transition-shadow ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' : 'border-slate-300 placeholder-slate-400'}`}
            />
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}><ListFilter size={18} className="inline mr-1"/>Filter:</span>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value as 'all' | 'upcoming' | 'past')}
                className={`p-3 border rounded-md focus:ring-2 focus:ring-cyan-500 outline-none ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'border-slate-300 bg-white'}`}
              >
                <option value="all">All Trips</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past Trips</option>
              </select>
            </div>
          </div>
        </div>

        {filteredTrips.length === 0 ? (
          <div className={`text-center py-12 ${isDarkMode ? 'bg-slate-800' : 'bg-white dark:bg-slate-800'} rounded-lg shadow`}>
            <Map size={64} className={`mx-auto mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <h2 className="text-2xl font-semibold mb-2">No trips found.</h2>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-6`}>
              {trips.length > 0 ? "Try adjusting your search or filter." : "Ready for an adventure? Add your first trip!"}
            </p>
            {trips.length === 0 && (
                 <button
                    onClick={openAddTripModal}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out text-lg"
                >
                    <PlusCircle size={22} className="mr-2 inline" /> Create Your First Trip
                </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                onEdit={() => openEditTripModal(trip)}
                onDelete={handleDeleteTrip}
                onViewDetails={() => openTripDetailModal(trip)}
              />
            ))}
          </div>
        )}
      </main>

      {(activeModal === ModalType.ADD_TRIP || activeModal === ModalType.EDIT_TRIP) && (
        <Modal
          isOpen={true}
          onClose={() => closeSpecificModal(activeModal === ModalType.EDIT_TRIP ? ModalType.EDIT_TRIP : ModalType.ADD_TRIP)}
          title={activeModal === ModalType.EDIT_TRIP ? 'Edit Trip' : 'Create New Trip'}
          size="lg"
        >
          <TripForm
            onSubmit={activeModal === ModalType.EDIT_TRIP ? handleEditTrip : handleAddTrip}
            onClose={() => closeSpecificModal(activeModal === ModalType.EDIT_TRIP ? ModalType.EDIT_TRIP : ModalType.ADD_TRIP)}
            initialData={tripToEdit}
            isEditMode={activeModal === ModalType.EDIT_TRIP}
          />
        </Modal>
      )}
      
      {activeModal === ModalType.VIEW_TRIP_DETAILS && selectedTrip && (
         <Modal 
            isOpen={true} 
            onClose={() => closeSpecificModal(ModalType.VIEW_TRIP_DETAILS)}
            title={`${selectedTrip.name} - Details`} 
            size="xl" 
          >
            <TripDetailView
                trip={selectedTrip}
                onClose={() => closeSpecificModal(ModalType.VIEW_TRIP_DETAILS)}
                onUpdateTrip={handleUpdateTripDetails}
                onDeleteTrip={handleDeleteTrip}
                onOpenAiSpotChatModal={handleOpenAiSpotChatModal}
                isDarkMode={isDarkMode}
            />
         </Modal>
      )}

      {activeModal === ModalType.AI_SPOT_CHAT && chatbotModalContext && (
        <ChatbotModal
          isOpen={true}
          onClose={() => closeSpecificModal(ModalType.AI_SPOT_CHAT)}
          tripContext={chatbotModalContext}
          isDarkMode={isDarkMode}
        />
      )}

       <footer className={`py-6 mt-12 text-center text-sm ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
        <p>&copy; {new Date().getFullYear()} AI Trip Planner. Travel smarter with AI!</p>
        <p className="text-xs mt-1">Powered by React, Tailwind CSS, and Gemini API.</p>
      </footer>
    </div>
  );
};

export default App;
