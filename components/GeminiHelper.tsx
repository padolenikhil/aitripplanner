
import React, { useState } from 'react';
import { Trip, Destination, GeminiFeature } from '../types';
import { getGeminiSuggestionForTrip, ai as importedAiInstance, getAiInitializationError } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import IconButton from './IconButton';
import { Lightbulb, ClipboardList, Sparkles, MessagesSquare, Copy, XCircle } from 'lucide-react';

interface GeminiHelperProps {
  trip: Trip;
  selectedDestination?: Destination;
  onOpenChatbot: (trip: Trip, destination?: Destination) => void;
  isDarkMode: boolean;
}

const GeminiHelper: React.FC<GeminiHelperProps> = ({ trip, selectedDestination, onOpenChatbot, isDarkMode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFeature, setLoadingFeature] = useState<GeminiFeature | null>(null);
  const [suggestionTitle, setSuggestionTitle] = useState<string | null>(null);
  const [suggestionContent, setSuggestionContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isAiServiceAvailable = !!importedAiInstance;
  const aiInitializationError = getAiInitializationError();

  const handleGeminiAction = async (feature: GeminiFeature) => {
    if (!isAiServiceAvailable) {
        setSuggestionTitle("AI Service Error");
        setSuggestionContent(aiInitializationError || "AI features are currently unavailable.");
        return;
    }

    if (feature === GeminiFeature.CHAT_FAMOUS_SPOTS) {
      onOpenChatbot(trip, selectedDestination);
      return;
    }

    setIsLoading(true);
    setLoadingFeature(feature);
    setSuggestionContent(null); 
    setSuggestionTitle(null);
    setCopied(false);

    let featureUserTitle = "";
    const locationName = selectedDestination?.name || (trip.destinations.length > 0 ? trip.destinations[0].name : trip.name);

    switch(feature) {
      case GeminiFeature.SUGGEST_ACTIVITIES:
        if (!selectedDestination) { // Should be caught by button disabled state, but double check
            setSuggestionTitle("Error");
            setSuggestionContent("Please select a destination first to suggest activities.");
            setIsLoading(false);
            setLoadingFeature(null);
            return;
        }
        featureUserTitle = `Activity Ideas for ${selectedDestination?.name || trip.name}`;
        break;
      case GeminiFeature.GENERATE_PACKING_LIST:
        featureUserTitle = `Packing List for ${trip.name}`;
        break;
      case GeminiFeature.TRAVEL_TIPS:
        featureUserTitle = `Travel Tips for ${locationName}`;
        break;
    }
    
    const suggestion = await getGeminiSuggestionForTrip(feature, trip, selectedDestination);
    setSuggestionTitle(featureUserTitle);
    setSuggestionContent(suggestion);
    setIsLoading(false);
    setLoadingFeature(null);
  };

  const handleCopyToClipboard = () => {
    if (suggestionContent) {
      navigator.clipboard.writeText(suggestionContent)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => console.error('Failed to copy: ', err));
    }
  };

  const clearSuggestion = () => {
    setSuggestionContent(null);
    setSuggestionTitle(null);
    setCopied(false);
  };

  const geminiFeatures: { name: GeminiFeature; icon: React.ReactNode; needsDestination?: boolean; alwaysEnabled?: boolean }[] = [
    {
      name: GeminiFeature.SUGGEST_ACTIVITIES,
      icon: <Lightbulb size={18} className="mr-2" />,
      needsDestination: true
    },
    {
      name: GeminiFeature.GENERATE_PACKING_LIST,
      icon: <ClipboardList size={18} className="mr-2" />,
      alwaysEnabled: true,
    },
    {
      name: GeminiFeature.TRAVEL_TIPS,
      icon: <Sparkles size={18} className="mr-2" />,
      alwaysEnabled: true,
    },
    {
      name: GeminiFeature.CHAT_FAMOUS_SPOTS,
      icon: <MessagesSquare size={18} className="mr-2" />,
      alwaysEnabled: true,
    },
  ];

  return (
    <div className={`mt-6 p-4 rounded-lg border ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-cyan-50 border-cyan-200'}`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className={`text-lg font-semibold flex items-center ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
          <Sparkles size={20} className="mr-2 text-amber-500" />
          AI Travel Assistant
        </h4>
        {suggestionContent && (
          <IconButton onClick={clearSuggestion} ariaLabel="Clear suggestion" className={`${isDarkMode ? 'text-slate-300 hover:bg-slate-600' : 'text-slate-500 hover:bg-slate-200'}`}>
            <XCircle size={20} />
          </IconButton>
        )}
      </div>

      {isLoading && loadingFeature !== GeminiFeature.CHAT_FAMOUS_SPOTS ? (
        <div className="py-4">
         <LoadingSpinner />
         <p className={`text-sm text-center mt-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Generating {loadingFeature}...</p>
        </div>
      ) : suggestionContent ? (
        <div>
          <h5 className={`text-md font-semibold mb-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{suggestionTitle}</h5>
          <div className={`whitespace-pre-wrap p-3 rounded-md max-h-60 overflow-y-auto scrollbar-thin ${isDarkMode ? 'bg-slate-650 text-slate-200 border border-slate-500' : 'bg-white text-slate-700 border border-slate-200'}`}>
            {suggestionContent}
          </div>
          <button
            onClick={handleCopyToClipboard}
            className={`mt-3 flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 ${
              isDarkMode 
                ? (copied ? 'bg-green-600 text-white' : 'bg-slate-500 hover:bg-slate-400 text-white')
                : (copied ? 'bg-green-500 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700')
            }`}
          >
            <Copy size={14} className="mr-1.5" /> {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {geminiFeatures.map(featureItem => {
            const featureRequiresDestination = !!featureItem.needsDestination;
            const isButtonDisabledByLogic = featureRequiresDestination && !selectedDestination;
            const isDisabled = !isAiServiceAvailable || isButtonDisabledByLogic || (isLoading && loadingFeature === featureItem.name);
            
            let buttonTitle = `Get ${featureItem.name}`;
            if (!isAiServiceAvailable) {
                buttonTitle = aiInitializationError || "AI features disabled.";
            } else if (isButtonDisabledByLogic) {
                buttonTitle = "Select a destination first for this feature.";
            }

            return (
             <button
                key={featureItem.name}
                onClick={() => handleGeminiAction(featureItem.name)}
                disabled={isDisabled}
                title={buttonTitle}
                className={`w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-150
                            ${isDisabled
                              ? (isDarkMode ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-500 cursor-not-allowed')
                              : (isDarkMode ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500')
                            }`}
              >
                {isLoading && loadingFeature === featureItem.name ? <LoadingSpinner /> : featureItem.icon}
                <span className={isLoading && loadingFeature === featureItem.name ? "ml-2" : ""}>{featureItem.name}</span>
              </button>
            );
          })}
          {!isAiServiceAvailable && (
            <p className={`text-xs text-center mt-2 p-2 rounded-md ${isDarkMode ? 'text-red-300 bg-red-900 border border-red-700' : 'text-red-700 bg-red-100 border border-red-300'}`}>
              {aiInitializationError || "Gemini API key not found or AI service unavailable. AI features are disabled."}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GeminiHelper;
