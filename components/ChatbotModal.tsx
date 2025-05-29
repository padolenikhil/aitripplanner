import React, { useState, useEffect, useRef } from 'react';
import { Trip, Destination, ChatMessage, SuggestedSpotInfo } from '../types';
import { ai as importedAiInstance } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { GEMINI_TEXT_MODEL } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { Send, X, User, Bot, Youtube, Link as LinkIcon } from 'lucide-react';
import IconButton from './IconButton';

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripContext: {
    trip: Trip;
    destination?: Destination;
  };
  isDarkMode: boolean;
}

const ChatbotModal: React.FC<ChatbotModalProps> = ({ isOpen, onClose, tripContext, isDarkMode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For main message sending
  const [chat, setChat] = useState<Chat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [enrichingMessageId, setEnrichingMessageId] = useState<string | null>(null);


  const locationContext = tripContext.destination?.name || 
                        (tripContext.trip.destinations.length > 0 ? tripContext.trip.destinations[0].name : tripContext.trip.name);

  useEffect(() => {
    if (isOpen && importedAiInstance) {
      setIsLoading(true);
      setError(null);
      setMessages([]); 

      try {
        const initialSystemMessage = `You are a friendly and expert AI Tour Guide for ${locationContext}.
Your goal is to suggest famous spots, hidden gems, landmarks, and points of interest. Please provide a short description for each.
Encourage the user to specify their interests (e.g., history, art, nature, food, adventure) or mood (e.g., relaxing, lively, family-friendly) for more tailored suggestions. If they don't specify, provide a mix of popular and lesser-known options.
When suggesting spots, list them clearly using markdown bullet points for each spot name. For example:
*   [Spot Name 1]: [Short Description]
*   [Spot Name 2]: [Short Description]
Keep your responses concise and engaging.
Start by greeting the user and asking how you can help them find interesting spots in ${locationContext}, or if they'd like some initial general suggestions.`;
        
        const newChat = importedAiInstance.chats.create({
          model: 'gemini-2.5-flash-preview-04-17',
          config: {
            systemInstruction: initialSystemMessage,
          },
        });
        setChat(newChat);

        newChat.sendMessage({ message: `Hello! I'm your AI Tour Guide for ${locationContext}. What kind of famous spots or activities are you interested in discovering today? Or would you like some general suggestions to start with?`})
          .then(response => {
            const modelMessage: ChatMessage = {
              id: Date.now().toString() + '-initial',
              role: 'model',
              text: response.text,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, modelMessage]);
            // Attempt to enrich this initial message too
            fetchAndSetEnrichedContent(modelMessage.id, response.text);
          })
          .catch(err => {
            console.error("Error sending initial message from new chat:", err);
            setError("Sorry, I couldn't start our conversation. Please try again.");
          })
          .finally(() => setIsLoading(false));

      } catch (initError) {
        console.error("Error initializing chat session:", initError);
        setError("Failed to initialize AI chat. Please try again later.");
        setIsLoading(false);
      }
    } else if (isOpen && !importedAiInstance) {
        setError("AI Service not available. Chatbot features are disabled.");
        setIsLoading(false);
        setMessages([]);
    }
  }, [isOpen, tripContext.trip.id, tripContext.destination?.id, locationContext]); // Added trip/destination ID to dependencies

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAndSetEnrichedContent = async (messageId: string, aiResponseText: string) => {
    if (!importedAiInstance || !aiResponseText.trim()) return;
    
    setEnrichingMessageId(messageId);
    try {
      const enrichedData = await fetchEnrichedSpotInfo(aiResponseText);
      if (enrichedData && enrichedData.length > 0) {
        setMessages(prevMsgs => prevMsgs.map(m => 
          m.id === messageId ? { ...m, enrichedContent: enrichedData } : m
        ));
      }
    } catch (e) {
      console.error("Error during enrichment process:", e);
    } finally {
      setEnrichingMessageId(null);
    }
  };
  
  async function fetchEnrichedSpotInfo(aiResponseText: string): Promise<SuggestedSpotInfo[] | null> {
    if (!importedAiInstance) return null;

    let spotNames: { name: string }[] = [];
    try {
      const extractPrompt = `From the following text, identify all distinct tourist spots, landmarks, or points of interest explicitly mentioned as suggestions.
Text:
'''
${aiResponseText}
'''
Respond ONLY with a JSON array of objects, where each object has a 'name' field. Each name should be concise and suitable for a web search. If no specific spots are clearly suggested as points of interest, return an empty array. Example: [{'name': 'Eiffel Tower'}, {'name': 'Louvre Museum'}, {'name': 'Sacré-Cœur Basilica'}]`;

      const extractionResponse = await importedAiInstance.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: extractPrompt,
        config: { responseMimeType: "application/json" }
      });

      let jsonStr = extractionResponse.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }
      const parsedData = JSON.parse(jsonStr);
      if (Array.isArray(parsedData) && parsedData.every(item => item && typeof item.name === 'string')) {
          // Allow up to 5 spots for enrichment
          spotNames = parsedData.filter(item => item.name && item.name.length > 2).slice(0, 5); 
      } else {
          console.warn("Could not parse spot names from AI response, or format was unexpected:", parsedData);
      }
    } catch (e) {
      console.error("Error extracting spot names:", e);
      return null;
    }

    if (spotNames.length === 0) return null;

    const enrichedSpots: SuggestedSpotInfo[] = [];
    for (const spot of spotNames) {
      if (!spot.name) continue;
      try {
        const searchPrompt = `Find a relevant public image URL, a YouTube video URL, and an informative article URL for "${spot.name}". Prioritize official or highly reputable travel sources.`;
        const searchResponse = await importedAiInstance.models.generateContent({
          model: GEMINI_TEXT_MODEL,
          contents: searchPrompt,
          config: { tools: [{ googleSearch: {} }] }
        });

        const spotInfo: SuggestedSpotInfo = { name: spot.name };
        const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;

        if (chunks) {
          const imageChunk = chunks.find(c => c.web?.uri && (/\.(jpeg|jpg|gif|png|webp)$/i.test(c.web.uri) || /image/i.test(c.web.title || '')) && !/youtube\.com|youtu\.be/i.test(c.web.uri) && c.web.uri.startsWith('http')) 
            || chunks.find(c => c.web?.uri && (/\.(jpeg|jpg|gif|png|webp)$/i.test(c.web.uri)) && !/youtube\.com|youtu\.be/i.test(c.web.uri) && c.web.uri.startsWith('http'));
          if (imageChunk?.web) {
            spotInfo.imageUrl = imageChunk.web.uri;
            spotInfo.imageTitle = imageChunk.web.title || spot.name + " Image";
          }

          const youtubeChunk = chunks.find(c => c.web?.uri && /youtube\.com\/watch\?v=|youtu\.be\//i.test(c.web.uri) && c.web.uri.startsWith('http'));
          if (youtubeChunk?.web) {
            spotInfo.youtubeUrl = youtubeChunk.web.uri;
            spotInfo.youtubeTitle = youtubeChunk.web.title || spot.name + " on YouTube";
          }
          
          const articleChunk = chunks.find(c => c.web?.uri && !/\.(jpeg|jpg|gif|png|webp)$/i.test(c.web.uri) && !/youtube\.com|youtu\.be/i.test(c.web.uri) && c.web.uri.startsWith('http') && c.web.uri !== spotInfo.imageUrl && c.web.uri !== spotInfo.youtubeUrl);
          if (articleChunk?.web) {
            spotInfo.articleUrl = articleChunk.web.uri;
            spotInfo.articleTitle = articleChunk.web.title || "Read more about " + spot.name;
          }
        }
        if (spotInfo.imageUrl || spotInfo.youtubeUrl || spotInfo.articleUrl) {
          enrichedSpots.push(spotInfo);
        }
      } catch (e) {
        console.error(`Error fetching details for spot "${spot.name}":`, e);
      }
    }
    return enrichedSpots.length > 0 ? enrichedSpots : null;
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !chat || isLoading || !importedAiInstance) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      role: 'user',
      text: userInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = userInput;
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const stream = await chat.sendMessageStream({ message: currentInput });
      let currentText = "";
      const streamingMessageId = 'model-streaming-' + Date.now();
      setMessages(prev => [...prev, { id: streamingMessageId, role: 'model', text: '', timestamp: new Date() }]);
      
      for await (const chunk of stream) {
        currentText += chunk.text;
        setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId ? {...msg, text: currentText } : msg
        ));
      }
      
      const finalModelMessageId = Date.now().toString() + '-model-final';
      setMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId ? {...msg, id: finalModelMessageId } : msg
      ));
      
      // After streaming is complete, fetch enriched content
      if (currentText.trim()) {
        await fetchAndSetEnrichedContent(finalModelMessageId, currentText);
      }

    } catch (err) {
      console.error("Error sending message to Gemini:", err);
      setError("Sorry, I encountered an issue sending your message. Please try again.");
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('model-streaming-')));
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-error',
        role: 'system',
        text: "Error: Could not get a response from AI. Please check your connection or try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className={`flex flex-col w-full max-w-lg h-[80vh] max-h-[700px] ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-xl shadow-2xl overflow-hidden`}>
        <header className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} flex justify-between items-center`}>
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>AI Spot Finder: {locationContext}</h2>
          <IconButton onClick={onClose} ariaLabel="Close chat" className={isDarkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-200'}>
            <X size={24} />
          </IconButton>
        </header>

        <div className="flex-grow p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-xl shadow ${
                msg.role === 'user' 
                ? (isDarkMode ? 'bg-cyan-600 text-white' : 'bg-cyan-500 text-white') 
                : (isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-800')
              } ${msg.role === 'system' ? (isDarkMode ? 'bg-red-700 text-red-100' : 'bg-red-100 text-red-700') : ''}`}>
                <div className="flex items-start mb-1">
                    {msg.role === 'model' && <Bot size={18} className={`mr-2 flex-shrink-0 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />}
                    {msg.role === 'user' && <User size={18} className={`mr-2 flex-shrink-0 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`} />}
                    <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}></div>
                </div>
                {enrichingMessageId === msg.id && msg.role === 'model' && (
                  <div className="flex items-center text-xs italic text-slate-500 dark:text-slate-400 mt-1">
                    <LoadingSpinner /> 
                    <span className="ml-1.5">Fetching details...</span>
                  </div>
                )}
                {msg.enrichedContent && msg.enrichedContent.length > 0 && (
                  <div className={`mt-2 pt-2 space-y-3 ${isDarkMode ? 'border-t border-slate-600' : 'border-t border-slate-300'}`}>
                    {msg.enrichedContent.map((spot, index) => (
                      <div key={index} className={`p-2.5 rounded-lg ${isDarkMode ? 'bg-slate-750' : 'bg-slate-100'}`}>
                        <p className={`font-semibold text-sm mb-1.5 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>{spot.name}</p>
                        {spot.imageUrl && (
                          <div className="mb-2">
                            <img 
                                src={spot.imageUrl} 
                                alt={spot.imageTitle || spot.name} 
                                className="rounded-md max-h-48 w-full object-cover border border-slate-300 dark:border-slate-600" 
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                            {spot.imageTitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{spot.imageTitle}</p>}
                          </div>
                        )}
                        <div className="space-y-1.5">
                          {spot.youtubeUrl && (
                            <a href={spot.youtubeUrl} target="_blank" rel="noopener noreferrer" className={`text-xs flex items-center ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}>
                              <Youtube size={14} className="mr-1.5 text-red-500" /> {spot.youtubeTitle || "Watch on YouTube"}
                            </a>
                          )}
                          {spot.articleUrl && (
                            <a href={spot.articleUrl} target="_blank" rel="noopener noreferrer" className={`text-xs flex items-center ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}>
                              <LinkIcon size={14} className="mr-1.5" /> {spot.articleTitle || "Read Article"}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-right' : 'text-left'} ${isDarkMode ? 'text-slate-400 opacity-75' : 'text-slate-500 opacity-75'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
           {isLoading && messages.length > 0 && messages[messages.length -1].role === 'user' && ( 
            <div className="flex justify-start">
                <div className={`max-w-[80%] p-3 rounded-xl ${isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-800'}`}>
                    <div className="flex items-center">
                        <Bot size={18} className={`mr-2 flex-shrink-0 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        <LoadingSpinner /> 
                        <span className="ml-2 text-sm italic">AI is typing...</span>
                    </div>
                </div>
            </div>
          )}
           {isLoading && messages.length === 0 && ( 
            <div className="flex justify-start">
                <div className={`max-w-[80%] p-3 rounded-xl ${isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-800'}`}>
                    <div className="flex items-center">
                        <Bot size={18} className={`mr-2 flex-shrink-0 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        <LoadingSpinner />
                        <span className="ml-2 text-sm italic">AI is starting chat...</span>
                    </div>
                </div>
            </div>
          )}
        </div>

        {error && <p className={`p-4 text-sm ${isDarkMode ? 'text-red-400 bg-red-900 border-t border-red-700' : 'text-red-600 bg-red-100 border-t border-red-200'} text-center`}>{error}</p>}
        
        {!importedAiInstance && 
          <div className={`p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            <p className={`text-center text-sm ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                AI Service not available. Chatbot features are disabled.
            </p>
          </div>
        }

        {importedAiInstance && <form onSubmit={handleSendMessage} className={`p-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'} flex items-center space-x-2`}>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask about famous spots..."
            aria-label="Your message"
            disabled={isLoading || enrichingMessageId !== null || !importedAiInstance}
            className={`flex-grow p-3 border rounded-lg focus:ring-2 outline-none transition-shadow ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:ring-cyan-500' : 'border-slate-300 placeholder-slate-400 focus:ring-cyan-500'}`}
          />
          <button 
            type="submit" 
            disabled={isLoading || enrichingMessageId !== null || !userInput.trim() || !importedAiInstance}
            aria-label="Send message"
            className={`p-3 rounded-lg text-white transition-colors ${isLoading || enrichingMessageId !== null || !userInput.trim() || !importedAiInstance ? (isDarkMode ? 'bg-slate-600 cursor-not-allowed' : 'bg-slate-400 cursor-not-allowed') : (isDarkMode ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-cyan-600 hover:bg-cyan-700')}`}
          >
            <Send size={20} />
          </button>
        </form>}
      </div>
    </div>
  );
};

export default ChatbotModal;
