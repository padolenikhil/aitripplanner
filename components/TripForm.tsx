
import React, { useState, useEffect } from 'react';
import { Trip } from '../types';

interface TripFormProps {
  onSubmit: (trip: Omit<Trip, 'id' | 'destinations'>) => void;
  onClose: () => void;
  initialData?: Omit<Trip, 'id' | 'destinations'>;
  isEditMode: boolean;
}

const TripForm: React.FC<TripFormProps> = ({ onSubmit, onClose, initialData, isEditMode }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate);
      setDescription(initialData.description || '');
    } else {
      // Set default start date to today and end date to a week from today for new trips
      const today = new Date().toISOString().split('T')[0];
      const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(oneWeekLater);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) {
        alert("Please fill in all required fields: Name, Start Date, and End Date.");
        return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        alert("Start date cannot be after end date.");
        return;
    }
    onSubmit({ name, startDate, endDate, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="tripName" className="block text-sm font-medium text-slate-700">Trip Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="tripName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">Start Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">End Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            required
          />
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description (Optional)</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
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
          {isEditMode ? 'Save Changes' : 'Create Trip'}
        </button>
      </div>
    </form>
  );
};

export default TripForm;
