
import React, { useState } from 'react';
import { Destination } from '../types';

interface DestinationFormProps {
  onSubmit: (destination: Omit<Destination, 'id'>) => void;
  onClose: () => void;
}

const DestinationForm: React.FC<DestinationFormProps> = ({ onSubmit, onClose }) => {
  const [name, setName] = useState('');
  const [activities, setActivities] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
        alert("Please provide a destination name.");
        return;
    }
    onSubmit({ name, activities, notes });
    setName('');
    setActivities('');
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="destName" className="block text-sm font-medium text-slate-700">Destination Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="destName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label htmlFor="destActivities" className="block text-sm font-medium text-slate-700">Planned Activities (Optional)</label>
        <textarea
          id="destActivities"
          value={activities}
          onChange={(e) => setActivities(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
          placeholder="e.g., Visit museum, hiking trail, local market"
        />
      </div>
       <div>
        <label htmlFor="destNotes" className="block text-sm font-medium text-slate-700">Notes (Optional)</label>
        <textarea
          id="destNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
          placeholder="e.g., Booking confirmation numbers, addresses"
        />
      </div>
      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
        >
          Add Destination
        </button>
      </div>
    </form>
  );
};

export default DestinationForm;
