import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const VOICE_COMMANDS = {
  'open dashboard': '/',
  'go to dashboard': '/',
  'dashboard': '/',
  'open settings': '/settings',
  'settings': '/settings',
  'configure profile': '/settings',
  'open survey': '/questionnaire',
  'start survey': '/questionnaire',
  'daily survey': '/questionnaire',
  'open games': '/games',
  'start games': '/games',
  'cognitive hub': '/games',
  'open analytics': '/analytics',
  'bio analytics': '/analytics',
  'analytics': '/analytics',
  'open medications': '/medications',
  'medications': '/medications',
  'open timeline': '/timeline',
  'timeline': '/timeline',
  'open forecast': '/forecast',
  'forecast': '/forecast',
  'open chatbot': '/chatbot',
  'ai assistant': '/chatbot',
  'open motion coach': '/motion-coach',
  'motion coach': '/motion-coach',
  'exercise': '/motion-coach',
  'start memory game': '/game/memory',
  'memory match': '/game/memory',
  'start spiral': '/game/spiral',
  'spiral drawing': '/game/spiral',
  'start reaction': '/game/reaction',
  'reaction tap': '/game/reaction',
  'start word recall': '/game/word-recall',
  'word recall': '/game/word-recall',
  'start number span': '/game/number-span',
  'number span': '/game/number-span',
  'start dual task': '/game/dual-task',
  'dual task': '/game/dual-task',
};

const useVoiceNavigation = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript.toLowerCase().trim();
        setTranscript(spokenText);
        handleCommand(spokenText);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { /* safe */ }
      }
    };
  }, []);

  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleCommand = useCallback((spokenText) => {
    // Find the best matching command
    let matchedRoute = null;
    let matchedCommand = null;

    // Try exact match first
    if (VOICE_COMMANDS[spokenText]) {
      matchedRoute = VOICE_COMMANDS[spokenText];
      matchedCommand = spokenText;
    } else {
      // Try partial match
      for (const [cmd, route] of Object.entries(VOICE_COMMANDS)) {
        if (spokenText.includes(cmd)) {
          matchedRoute = route;
          matchedCommand = cmd;
          break;
        }
      }
    }

    if (matchedRoute) {
      speak(`Navigating to ${matchedCommand}`);
      setTimeout(() => navigate(matchedRoute), 500);
    } else {
      speak(`Sorry, I did not understand the command: ${spokenText}`);
    }
  }, [navigate, speak]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    supported,
    startListening,
    stopListening,
    speak
  };
};

export default useVoiceNavigation;
